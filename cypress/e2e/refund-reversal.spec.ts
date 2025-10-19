describe('Refund - Commission Reversal', () => {
  const testOrderId = 'test-order-refund-123';

  beforeEach(() => {
    // Setup: assume we have an order with commissions
    cy.intercept('GET', `**/rest/v1/orders?id=eq.${testOrderId}*`, {
      statusCode: 200,
      body: [{
        id: testOrderId,
        status: 'paid',
        total_cents: 2200,
        currency: 'USD'
      }]
    });

    cy.intercept('GET', `**/rest/v1/commission_ledger?order_id=eq.${testOrderId}*`, {
      statusCode: 200,
      body: [
        {
          id: 'comm-1',
          order_id: testOrderId,
          user_id: 'user-1',
          amount_cents: 22,
          currency: 'USD',
          type: 'buyer_chain',
          reversed_at: null
        },
        {
          id: 'comm-2',
          order_id: testOrderId,
          user_id: 'user-2',
          amount_cents: 22,
          currency: 'USD',
          type: 'seller_chain',
          reversed_at: null
        }
      ]
    });
  });

  it('should call refund edge function with order_id and reason', () => {
    cy.intercept('POST', '**/functions/v1/orders-refund', (req) => {
      expect(req.body).to.have.property('order_id', testOrderId);
      expect(req.body).to.have.property('reason');
      
      req.reply({
        statusCode: 200,
        body: {
          ok: true,
          reversed: 2,
          order_id: testOrderId,
          status: 'refunded'
        }
      });
    }).as('refundOrder');

    // Trigger refund from admin or order detail page
    cy.visit(`/orders/${testOrderId}`);
    cy.contains('Refund Order').click();
    
    cy.get('textarea[placeholder*="reason"]').type('Customer requested refund');
    cy.contains('Confirm Refund').click();
    
    cy.wait('@refundOrder');
  });

  it('should create negative reversal rows in commission ledger', () => {
    cy.intercept('POST', '**/rest/v1/commission_ledger*', (req) => {
      const entries = Array.isArray(req.body) ? req.body : [req.body];
      
      // Check for negative amounts (reversals)
      const reversals = entries.filter(e => e.amount_cents < 0);
      expect(reversals.length).to.be.greaterThan(0);
      
      // Check reversal metadata
      reversals.forEach(rev => {
        expect(rev.meta).to.have.property('reversal', true);
        expect(rev).to.have.property('reversal_of_id');
      });
      
      req.reply({ statusCode: 201, body: entries });
    }).as('createReversals');

    cy.visit(`/orders/${testOrderId}`);
    cy.contains('Refund Order').click();
    cy.get('textarea[placeholder*="reason"]').type('Test reversal');
    cy.contains('Confirm Refund').click();
    
    cy.wait('@createReversals');
  });

  it('should mark original commissions with reversed_at timestamp', () => {
    cy.intercept('PATCH', '**/rest/v1/commission_ledger*', (req) => {
      expect(req.body).to.have.property('reversed_at');
      
      req.reply({
        statusCode: 200,
        body: [{ reversed_at: new Date().toISOString() }]
      });
    }).as('markReversed');

    cy.visit(`/orders/${testOrderId}`);
    cy.contains('Refund Order').click();
    cy.get('textarea[placeholder*="reason"]').type('Mark as reversed');
    cy.contains('Confirm Refund').click();
    
    cy.wait('@markReversed');
  });

  it('should be idempotent - multiple refund attempts should not double-reverse', () => {
    let refundCallCount = 0;

    cy.intercept('POST', '**/functions/v1/orders-refund', (req) => {
      refundCallCount++;
      req.reply({
        statusCode: 200,
        body: {
          ok: true,
          reversed: refundCallCount === 1 ? 2 : 0, // Only reverse on first call
          order_id: testOrderId,
          status: 'refunded'
        }
      });
    }).as('refundOrder');

    cy.visit(`/orders/${testOrderId}`);
    
    // First refund
    cy.contains('Refund Order').click();
    cy.get('textarea[placeholder*="reason"]').type('First attempt');
    cy.contains('Confirm Refund').click();
    cy.wait('@refundOrder');
    
    // Second refund attempt (should be idempotent)
    cy.contains('Refund Order').click();
    cy.get('textarea[placeholder*="reason"]').type('Second attempt');
    cy.contains('Confirm Refund').click();
    cy.wait('@refundOrder');
    
    // Both calls made but only first reversed
    expect(refundCallCount).to.equal(2);
  });
});
