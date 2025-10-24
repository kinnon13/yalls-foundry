/**
 * Role: E2E test for cart add/remove and one-tap checkout
 * Path: yalls-inc/yallmart/cypress/e2e/cart.spec.cy.ts
 */

describe('Yallmart - Shopping Cart', () => {
  beforeEach(() => {
    cy.visit('/cart');
    
    // Mock cart API
    cy.intercept('GET', '**/yallmart_cart_items*', {
      statusCode: 200,
      body: [],
    }).as('fetchCart');
  });

  it('should display empty cart', () => {
    cy.wait('@fetchCart');
    cy.contains('Your cart is empty').should('be.visible');
  });

  it('should add item to cart from social feed', () => {
    cy.visit('/feed');
    
    cy.intercept('POST', '**/yallmart_cart_items*', {
      statusCode: 201,
    }).as('addToCart');

    // Click quick buy on first product post
    cy.contains('Quick Buy').first().click();
    
    cy.wait('@addToCart');
    cy.contains('Added').should('be.visible');
  });

  it('should display cart items', () => {
    cy.intercept('GET', '**/yallmart_cart_items*', {
      statusCode: 200,
      body: [
        {
          id: 'cart-1',
          product_id: 'product-1',
          product_name: 'Test Product',
          product_price: 1999,
          quantity: 2,
        },
      ],
    }).as('fetchCartWithItems');

    cy.visit('/cart');
    cy.wait('@fetchCartWithItems');
    
    cy.contains('Test Product').should('be.visible');
    cy.contains('Qty: 2').should('be.visible');
    cy.contains('$19.99').should('be.visible');
  });

  it('should remove item from cart', () => {
    cy.intercept('GET', '**/yallmart_cart_items*', {
      statusCode: 200,
      body: [
        {
          id: 'cart-1',
          product_id: 'product-1',
          product_name: 'Test Product',
          quantity: 1,
        },
      ],
    });

    cy.intercept('DELETE', '**/yallmart_cart_items*', {
      statusCode: 204,
    }).as('removeFromCart');

    cy.visit('/cart');
    
    // Open cart embed
    cy.get('[data-testid="cart-button"]').click();
    
    // Remove item
    cy.get('button').contains('×').click();
    
    cy.wait('@removeFromCart');
  });

  it('should proceed to checkout', () => {
    cy.intercept('GET', '**/yallmart_cart_items*', {
      statusCode: 200,
      body: [
        { id: 'cart-1', product_id: 'product-1', quantity: 1, product_price: 1999 },
      ],
    });

    cy.intercept('POST', '**/functions/v1/yallmart-checkout*', {
      statusCode: 200,
      body: { url: 'https://checkout.stripe.com/test' },
    }).as('createCheckout');

    cy.visit('/cart');
    
    cy.contains('Checkout').click();
    
    cy.wait('@createCheckout');
  });
});
