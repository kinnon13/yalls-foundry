#!/usr/bin/env tsx
/**
 * Rocker Memory Health Check
 * 
 * Smoke test for memory write/read/delete with user JWT
 * Usage: tsx scripts/rocker-memory-doctor.ts <USER_JWT_TOKEN>
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

async function runMemoryTest(userToken: string) {
  console.log('🧪 Starting Rocker Memory Health Check...\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: { Authorization: `Bearer ${userToken}` }
    }
  });

  const testKey = `test.memory.${Date.now()}`;
  const testValue = { color: 'teal', timestamp: new Date().toISOString() };

  try {
    // 1. Write memory
    console.log('1️⃣ Writing test memory...');
    const { data: writeData, error: writeError } = await supabase.functions.invoke('rocker-memory', {
      body: {
        action: 'write_memory',
        entry: {
          key: testKey,
          value: testValue,
          type: 'fact',
          confidence: 0.95,
          source: 'health_check'
        }
      }
    });

    if (writeError) {
      console.error('❌ Write failed:', writeError);
      return false;
    }
    console.log('✅ Write successful:', writeData.memory?.id);

    // 2. Read memory back
    console.log('\n2️⃣ Reading test memory...');
    const { data: readData, error: readError } = await supabase.functions.invoke('rocker-memory', {
      body: {
        action: 'search_memory',
        limit: 1
      }
    });

    if (readError || !readData?.memories?.some((m: any) => m.key === testKey)) {
      console.error('❌ Read failed - memory not found');
      return false;
    }
    console.log('✅ Read successful:', readData.memories[0]);

    // 3. Check audit log
    console.log('\n3️⃣ Checking audit receipt...');
    const { data: auditData, error: auditError } = await supabase
      .from('admin_audit_log')
      .select('*')
      .eq('action', 'memory.commit')
      .order('created_at', { ascending: false })
      .limit(1);

    if (auditError || !auditData || auditData.length === 0) {
      console.warn('⚠️ No audit receipt found (may not be persisting)');
    } else {
      console.log('✅ Audit receipt found:', auditData[0].id);
    }

    // 4. Delete memory
    console.log('\n4️⃣ Cleaning up test memory...');
    const { error: deleteError } = await supabase.functions.invoke('rocker-memory', {
      body: {
        action: 'delete_memory',
        id: writeData.memory.id
      }
    });

    if (deleteError) {
      console.error('❌ Delete failed:', deleteError);
      return false;
    }
    console.log('✅ Delete successful');

    console.log('\n✅ ALL TESTS PASSED - Rocker memory is healthy!\n');
    return true;

  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    return false;
  }
}

// CLI usage
const userToken = process.argv[2];

if (!userToken) {
  console.error('Usage: tsx scripts/rocker-memory-doctor.ts <USER_JWT_TOKEN>');
  process.exit(1);
}

runMemoryTest(userToken).then(success => {
  process.exit(success ? 0 : 1);
});
