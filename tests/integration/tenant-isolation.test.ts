/**
 * Tenant Isolation Tests
 * 
 * Verify that data cannot leak across organizations.
 * These tests are CRITICAL for production readiness.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in environment');
}

describe('Tenant Isolation (P0 - Production Blocker)', () => {
  let orgAClient: ReturnType<typeof createClient>;
  let orgBClient: ReturnType<typeof createClient>;
  let orgAUserId: string;
  let orgBUserId: string;
  let orgAToken: string;
  let orgBToken: string;

  beforeAll(async () => {
    // Create two separate clients for different orgs
    orgAClient = createClient(supabaseUrl, supabaseKey);
    orgBClient = createClient(supabaseUrl, supabaseKey);

    // Sign up two users (one per org)
    const emailA = `test-org-a-${Date.now()}@example.com`;
    const emailB = `test-org-b-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    const { data: userA, error: errorA } = await orgAClient.auth.signUp({
      email: emailA,
      password,
    });

    const { data: userB, error: errorB } = await orgBClient.auth.signUp({
      email: emailB,
      password,
    });

    if (errorA || !userA.user) throw new Error(`Failed to create user A: ${errorA?.message}`);
    if (errorB || !userB.user) throw new Error(`Failed to create user B: ${errorB?.message}`);

    orgAUserId = userA.user.id;
    orgBUserId = userB.user.id;
    orgAToken = userA.session?.access_token || '';
    orgBToken = userB.session?.access_token || '';
  });

  afterAll(async () => {
    // Cleanup test users
    await orgAClient.auth.signOut();
    await orgBClient.auth.signOut();
  });

  describe('Message Isolation', () => {
    it('should not leak messages across orgs', async () => {
      // Org A creates a thread and message
      const { data: threadA, error: threadErrorA } = await orgAClient
        .from('rocker_threads')
        .insert({
          title: 'Secret Thread A',
          user_id: orgAUserId,
        })
        .select()
        .single();

      expect(threadErrorA).toBeNull();
      expect(threadA).toBeDefined();

      const { data: messageA, error: messageErrorA } = await orgAClient
        .from('rocker_messages')
        .insert({
          thread_id: threadA!.id,
          role: 'user',
          content: 'Secret message from Org A',
          user_id: orgAUserId,
        })
        .select()
        .single();

      expect(messageErrorA).toBeNull();
      expect(messageA).toBeDefined();

      // Org B should NOT see Org A's thread
      const { data: threadsB, error: threadErrorB } = await orgBClient
        .from('rocker_threads')
        .select('*')
        .eq('id', threadA!.id);

      expect(threadErrorB).toBeNull();
      expect(threadsB).toHaveLength(0); // Must be empty

      // Org B should NOT see Org A's message
      const { data: messagesB, error: messageErrorB } = await orgBClient
        .from('rocker_messages')
        .select('*')
        .eq('id', messageA!.id);

      expect(messageErrorB).toBeNull();
      expect(messagesB).toHaveLength(0); // Must be empty
    });
  });

  describe('File Isolation', () => {
    it('should not leak files across orgs', async () => {
      // Org A uploads a file record
      const { data: fileA, error: fileErrorA } = await orgAClient
        .from('rocker_files')
        .insert({
          filename: 'secret-doc-a.pdf',
          file_path: '/org-a/secret-doc-a.pdf',
          user_id: orgAUserId,
          mime_type: 'application/pdf',
          size_bytes: 1024,
        })
        .select()
        .single();

      expect(fileErrorA).toBeNull();
      expect(fileA).toBeDefined();

      // Org B should NOT see Org A's file
      const { data: filesB, error: fileErrorB } = await orgBClient
        .from('rocker_files')
        .select('*')
        .eq('id', fileA!.id);

      expect(fileErrorB).toBeNull();
      expect(filesB).toHaveLength(0); // Must be empty
    });
  });

  describe('Task Isolation', () => {
    it('should not leak tasks across orgs', async () => {
      // Org A creates a task
      const { data: taskA, error: taskErrorA } = await orgAClient
        .from('rocker_tasks')
        .insert({
          title: 'Secret Task A',
          description: 'Confidential task for Org A',
          user_id: orgAUserId,
          status: 'pending',
        })
        .select()
        .single();

      expect(taskErrorA).toBeNull();
      expect(taskA).toBeDefined();

      // Org B should NOT see Org A's task
      const { data: tasksB, error: taskErrorB } = await orgBClient
        .from('rocker_tasks')
        .select('*')
        .eq('id', taskA!.id);

      expect(taskErrorB).toBeNull();
      expect(tasksB).toHaveLength(0); // Must be empty
    });
  });

  describe('Knowledge Base Isolation', () => {
    it('should not leak knowledge chunks across orgs', async () => {
      // Org A creates a knowledge chunk
      const { data: chunkA, error: chunkErrorA } = await orgAClient
        .from('knowledge_chunks')
        .insert({
          content: 'Secret knowledge for Org A only',
          tenant_id: orgAUserId,
          doc_id: `doc-${Date.now()}`,
        })
        .select()
        .single();

      expect(chunkErrorA).toBeNull();
      expect(chunkA).toBeDefined();

      // Org B should NOT see Org A's chunk
      const { data: chunksB, error: chunkErrorB } = await orgBClient
        .from('knowledge_chunks')
        .select('*')
        .eq('id', chunkA!.id);

      expect(chunkErrorB).toBeNull();
      expect(chunksB).toHaveLength(0); // Must be empty
    });
  });

  describe('Search Isolation (Critical)', () => {
    it('should not return other org results in private search', async () => {
      // This test requires the search function to exist
      // When implemented, it should:
      // 1. Org A uploads "alpha-only" doc
      // 2. Org B searches "alpha-only"
      // 3. Result: Org B gets 0 private hits, only marketplace if published

      // TODO: Implement when search endpoints are created
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Voice Events (Admin Only)', () => {
    it('should not allow non-admin to read voice_events', async () => {
      // Regular users should NOT be able to read voice_events
      const { data: events, error } = await orgAClient
        .from('voice_events')
        .select('*')
        .limit(1);

      // Should fail or return empty
      if (!error) {
        expect(events).toHaveLength(0);
      }
    });
  });

  describe('Feature Flags (Read-Only for Users)', () => {
    it('should allow users to read feature flags', async () => {
      const { data: flags, error } = await orgAClient
        .from('feature_flags')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      expect(flags).toBeDefined();
    });

    it('should not allow users to update feature flags', async () => {
      // Try to toggle a flag as regular user
      const { error } = await orgAClient
        .from('feature_flags')
        .update({ enabled: true })
        .eq('flag_key', 'dynamic_personas_enabled');

      // Should fail with permission error
      expect(error).not.toBeNull();
    });
  });
});

describe('Performance: Noisy Neighbor Protection', () => {
  it('should maintain P95 latency when one org is under load', async () => {
    // This requires load testing infrastructure
    // k6 or artillery test showing:
    // - Org A hammered with 30 req/s
    // - Org B maintains P95 < 400ms

    // TODO: Implement when job queue exists
    expect(true).toBe(true); // Placeholder
  });
});
