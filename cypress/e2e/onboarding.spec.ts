/**
 * E2E Tests: Onboarding Wizard
 * Covers all 6 steps: acquisition, handle, interests, notifications, business, follows
 */

describe('Onboarding Flow', () => {
  beforeEach(() => {
    // Mock authenticated user without completed onboarding
    cy.intercept('GET', '**/auth/v1/user*', {
      statusCode: 200,
      body: { id: 'test-user-new', email: 'new@example.com' }
    });

    cy.intercept('GET', '**/rest/v1/profiles?user_id=eq.test-user-new*', {
      statusCode: 200,
      body: [{
        user_id: 'test-user-new',
        handle: null,
        display_name: null,
        onboarding_complete: false
      }]
    });

    cy.visit('/onboarding');
  });

  describe('Step 0: Acquisition', () => {
    it('should show invite source options', () => {
      cy.contains('How did you hear about us?').should('be.visible');
      cy.contains('A friend or colleague invited me').should('be.visible');
      cy.contains('A business or organization invited me').should('be.visible');
      cy.contains('Other').should('be.visible');
    });

    it('should require free text when selecting Other', () => {
      cy.intercept('POST', '**/rest/v1/rpc/set_user_acquisition*', {
        statusCode: 200,
        body: {}
      });

      cy.get('input[value="other"]').click();
      cy.get('[data-testid="invite-submit"]').click();

      // Should show validation
      cy.contains('tell us how you found us', { matchCase: false }).should('be.visible');
    });

    it('should save acquisition and proceed', () => {
      cy.intercept('POST', '**/rest/v1/rpc/set_user_acquisition*', {
        statusCode: 200,
        body: {}
      }).as('saveAcquisition');

      cy.get('input[value="other"]').click();
      cy.get('#free-text').type('Google search');
      cy.get('[data-testid="invite-submit"]').click();

      cy.wait('@saveAcquisition');
      cy.contains('Choose Your Handle').should('be.visible');
    });
  });

  describe('Step 1: Handle', () => {
    beforeEach(() => {
      // Skip to handle step
      cy.intercept('POST', '**/rest/v1/rpc/set_user_acquisition*', { statusCode: 200, body: {} });
      cy.get('input[value="unknown"]').click();
      cy.get('[data-testid="invite-submit"]').click();
      cy.wait(500);
    });

    it('should check handle availability', () => {
      cy.intercept('POST', '**/rest/v1/rpc/check_handle_available*', {
        statusCode: 200,
        body: true
      }).as('checkHandle');

      cy.get('#handle').type('testuser');
      cy.wait('@checkHandle');
      cy.contains('✓ Available').should('be.visible');
    });

    it('should block taken handles', () => {
      cy.intercept('POST', '**/rest/v1/rpc/check_handle_available*', {
        statusCode: 200,
        body: false
      });

      cy.get('#handle').type('taken');
      cy.wait(500);
      cy.contains('already taken', { matchCase: false }).should('be.visible');
    });

    it('should validate handle format', () => {
      cy.get('#handle').type('AB'); // Too short, uppercase
      cy.wait(500);
      cy.contains('3-20 characters', { matchCase: false }).should('be.visible');
    });

    it('should save handle and display name', () => {
      cy.intercept('POST', '**/rest/v1/rpc/check_handle_available*', { statusCode: 200, body: true });
      cy.intercept('PATCH', '**/rest/v1/profiles*', { statusCode: 204, body: {} }).as('saveHandle');

      cy.get('#handle').type('newuser');
      cy.get('#display-name').type('New User');
      cy.wait(500);
      cy.contains('Continue').click();

      cy.wait('@saveHandle');
    });
  });

  describe('Step 2: Interests', () => {
    beforeEach(() => {
      // Skip to interests step
      cy.intercept('POST', '**/rest/v1/rpc/set_user_acquisition*', { statusCode: 200, body: {} });
      cy.intercept('POST', '**/rest/v1/rpc/check_handle_available*', { statusCode: 200, body: true });
      cy.intercept('PATCH', '**/rest/v1/profiles*', { statusCode: 204, body: {} });
      
      cy.get('input[value="unknown"]').click();
      cy.get('[data-testid="invite-submit"]').click();
      cy.wait(300);
      cy.get('#handle').type('test');
      cy.get('#display-name').type('Test');
      cy.wait(300);
      cy.contains('Continue').click();
      cy.wait(500);
    });

    it('should load interests catalog', () => {
      cy.intercept('GET', '**/rest/v1/interests_catalog*', {
        statusCode: 200,
        body: [
          { id: '1', category: 'Discipline', tag: 'Dressage', sort_order: 1 },
          { id: '2', category: 'Discipline', tag: 'Show Jumping', sort_order: 2 }
        ]
      });

      cy.wait(500);
      cy.contains('Dressage').should('be.visible');
      cy.contains('Show Jumping').should('be.visible');
    });

    it('should require at least one interest', () => {
      cy.contains('Continue').should('be.disabled');
    });
  });

  describe('Resume Capability', () => {
    it('should resume from saved step', () => {
      cy.intercept('GET', '**/rest/v1/profiles_onboarding_progress*', {
        statusCode: 200,
        body: [{
          user_id: 'test-user-new',
          step: 'interests',
          data: {}
        }]
      });

      cy.visit('/onboarding');
      cy.wait(500);

      // Should show interests step
      cy.contains('What Are You Into?').should('be.visible');
    });
  });

  describe('Complete Flow', () => {
    it('should complete onboarding and redirect to home', () => {
      cy.intercept('POST', '**/rest/v1/rpc/complete_onboarding*', {
        statusCode: 200,
        body: {}
      }).as('completeOnboarding');

      // Mock all steps quickly
      cy.intercept('POST', '**/rest/v1/rpc/set_user_acquisition*', { statusCode: 200, body: {} });
      cy.intercept('POST', '**/rest/v1/rpc/check_handle_available*', { statusCode: 200, body: true });
      cy.intercept('**/rest/v1/profiles*', { statusCode: 204, body: {} });
      cy.intercept('**/rest/v1/interests_catalog*', {
        body: [{ id: '1', category: 'Test', tag: 'Tag1', sort_order: 1 }]
      });
      cy.intercept('**/rest/v1/follows*', { statusCode: 201, body: {} });

      // Step 0
      cy.get('input[value="unknown"]').click();
      cy.get('[data-testid="invite-submit"]').click();
      cy.wait(300);

      // Step 1
      cy.get('#handle').type('completeuser');
      cy.get('#display-name').type('Complete User');
      cy.wait(300);
      cy.contains('Continue').click();
      cy.wait(300);

      // Step 2
      cy.get('input[type="checkbox"]').first().click();
      cy.contains('Continue').click();
      cy.wait(300);

      // Step 3
      cy.contains('Continue').click();
      cy.wait(300);

      // Step 4 - Skip business
      cy.contains('Skip').click();
      cy.wait(300);

      // Step 5 - Skip follows, triggers completion
      cy.contains('Skip for Now').click();

      cy.wait('@completeOnboarding');
      cy.url().should('include', '/home?tab=for-you');
    });
  });

  describe('Telemetry', () => {
    it('should track onboarding steps', () => {
      let acquisitionTracked = false;
      let completeTracked = false;

      cy.intercept('POST', '**/rest/v1/rocker_events*', (req) => {
        if (req.body.event_type === 'acquisition_capture') acquisitionTracked = true;
        if (req.body.event_type === 'onboarding_complete') completeTracked = true;
        req.reply({ statusCode: 201, body: {} });
      });

      cy.intercept('POST', '**/rest/v1/rpc/set_user_acquisition*', { statusCode: 200, body: {} });
      cy.get('input[value="unknown"]').click();
      cy.get('[data-testid="invite-submit"]').click();

      cy.wait(500).then(() => {
        expect(acquisitionTracked).to.be.true;
      });
    });
  });
});
