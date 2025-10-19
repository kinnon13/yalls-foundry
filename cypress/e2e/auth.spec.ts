describe('Auth - Login, Signup, Reset', () => {
  beforeEach(() => {
    cy.visit('/auth?mode=login');
  });

  describe('Auth Page Structure', () => {
    it('should show login mode by default', () => {
      cy.visit('/auth');
      cy.contains('Welcome Back').should('be.visible');
      cy.contains('Sign In').should('be.visible');
    });

    it('should switch between login and signup modes', () => {
      cy.contains('button', 'Sign Up').click();
      cy.contains('Create Account').should('be.visible');
      
      cy.contains('button', 'Sign In').click();
      cy.contains('Welcome Back').should('be.visible');
    });

    it('should show SSO buttons on login and signup', () => {
      cy.get('[data-testid="sso-google"]').should('be.visible');
      cy.get('[data-testid="sso-apple"]').should('be.visible');
      
      cy.contains('button', 'Sign Up').click();
      cy.get('[data-testid="sso-google"]').should('be.visible');
      cy.get('[data-testid="sso-apple"]').should('be.visible');
    });

    it('should not show SSO buttons on reset', () => {
      cy.contains('Forgot password?').click();
      cy.contains('Reset Password').should('be.visible');
      cy.get('[data-testid="sso-google"]').should('not.exist');
      cy.get('[data-testid="sso-apple"]').should('not.exist');
    });
  });

  describe('Login Flow', () => {
    it('should login with valid credentials', () => {
      cy.intercept('POST', '**/auth/v1/token*', {
        statusCode: 200,
        body: {
          access_token: 'test-token',
          user: { id: 'test-user', email: 'test@example.com' }
        }
      }).as('login');

      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      cy.wait('@login');
      cy.url().should('include', '/home?tab=for-you');
    });

    it('should show error for invalid credentials', () => {
      cy.intercept('POST', '**/auth/v1/token*', {
        statusCode: 400,
        body: { error: 'Invalid credentials' }
      }).as('loginFail');

      cy.get('input[type="email"]').type('wrong@example.com');
      cy.get('input[type="password"]').type('wrongpass');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginFail');
      cy.contains('Sign in failed').should('be.visible');
    });

    it('should validate email format', () => {
      cy.get('input[type="email"]').type('invalid-email');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      cy.contains('Invalid email address').should('be.visible');
    });

    it('should redirect authenticated users to next param', () => {
      cy.intercept('GET', '**/auth/v1/user*', {
        statusCode: 200,
        body: { id: 'test-user', email: 'test@example.com' }
      });

      cy.visit('/auth?mode=login&next=%2Forders');
      
      // Should redirect to /orders since user is authenticated
      cy.url().should('include', '/orders');
    });
  });

  describe('Signup Flow', () => {
    beforeEach(() => {
      cy.contains('button', 'Sign Up').click();
    });

    it('should show confirmation screen after signup', () => {
      cy.intercept('POST', '**/auth/v1/signup*', {
        statusCode: 200,
        body: {
          user: { id: 'new-user', email: 'new@example.com' },
          session: null // No session until email confirmed
        }
      }).as('signup');

      cy.get('input[type="email"]').type('new@example.com');
      cy.get('input[type="password"]').type('SecurePass123');
      cy.get('button[type="submit"]').click();

      cy.wait('@signup');
      cy.contains('Check Your Email').should('be.visible');
      cy.contains('confirmation link to new@example.com').should('be.visible');
    });

    it('should validate password requirements', () => {
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('123'); // Too short
      cy.get('button[type="submit"]').click();

      cy.contains('Password must be at least 6 characters').should('be.visible');
    });

    it('should handle duplicate email error', () => {
      cy.intercept('POST', '**/auth/v1/signup*', {
        statusCode: 400,
        body: { error: 'User already registered' }
      }).as('signupDupe');

      cy.get('input[type="email"]').type('existing@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      cy.wait('@signupDupe');
      cy.contains('Sign up failed').should('be.visible');
    });
  });

  describe('Password Reset Flow', () => {
    beforeEach(() => {
      cy.contains('Forgot password?').click();
    });

    it('should show confirmation after reset request', () => {
      cy.intercept('POST', '**/auth/v1/recover*', {
        statusCode: 200,
        body: {}
      }).as('resetPassword');

      cy.get('input[type="email"]').type('forgot@example.com');
      cy.get('button[type="submit"]').click();

      cy.wait('@resetPassword');
      cy.contains('Check Your Email').should('be.visible');
      cy.contains('password reset link to forgot@example.com').should('be.visible');
    });

    it('should allow returning to login from confirmation', () => {
      cy.intercept('POST', '**/auth/v1/recover*', {
        statusCode: 200,
        body: {}
      });

      cy.get('input[type="email"]').type('test@example.com');
      cy.get('button[type="submit"]').click();

      cy.wait(500);
      cy.contains('Back to Sign In').click();
      cy.contains('Welcome Back').should('be.visible');
    });
  });

  describe('SSO Flows', () => {
    it('should trigger Google OAuth flow', () => {
      cy.intercept('POST', '**/auth/v1/sso*', {
        statusCode: 200,
        body: { url: 'https://accounts.google.com/oauth...' }
      }).as('ssoGoogle');

      cy.get('[data-testid="sso-google"]').click();
      cy.wait('@ssoGoogle');
    });

    it('should trigger Apple OAuth flow', () => {
      cy.intercept('POST', '**/auth/v1/sso*', {
        statusCode: 200,
        body: { url: 'https://appleid.apple.com/oauth...' }
      }).as('ssoApple');

      cy.get('[data-testid="sso-apple"]').click();
      cy.wait('@ssoApple');
    });
  });

  describe('Telemetry', () => {
    it('should track auth_view event on mount', () => {
      cy.intercept('POST', '**/rest/v1/rocker_events*', (req) => {
        expect(req.body.event_type).to.equal('auth_view');
        req.reply({ statusCode: 201, body: {} });
      }).as('telemetryView');

      cy.visit('/auth?mode=login');
      cy.wait('@telemetryView');
    });

    it('should track auth_submit and auth_success on login', () => {
      let submitTracked = false;
      let successTracked = false;

      cy.intercept('POST', '**/rest/v1/rocker_events*', (req) => {
        if (req.body.event_type === 'auth_submit') submitTracked = true;
        if (req.body.event_type === 'auth_success') successTracked = true;
        req.reply({ statusCode: 201, body: {} });
      });

      cy.intercept('POST', '**/auth/v1/token*', {
        statusCode: 200,
        body: {
          access_token: 'test-token',
          user: { id: 'test-user', email: 'test@example.com' }
        }
      });

      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      cy.wait(500).then(() => {
        expect(submitTracked).to.be.true;
        expect(successTracked).to.be.true;
      });
    });
  });
});
