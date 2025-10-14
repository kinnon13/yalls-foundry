/**
 * Integration Tests: Protected Routes
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth/context';
import { RequireAuth } from '@/lib/auth/guards';
import { mockAuthAdapter } from '@/lib/auth/adapters/mock';

// Mock admin component
function AdminPage() {
  return <div>Admin Dashboard</div>;
}

// Helper to render routes with auth
function renderProtectedRoute(initialPath: string, session: any = null) {
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
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminPage />
              </RequireAuth>
            }
          />
          <Route path="/" element={<div>Public Home</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('Protected Routes', () => {
  it('should show admin dashboard when authenticated', () => {
    const session = { userId: 'admin1', email: 'admin@test.com', role: 'admin' as const };
    renderProtectedRoute('/admin', session);

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('should show "Not authorized" when not authenticated', () => {
    renderProtectedRoute('/admin', null);

    expect(screen.getByText('Not authorized')).toBeInTheDocument();
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });

  it('should allow access to public routes without auth', () => {
    renderProtectedRoute('/', null);

    expect(screen.getByText('Public Home')).toBeInTheDocument();
  });

  it('should maintain access after signing in', () => {
    const session = { userId: 'user1', email: 'user@test.com', role: 'moderator' as const };
    renderProtectedRoute('/admin', session);

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});
