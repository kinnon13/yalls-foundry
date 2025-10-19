describe('Search Apps Tab', () => {
  beforeEach(() => {
    cy.visit('/discover');
  });

  it('should show Apps tab in search', () => {
    // Type search query
    cy.get('input[type="search"]').type('orders');
    cy.get('form').submit();
    
    // Wait for results
    cy.wait(500);
    
    // Check Apps tab exists
    cy.contains('button', 'Apps').should('be.visible');
    cy.contains('button', 'Apps').click();
    
    // Should show app cards
    cy.get('.space-y-2').should('exist');
  });

  it('should have Open button for installed apps', () => {
    cy.get('input[type="search"]').type('orders');
    cy.get('form').submit();
    cy.wait(500);
    
    cy.contains('button', 'Apps').click();
    
    // Find an installed app (Orders is marked as installed)
    cy.contains('Orders').parent().parent().within(() => {
      cy.contains('button', 'Open').should('be.visible');
    });
  });

  it('should have Install button for uninstalled apps', () => {
    cy.get('input[type="search"]').type('calendar');
    cy.get('form').submit();
    cy.wait(500);
    
    cy.contains('button', 'Apps').click();
    
    // Find an uninstalled app (Calendar is marked as not installed)
    cy.contains('Calendar').parent().parent().within(() => {
      cy.contains('button', 'Install').should('be.visible');
    });
  });

  it('should have Pin button for all apps', () => {
    cy.get('input[type="search"]').type('marketplace');
    cy.get('form').submit();
    cy.wait(500);
    
    cy.contains('button', 'Apps').click();
    
    cy.contains('Marketplace').parent().parent().within(() => {
      cy.contains('button', 'Pin').should('be.visible');
    });
  });

  it('should show empty state when no apps found', () => {
    cy.get('input[type="search"]').type('nonexistentapp123');
    cy.get('form').submit();
    cy.wait(500);
    
    cy.contains('button', 'Apps').click();
    
    cy.contains('No apps found').should('be.visible');
  });
});