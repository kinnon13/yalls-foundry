/**
 * Auth Rate Limiting & CAPTCHA Tests
 */

describe('Auth Rate Limiting', () => {
  beforeEach(() => {
    cy.visit('/auth?mode=login');
  });

  it('should allow first few login attempts', () => {
    // Mock rate limit check - allowed
    cy.intercept('POST', '**/rest/v1/rpc/check_auth_rate_limit', {
      statusCode: 200,
      body: {
        allowed: true,
        remaining: 8,
        needs_captcha: false,
        attempts: 2
      }
    }).as('rateLimitCheck');

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@rateLimitCheck');
  });

  it('should show warning when attempts are low', () => {
    // Mock rate limit - 3 attempts remaining
    cy.intercept('POST', '**/rest/v1/rpc/check_auth_rate_limit', {
      statusCode: 200,
      body: {
        allowed: true,
        remaining: 3,
        needs_captcha: false,
        attempts: 7
      }
    });

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // Should show warning
    cy.contains('3 attempts remaining').should('be.visible');
  });

  it('should show CAPTCHA after 6 attempts', () => {
    // Mock rate limit - needs CAPTCHA
    cy.intercept('POST', '**/rest/v1/rpc/check_auth_rate_limit', {
      statusCode: 200,
      body: {
        allowed: true,
        remaining: 4,
        needs_captcha: true,
        attempts: 6
      }
    });

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // Should show CAPTCHA screen
    cy.contains('Security Check').should('be.visible');
    cy.contains('verify you\'re human', { matchCase: false }).should('be.visible');
    cy.get('[data-testid="captcha-verify"]').should('be.visible');
  });

  it('should block login after 10 attempts', () => {
    // Mock rate limit - blocked
    cy.intercept('POST', '**/rest/v1/rpc/check_auth_rate_limit', {
      statusCode: 200,
      body: {
        allowed: false,
        remaining: 0,
        needs_captcha: true,
        retry_after: 300 // 5 minutes
      }
    });

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // Should show rate limit error
    cy.contains('Too many attempts').should('be.visible');
    cy.contains('5 minutes').should('be.visible');
  });

  it('should reset rate limit on successful login', () => {
    // Mock successful login
    cy.intercept('POST', '**/auth/v1/token*', {
      statusCode: 200,
      body: {
        access_token: 'test-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }
    });

    // Mock rate limit reset
    cy.intercept('POST', '**/rest/v1/rpc/reset_auth_rate_limit', {
      statusCode: 200,
      body: {}
    }).as('resetRateLimit');

    cy.intercept('POST', '**/rest/v1/rpc/check_auth_rate_limit', {
      statusCode: 200,
      body: { allowed: true, remaining: 9, needs_captcha: false, attempts: 1 }
    });

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@resetRateLimit');
  });

  it('should track telemetry for rate limit events', () => {
    let rateLimitTracked = false;
    let captchaShownTracked = false;

    cy.intercept('POST', '**/rest/v1/rocker_events*', (req) => {
      if (req.body.event_type === 'auth_rate_limited') rateLimitTracked = true;
      if (req.body.event_type === 'auth_captcha_shown') captchaShownTracked = true;
      req.reply({ statusCode: 201, body: {} });
    });

    // Mock rate limit - blocked
    cy.intercept('POST', '**/rest/v1/rpc/check_auth_rate_limit', {
      statusCode: 200,
      body: { allowed: false, remaining: 0, needs_captcha: true, retry_after: 300 }
    });

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait(500).then(() => {
      expect(rateLimitTracked).to.be.true;
    });
  });
});

describe('CAPTCHA Flow', () => {
  beforeEach(() => {
    cy.visit('/auth?mode=login');
  });

  it('should allow verifying CAPTCHA', () => {
    // Trigger CAPTCHA
    cy.intercept('POST', '**/rest/v1/rpc/check_auth_rate_limit', {
      statusCode: 200,
      body: { allowed: true, remaining: 4, needs_captcha: true, attempts: 6 }
    });

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // Verify CAPTCHA (mock dialog)
    cy.get('[data-testid="captcha-verify"]').click();

    // Mock window.prompt for math challenge
    cy.window().then((win) => {
      cy.stub(win, 'prompt').returns('2'); // Mock correct answer
    });

    // Should show success and return to login
    cy.contains('✓ Verified').should('be.visible');
  });

  it('should allow skipping CAPTCHA', () => {
    // Trigger CAPTCHA
    cy.intercept('POST', '**/rest/v1/rpc/check_auth_rate_limit', {
      statusCode: 200,
      body: { allowed: true, remaining: 4, needs_captcha: true, attempts: 6 }
    });

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // Skip CAPTCHA
    cy.contains('Skip').click();

    // Should return to login form
    cy.get('input[type="email"]').should('be.visible');
  });
});

describe('401 Interceptor', () => {
  it('should redirect to login on API 401', () => {
    // Mock authenticated state
    cy.intercept('GET', '**/auth/v1/user*', {
      statusCode: 200,
      body: { id: 'test-user', email: 'test@example.com' }
    });

    cy.visit('/home?tab=for-you');

    // Mock API 401
    cy.intercept('GET', '**/rest/v1/posts*', {
      statusCode: 401,
      body: { error: 'Unauthorized' }
    }).as('unauthorizedAPI');

    cy.wait('@unauthorizedAPI');

    // Should redirect to login with next param
    cy.url().should('include', '/auth?mode=login');
    cy.url().should('include', 'next=');
  });
});
