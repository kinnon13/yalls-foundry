/**
 * E2E Test: Business CRM Flow
 * Cypress: login owner → /business/crm → export CSV → approve expense → ACH wire
 */

describe('Business CRM Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('owner@yalls.biz');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('owner can export contacts CSV', () => {
    cy.visit('/business/crm');
    cy.contains('Export Contacts').click();
    cy.get('[data-testid="export-csv"]').click();

    // Stub: Verify download triggered (Cypress limitation: can't check file content)
    cy.get('.toast').should('contain', 'CSV exported successfully');
  });

  it('owner can approve expense and trigger ACH wire', () => {
    cy.visit('/business/payroll');
    cy.contains('Pending Expenses').should('be.visible');

    // Approve first expense
    cy.get('[data-testid="expense-item"]').first().within(() => {
      cy.contains('Approve').click();
    });

    // Verify toast and ACH event emitted
    cy.get('.toast').should('contain', 'Expense approved, ACH wire initiated');
    cy.wait(2000); // Stub: Wait for event bus propagation

    // Check yallspay ACH status (stub: mock API call)
    cy.request('/api/yallspay/ach-status').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.status).to.eq('processing');
    });
  });

  it('staff cannot export contacts', () => {
    // Logout and login as staff
    cy.contains('Logout').click();
    cy.visit('/login');
    cy.get('input[type="email"]').type('staff@yalls.biz');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.visit('/business/crm');
    cy.contains('Export Contacts').should('not.exist');
  });

  it('displays revenue summary chart', () => {
    cy.visit('/business/crm');
    cy.get('[data-testid="revenue-chart"]').should('be.visible');
    cy.contains('Monthly Revenue').should('be.visible');
  });
});
