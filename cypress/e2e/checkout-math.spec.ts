describe('Checkout - Multi-Currency Math', () => {
  beforeEach(() => {
    // Login and navigate to a listing
    cy.visit('/marketplace');
  });

  it('should calculate correct fees for $22 order', () => {
    // Find a $22 listing (or create one via fixture)
    cy.intercept('GET', '**/rest/v1/marketplace_listings*', {
      statusCode: 200,
      body: [{
        id: 'test-listing-22',
        price_cents: 2200,
        currency: 'USD',
        title: 'Test Item',
        status: 'active'
      }]
    });

    cy.visit('/marketplace/test-listing-22');
    
    cy.contains('Buy Now').click();
    
    // Checkout summary should show breakdown
    cy.contains('Subtotal').parent().should('contain', '$22.00');
    
    // Processing fee: 2.9% + $0.30 = $0.94
    cy.contains('Processing').parent().should('contain', '$0.94');
    
    // Platform fee: 4% = $0.88
    cy.contains('Platform').parent().should('contain', '$0.88');
    
    // Total with fees
    cy.contains('Total').parent().should('contain', '$23.82');
  });

  it('should store multi-currency snapshot on order creation', () => {
    cy.intercept('POST', '**/rest/v1/orders*', (req) => {
      expect(req.body).to.have.property('currency');
      expect(req.body).to.have.property('total_cents');
      expect(req.body).to.have.property('fx_rate');
      expect(req.body).to.have.property('total_usd_cents');
      
      req.reply({
        statusCode: 201,
        body: {
          id: 'test-order-123',
          ...req.body
        }
      });
    }).as('createOrder');

    // Trigger order creation flow
    cy.visit('/marketplace/test-listing-22');
    cy.contains('Buy Now').click();
    cy.contains('Confirm Purchase').click();
    
    cy.wait('@createOrder');
  });

  it('should reconcile commission splits correctly', () => {
    // $22 order should yield:
    // - Processing: $0.94
    // - Platform: $0.88
    // - Buyer chain: $0.22 (1%)
    // - Seller chain: $0.22 (1%)
    // - Seller net: $19.74
    
    cy.intercept('POST', '**/rest/v1/commission_ledger*', (req) => {
      const entries = Array.isArray(req.body) ? req.body : [req.body];
      
      // Verify commission amounts
      const buyerComm = entries.find(e => e.type === 'buyer_chain');
      const sellerComm = entries.find(e => e.type === 'seller_chain');
      
      if (buyerComm) expect(buyerComm.amount_cents).to.equal(22);
      if (sellerComm) expect(sellerComm.amount_cents).to.equal(22);
      
      req.reply({ statusCode: 201, body: entries });
    }).as('createCommissions');

    cy.visit('/marketplace/test-listing-22');
    cy.contains('Buy Now').click();
    cy.contains('Confirm Purchase').click();
    
    cy.wait('@createCommissions');
  });
});
