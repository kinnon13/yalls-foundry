describe('Onboarding - Invitation Acquisition', () => {
  beforeEach(() => {
    cy.visit('/onboarding');
  });

  it('should show invite source options', () => {
    cy.contains('How did you hear about us?').should('be.visible');
    
    cy.contains('A friend or colleague invited me').should('be.visible');
    cy.contains('A business or organization invited me').should('be.visible');
    cy.contains('Other').should('be.visible');
    cy.contains('I don\'t remember').should('be.visible');
  });

  it('should allow user to select friend/colleague option', () => {
    cy.contains('A friend or colleague invited me').click();
    
    // Should show optional fields
    cy.get('input[placeholder*="FRIEND"]').should('be.visible');
    cy.get('input[placeholder*="email, text"]').should('be.visible');
  });

  it('should allow user to select business option', () => {
    cy.contains('A business or organization invited me').click();
    
    // Should show optional fields
    cy.get('input[placeholder*="FRIEND"]').should('be.visible');
    cy.get('input[placeholder*="email, text"]').should('be.visible');
  });

  it('should allow user to select other option with free text', () => {
    cy.contains('Other').click();
    
    // Should show free text field
    cy.get('input[placeholder*="Google search"]').should('be.visible');
    cy.get('input[placeholder*="Google search"]').type('Saw it on Twitter');
  });

  it('should allow user to continue without detailed info', () => {
    cy.contains('I don\'t remember').click();
    
    cy.get('[data-testid="invite-submit"]').click();
    
    // Should proceed (in real flow, would navigate away)
    cy.wait(500);
  });

  it('should persist acquisition data to database', () => {
    // Intercept the upsert call
    cy.intercept('POST', '**/rest/v1/user_acquisition*', {
      statusCode: 201,
      body: {}
    }).as('saveAcquisition');
    
    cy.contains('Other').click();
    cy.get('input[placeholder*="Google search"]').type('Reddit recommendation');
    
    cy.get('[data-testid="invite-submit"]').click();
    
    cy.wait('@saveAcquisition').its('request.body').should((body) => {
      expect(body.invited_by_kind).to.equal('other');
      expect(body.invite_medium).to.include('Reddit');
    });
  });
});
