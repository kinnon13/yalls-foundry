/**
 * Supabase Auth Adapter Tests
 * 
 * Unit tests for real Supabase authentication adapter.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from '@/lib/auth/types';

// Mock Supabase client
const mockSupabase = {
  auth: {
    signInWithOtp: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  rpc: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('Supabase Auth Adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Role Fetching', () => {
    it('should fetch user role from database', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: 'admin', error: null });

      const { supabaseAuthAdapter } = await import('@/lib/auth/adapters/supabase');

      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'admin@test.com' },
          },
        },
        error: null,
      });

      const session = await supabaseAuthAdapter.getSession();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_role', {
        _user_id: 'user-123',
      });
      expect(session?.role).toBe('admin');
    });

    it('should default to guest role on fetch error', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      const { supabaseAuthAdapter } = await import('@/lib/auth/adapters/supabase');

      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@test.com' },
          },
        },
        error: null,
      });

      const session = await supabaseAuthAdapter.getSession();

      expect(session?.role).toBe('guest');
    });
  });

  describe('Sign In', () => {
    it('should send OTP email on sign-in', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: {},
        error: null,
      });

      const { supabaseAuthAdapter } = await import('@/lib/auth/adapters/supabase');

      await supabaseAuthAdapter.signIn('test@test.com');

      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@test.com',
        options: { emailRedirectTo: expect.stringContaining('/') },
      });
    });

    it('should throw on sign-in error', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email' },
      });

      const { supabaseAuthAdapter } = await import('@/lib/auth/adapters/supabase');

      await expect(supabaseAuthAdapter.signIn('bad@email')).rejects.toThrow();
    });
  });

  describe('Password Auth', () => {
    it('should sign in with password', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@test.com' },
          },
        },
        error: null,
      });
      mockSupabase.rpc.mockResolvedValue({ data: 'rider', error: null });

      const { signInWithPassword } = await import('@/lib/auth/adapters/supabase');

      const result = await signInWithPassword('test@test.com', 'password123');

      expect(result.error).toBeNull();
      expect(result.session?.userId).toBe('user-123');
      expect(result.session?.role).toBe('rider');
    });

    it('should handle password sign-in errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      const { signInWithPassword } = await import('@/lib/auth/adapters/supabase');

      const result = await signInWithPassword('test@test.com', 'wrong');

      expect(result.error).toBeTruthy();
      expect(result.session).toBeNull();
    });
  });

  describe('Sign Up', () => {
    it('should create account with email confirmation', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          session: null, // No session until email confirmed
          user: { id: 'new-user', email: 'new@test.com' },
        },
        error: null,
      });

      const { signUpWithPassword } = await import('@/lib/auth/adapters/supabase');

      const result = await signUpWithPassword('new@test.com', 'SecurePass123');

      expect(result.error).toBeNull();
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@test.com',
        password: 'SecurePass123',
        options: { emailRedirectTo: expect.any(String) },
      });
    });

    it('should validate email format', async () => {
      const { signUpWithPassword } = await import('@/lib/auth/adapters/supabase');

      const result = await signUpWithPassword('invalid-email', 'SecurePass123');

      expect(result.error?.message).toContain('Invalid email');
      expect(result.session).toBeNull();
    });

    it('should validate password strength', async () => {
      const { signUpWithPassword } = await import('@/lib/auth/adapters/supabase');

      const result = await signUpWithPassword('test@test.com', 'weak');

      expect(result.error?.message).toContain('Password must');
      expect(result.session).toBeNull();
    });
  });

  describe('MFA', () => {
    it('should call enable_mfa RPC and return secret', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { success: true, secret: 'JBSWY3DPEHPK3PXP', qr_uri: 'otpauth://...' },
        error: null,
      });

      const { enableMFA } = await import('@/lib/auth/adapters/supabase');

      const result = await enableMFA();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('enable_mfa');
      expect(result.success).toBe(true);
      expect(result.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(result.qrUri).toContain('otpauth://');
    });

    it('should handle MFA setup errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' },
      });

      const { enableMFA } = await import('@/lib/auth/adapters/supabase');

      const result = await enableMFA();

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('Session Revoke', () => {
    it('should call revoke_sessions RPC for current user', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { success: true, message: 'Sessions revoked' },
        error: null,
      });

      const { revokeSessions } = await import('@/lib/auth/adapters/supabase');

      const result = await revokeSessions();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('revoke_sessions', {
        target_user_id: null,
      });
      expect(result.success).toBe(true);
    });

    it('should revoke sessions for target user (admin)', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { success: true, message: 'Sessions revoked for user-123' },
        error: null,
      });

      const { revokeSessions } = await import('@/lib/auth/adapters/supabase');

      const result = await revokeSessions('user-123');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('revoke_sessions', {
        target_user_id: 'user-123',
      });
      expect(result.success).toBe(true);
    });

    it('should handle permission errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Permission denied' },
      });

      const { revokeSessions } = await import('@/lib/auth/adapters/supabase');

      const result = await revokeSessions('other-user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });
  });

  describe('Session Management', () => {
    it('should return null for no active session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { supabaseAuthAdapter } = await import('@/lib/auth/adapters/supabase');

      const session = await supabaseAuthAdapter.getSession();

      expect(session).toBeNull();
    });

    it('should build session with role', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-456', email: 'owner@test.com' },
          },
        },
        error: null,
      });
      mockSupabase.rpc.mockResolvedValue({ data: 'owner', error: null });

      const { supabaseAuthAdapter } = await import('@/lib/auth/adapters/supabase');

      const session = await supabaseAuthAdapter.getSession();

      expect(session).toEqual({
        userId: 'user-456',
        email: 'owner@test.com',
        role: 'owner',
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should setup listener and call callback', async () => {
      const callback = vi.fn();
      const unsubscribe = vi.fn();

      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe } },
      });

      const { supabaseAuthAdapter } = await import('@/lib/auth/adapters/supabase');

      const unsub = supabaseAuthAdapter.onAuthStateChange(callback);

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();

      unsub();
      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
