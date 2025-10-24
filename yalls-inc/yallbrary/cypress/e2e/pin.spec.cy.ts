/**
 * Role: E2E test for widget pinning and drag-drop functionality
 * Path: yalls-inc/yallbrary/cypress/e2e/pin.spec.cy.ts
 */

describe('Yallbrary - Widget Pinning', () => {
  beforeEach(() => {
    // Stub: Mock auth and seed data
    cy.visit('/?app=yallbrary');
    cy.intercept('GET', '**/yallbrary_apps*', {
      statusCode: 200,
      body: [
        { id: 'yalls-social', title: 'Yalls Social', description: 'Social feeds', is_public: true },
        { id: 'yallmart', title: 'Yall Mart', description: 'Shopping', is_public: true },
      ],
    });
    cy.intercept('GET', '**/yallbrary_pins*', { statusCode: 200, body: [] });
  });

  it('should display available apps', () => {
    cy.get('[data-testid="yallbrary-widget-grid"]').should('exist');
    cy.contains('Yalls Social').should('be.visible');
    cy.contains('Yall Mart').should('be.visible');
  });

  it('should pin an app', () => {
    cy.intercept('POST', '**/yallbrary_pins*', { statusCode: 201 }).as('pinApp');
    
    cy.contains('Yalls Social').parent().parent().parent().within(() => {
      cy.contains('Pin').click();
    });

    cy.wait('@pinApp');
    cy.contains('Unpin').should('be.visible');
  });

  it('should unpin an app', () => {
    cy.intercept('DELETE', '**/yallbrary_pins*', { statusCode: 204 }).as('unpinApp');
    
    // Assume app is already pinned
    cy.contains('Yalls Social').parent().parent().parent().within(() => {
      cy.contains('Unpin').click();
    });

    cy.wait('@unpinApp');
    cy.contains('Pin').should('be.visible');
  });

  it('should drag and reorder widgets', () => {
    cy.intercept('POST', '**/yallbrary_pins*', { statusCode: 200 }).as('reorder');

    // Stub: dnd-kit drag simulation (use real coordinates in production)
    cy.get('[data-testid="yallbrary-widget-grid"]').children().first().trigger('pointerdown');
    cy.get('[data-testid="yallbrary-widget-grid"]').children().last().trigger('pointerup');

    cy.wait('@reorder');
  });
});
