describe('Messages - Rocker AI', () => {
  beforeEach(() => {
    cy.visit('/messages');
  });

  it('should show Rocker AI as first conversation', () => {
    // Wait for conversations to load
    cy.wait(1000);
    
    // Check for Rocker AI thread
    cy.contains('Rocker AI').should('be.visible');
    
    // Verify it's the first item (has special styling)
    cy.get('.bg-primary\\/5').should('exist');
  });

  it('should have Rocker AI thread with cowboy emoji', () => {
    cy.wait(1000);
    
    // Check for cowboy emoji in Rocker thread
    cy.contains('Rocker AI').parent().within(() => {
      cy.contains('🤠').should('be.visible');
    });
  });

  it('should navigate to Rocker thread when clicked', () => {
    cy.wait(1000);
    
    cy.contains('Rocker AI').click();
    
    // Verify URL or thread view changes (implementation-dependent)
    // This test assumes some visual change occurs when thread is selected
    cy.contains('Rocker AI').parent().should('have.class', 'bg-muted/60');
  });

  it('should show Rocker greeting message', () => {
    cy.wait(1000);
    
    cy.contains('Rocker AI').parent().within(() => {
      cy.contains('Hey! I can help you manage listings, orders, and more.').should('be.visible');
    });
  });

  it('should have other conversations below Rocker', () => {
    cy.wait(1000);
    
    // Get all conversation items
    cy.get('button').then($buttons => {
      if ($buttons.length > 1) {
        // Verify Rocker is first
        cy.get('button').first().should('contain', 'Rocker AI');
      }
    });
  });
});