/**
 * Unit Tests: Auth Guards
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '@/lib/auth/context';
import { RequireAuth, WithRole, Can } from '@/lib/auth/guards';
import { mockAuthAdapter } from '@/lib/auth/adapters/mock';

// Helper to render with auth context
function renderWithAuth(ui: React.ReactElement, session: any = null) {
  // Mock the adapter to return controlled session
  const mockAdapter = {
    ...mockAuthAdapter,
    getSession: async () => session,
    onAuthStateChange: (cb: Function) => {
      cb(session);
      return () => {};
    },
  };

  return render(
    <AuthProvider adapter={mockAdapter}>
      {ui}
    </AuthProvider>
  );
}

describe('Auth Guards', () => {
  describe('RequireAuth', () => {
    it('should render children when authenticated', () => {
      const session = { userId: 'user1', email: 'test@test.com', role: 'guest' as const };
      renderWithAuth(
        <RequireAuth>
          <div>Protected Content</div>
        </RequireAuth>,
        session
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should show fallback when not authenticated', () => {
      renderWithAuth(
        <RequireAuth>
          <div>Protected Content</div>
        </RequireAuth>,
        null
      );

      expect(screen.getByText('Not authorized')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('WithRole', () => {
    it('should render children for allowed roles', () => {
      const session = { userId: 'user1', email: 'admin@test.com', role: 'admin' as const };
      renderWithAuth(
        <WithRole roles={['admin', 'moderator']}>
          <div>Admin Content</div>
        </WithRole>,
        session
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    it('should not render for disallowed roles', () => {
      const session = { userId: 'user1', email: 'guest@test.com', role: 'guest' as const };
      renderWithAuth(
        <WithRole roles={['admin', 'moderator']}>
          <div>Admin Content</div>
        </WithRole>,
        session
      );

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  describe('Can', () => {
    it('should render when user has permission', () => {
      const session = { userId: 'user1', email: 'admin@test.com', role: 'admin' as const };
      renderWithAuth(
        <Can action="read" subject="admin.area">
          <div>Admin Area</div>
        </Can>,
        session
      );

      expect(screen.getByText('Admin Area')).toBeInTheDocument();
    });

    it('should not render when user lacks permission', () => {
      const session = { userId: 'user1', email: 'guest@test.com', role: 'guest' as const };
      renderWithAuth(
        <Can action="read" subject="admin.area">
          <div>Admin Area</div>
        </Can>,
        session
      );

      expect(screen.queryByText('Admin Area')).not.toBeInTheDocument();
    });
  });
});
