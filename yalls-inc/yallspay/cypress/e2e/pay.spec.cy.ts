/**
 * Role: E2E test for MLM commission splitting
 * Path: yalls-inc/yallspay/cypress/e2e/pay.spec.cy.ts
 */

import { splitCommission } from '../../libs/utils/commission-splitter';

describe('Yallspay - MLM Commission Splitting', () => {
  it('should correctly calculate 3-tier commission splits', () => {
    const result = splitCommission({
      transactionAmount: 100,
      userId: 'user123',
      uplineChain: ['upline1', 'upline2', 'upline3'],
    });

    expect(result.upline1).to.equal(10); // 10% of 100
    expect(result.upline2).to.equal(2); // 20% of 10
    expect(result.upline3).to.equal(0.6); // 30% of 2
    expect(result.platform).to.equal(5); // 5% of 100
    expect(result.user).to.equal(85); // 100 - 10 - 5
    expect(result.total).to.equal(100);
  });

  it('should handle transactions without full upline chain', () => {
    const result = splitCommission({
      transactionAmount: 50,
      userId: 'user456',
      uplineChain: ['upline1'], // Only 1 upline
    });

    expect(result.upline1).to.equal(5); // 10% of 50
    expect(result.upline2).to.equal(1); // 20% of 5
    expect(result.upline3).to.equal(0.3); // 30% of 1
    expect(result.user).to.equal(42.5); // 50 - 5 - 2.5
  });

  it('should display payout history on /pay page', () => {
    cy.visit('/yallspay/pay');
    cy.get('[data-testid="payout-table"]').should('be.visible');
    cy.contains('Payout History').should('exist');
  });

  it('should request payout', () => {
    cy.visit('/yallspay/pay');
    cy.get('[data-testid="request-payout-button"]').click();
    cy.get('[data-testid="payout-amount-input"]').type('100');
    cy.get('[data-testid="confirm-payout-button"]').click();
    cy.contains('Payout requested successfully').should('be.visible');
  });

  it('should show residual earnings', () => {
    cy.visit('/yallspay/pay');
    cy.get('[data-testid="residual-earnings"]').should('be.visible');
    cy.contains('$').should('exist'); // Should display dollar amount
  });
});
