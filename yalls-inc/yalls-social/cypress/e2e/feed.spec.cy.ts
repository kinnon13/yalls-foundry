/**
 * Role: E2E test for infinite scroll feed and one-tap shopping
 * Path: yalls-inc/yalls-social/cypress/e2e/feed.spec.cy.ts
 */

describe('Yalls Social - Feed', () => {
  beforeEach(() => {
    cy.visit('/feed');
    
    // Mock feed API
    cy.intercept('GET', '**/yalls_social_posts*', {
      statusCode: 200,
      body: Array.from({ length: 20 }, (_, i) => ({
        id: `post-${i}`,
        user_id: 'user-1',
        content: `Viral post ${i}`,
        media_url: `https://picsum.photos/seed/${i}/800/600`,
        likes_count: Math.floor(Math.random() * 500),
        comments_count: Math.floor(Math.random() * 50),
        viral_score: Math.random() * 100,
        product_id: i % 3 === 0 ? `product-${i}` : null,
        created_at: new Date().toISOString(),
      })),
    }).as('fetchFeed');
  });

  it('should display feed posts', () => {
    cy.wait('@fetchFeed');
    cy.get('[data-testid="yalls-social-feed"]').should('exist');
    cy.contains('Viral post 0').should('be.visible');
  });

  it('should infinite scroll and load more posts', () => {
    cy.wait('@fetchFeed');
    
    // Scroll to bottom
    cy.scrollTo('bottom');
    
    // Should trigger next page fetch
    cy.wait('@fetchFeed');
    cy.contains('Viral post 20').should('be.visible');
  });

  it('should quick buy from feed post', () => {
    cy.wait('@fetchFeed');
    
    cy.intercept('POST', '**/yallmart_cart_items*', {
      statusCode: 201,
    }).as('addToCart');

    // Click quick buy on first product post
    cy.contains('Quick Buy').first().click();
    
    cy.wait('@addToCart');
    cy.contains('Added').should('be.visible');
  });

  it('should like a post', () => {
    cy.wait('@fetchFeed');
    
    cy.intercept('POST', '**/yalls_social_likes*', {
      statusCode: 201,
    }).as('likePost');

    cy.get('button').contains('0').first().click();
    
    cy.wait('@likePost');
    cy.get('button').contains('1').should('exist');
  });

  it('should be responsive on mobile', () => {
    cy.viewport('iphone-x');
    cy.wait('@fetchFeed');
    
    // Should show single column on mobile
    cy.get('[data-testid="yalls-social-feed"]')
      .find('.grid')
      .should('have.class', 'grid-cols-1');
  });
});
