describe('Auth Guards - RequireAuth & PublicOnly', () => {
  describe('RequireAuth Guard', () => {
    it('should redirect unauthenticated users to /auth with next param', () => {
      // Mock no session
      cy.intercept('GET', '**/auth/v1/user*', {
        statusCode: 401,
        body: { error: 'Not authenticated' }
      });

      cy.visit('/orders');
      
      // Should redirect to auth with next parameter
      cy.url().should('include', '/auth?mode=login');
      cy.url().should('include', 'next=%2Forders');
    });

    it('should allow authenticated users to access protected routes', () => {
      // Mock authenticated session
      cy.intercept('GET', '**/auth/v1/user*', {
        statusCode: 200,
        body: {
          id: 'test-user',
          email: 'test@example.com'
        }
      });

      cy.visit('/orders');
      
      // Should stay on protected route
      cy.url().should('include', '/orders');
    });

    it('should redirect to original path after login (next param)', () => {
      // Start unauthenticated
      cy.intercept('GET', '**/auth/v1/user*', {
        statusCode: 401,
        body: { error: 'Not authenticated' }
      }).as('checkSession');

      cy.visit('/cart');
      
      // Should redirect to auth with next=/cart
      cy.wait('@checkSession');
      cy.url().should('include', '/auth?mode=login');
      cy.url().should('include', 'next=%2Fcart');
      
      // Mock successful login
      cy.intercept('POST', '**/auth/v1/token*', {
        statusCode: 200,
        body: {
          access_token: 'test-token',
          user: { id: 'test-user', email: 'test@example.com' }
        }
      }).as('login');

      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      cy.wait('@login');
      
      // Should redirect back to /cart
      cy.url().should('include', '/cart');
    });
  });

  describe('PublicOnly Guard', () => {
    it('should redirect authenticated users away from /auth', () => {
      // Mock authenticated session
      cy.intercept('GET', '**/auth/v1/user*', {
        statusCode: 200,
        body: {
          id: 'test-user',
          email: 'test@example.com'
        }
      });

      cy.visit('/auth?mode=login');
      
      // Should redirect to home
      cy.url().should('include', '/home?tab=for-you');
    });

    it('should allow unauthenticated users to view /auth', () => {
      cy.intercept('GET', '**/auth/v1/user*', {
        statusCode: 401,
        body: { error: 'Not authenticated' }
      });

      cy.visit('/auth?mode=login');
      
      // Should stay on auth page
      cy.url().should('include', '/auth');
      cy.contains('Welcome Back').should('be.visible');
    });
  });

  describe('401 Handler', () => {
    it('should redirect to login when API returns 401', () => {
      // Start authenticated
      cy.intercept('GET', '**/auth/v1/user*', {
        statusCode: 200,
        body: { id: 'test-user', email: 'test@example.com' }
      });

      cy.visit('/orders');
      
      // API call returns 401 (expired session)
      cy.intercept('GET', '**/rest/v1/orders*', {
        statusCode: 401,
        body: { error: 'Unauthorized' }
      }).as('unauthorizedAPI');

      cy.wait('@unauthorizedAPI');
      
      // Should redirect to login
      cy.url().should('include', '/auth?mode=login');
    });
  });

  describe('Logout Flow', () => {
    it('should clear storage except theme and locale', () => {
      // Set various localStorage items
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('locale', 'en');
      localStorage.setItem('session_data', 'should-be-cleared');
      localStorage.setItem('user_preferences', 'should-be-cleared');

      cy.intercept('POST', '**/auth/v1/logout*', {
        statusCode: 200,
        body: {}
      }).as('logout');

      // Trigger logout
      cy.visit('/profile/me');
      cy.contains('Sign Out').click();

      cy.wait('@logout');
      
      // Check storage
      cy.window().then((win) => {
        expect(win.localStorage.getItem('theme')).to.equal('dark');
        expect(win.localStorage.getItem('locale')).to.equal('en');
        expect(win.localStorage.getItem('session_data')).to.be.null;
        expect(win.localStorage.getItem('user_preferences')).to.be.null;
      });

      // Should redirect to login
      cy.url().should('include', '/auth?mode=login');
    });
  });
});
