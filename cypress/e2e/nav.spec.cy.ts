/**
 * Role: E2E test for unified navigation
 * Path: cypress/e2e/nav.spec.cy.ts
 */

describe('Unified Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display navigation on desktop', () => {
    cy.viewport(1280, 720);
    cy.contains('Yalls Apps').should('be.visible');
  });

  it('should navigate to yallbrary', () => {
    cy.viewport(1280, 720);
    cy.contains('Library').click();
    cy.url().should('include', 'app=yallbrary');
  });

  it('should show hamburger menu on mobile', () => {
    cy.viewport(375, 667);
    cy.get('[data-testid="mobile-menu-button"]').should('exist');
  });
});
