describe('Footer Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display footer on main pages', () => {
    cy.visit('/home?tab=for-you');
    cy.get('nav[aria-label="Bottom dock"]').should('be.visible');
    
    cy.visit('/discover');
    cy.get('nav[aria-label="Bottom dock"]').should('be.visible');
    
    cy.visit('/messages');
    cy.get('nav[aria-label="Bottom dock"]').should('be.visible');
  });

  it('should hide footer on auth pages', () => {
    cy.visit('/auth?mode=login');
    cy.get('nav[aria-label="Bottom dock"]').should('not.exist');
  });

  it('should navigate to all footer links', () => {
    cy.visit('/home?tab=for-you');
    
    // Test Home
    cy.contains('Home').click();
    cy.url().should('include', '/home?tab=for-you');
    
    // Test Search
    cy.contains('Search').click();
    cy.url().should('include', '/discover');
    
    // Test Create
    cy.contains('Create').click();
    cy.url().should('include', '/create');
    
    // Test Inbox
    cy.contains('Inbox').click();
    cy.url().should('include', '/messages');
    
    // Test Profile
    cy.contains('Profile').click();
    cy.url().should('include', '/profile/me');
  });

  it('should have 5 navigation items', () => {
    cy.visit('/home');
    cy.get('nav[aria-label="Bottom dock"]').within(() => {
      cy.get('a, button').should('have.length', 5);
    });
  });
});