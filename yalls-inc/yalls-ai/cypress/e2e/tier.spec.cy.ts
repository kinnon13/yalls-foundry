/**
 * Role: E2E test for tiered AI capability gating
 * Path: yalls-inc/yalls-ai/cypress/e2e/tier.spec.cy.ts
 */

describe('Yalls AI - Tiered Access', () => {
  beforeEach(() => {
    cy.visit('/yalls-ai/tiered');
  });

  it('should load AI Nudge for user role', () => {
    cy.get('[data-testid="ai-nudge"]').should('be.visible');
    cy.contains('Follow @creator123').should('exist');
  });

  it('should gate creator-tier features for user role', () => {
    // Attempt to access creator feature
    cy.request({
      url: '/api/ai/monetize-ideas',
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403); // Forbidden
    });
  });

  it('should allow creator to access monetization ideas', () => {
    // Mock creator role
    cy.window().then((win) => {
      win.localStorage.setItem('user_role', 'creator');
    });

    cy.reload();
    cy.get('[data-testid="monetize-button"]').click();
    cy.contains('Launch premium content tier').should('be.visible');
  });

  it('should allow business to forecast revenue', () => {
    // Mock business role
    cy.window().then((win) => {
      win.localStorage.setItem('user_role', 'business');
    });

    cy.reload();
    cy.get('[data-testid="forecast-button"]').click();
    cy.contains('Revenue forecast').should('be.visible');
  });

  it('should refresh AI suggestions', () => {
    cy.get('[data-testid="refresh-suggestions"]').click();
    cy.contains('Loading suggestions').should('be.visible');
    cy.contains('Follow @creator123', { timeout: 5000 }).should('be.visible');
  });
});
