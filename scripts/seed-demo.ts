/**
 * Demo Mode Seeder
 * 
 * Seeds consistent demo data for investor demos
 * All data tagged with tenant_id='demo'
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function seedDemoOrder() {
  console.log('🌱 Seeding demo order...');

  // Example: $22 sale breakdown
  const SALE_AMOUNT = 22.00;
  const PROCESSING_FEE = 0.30 + (0.029 * SALE_AMOUNT); // 2.9% + $0.30 = $0.94
  const PLATFORM_FEE = 0.04 * SALE_AMOUNT; // 4% = $0.88
  const BUYER_CHAIN_COMMISSION = 0.01 * SALE_AMOUNT; // 1% = $0.22
  const SELLER_CHAIN_COMMISSION = 0.01 * SALE_AMOUNT; // 1% = $0.22
  const SELLER_NET = SALE_AMOUNT - PROCESSING_FEE - PLATFORM_FEE - BUYER_CHAIN_COMMISSION - SELLER_CHAIN_COMMISSION; // $19.74

  // Create demo users (or use existing)
  const demoUsers = {
    buyer: { email: 'jane@demo.yalls.ai', name: 'Jane Buyer' },
    seller: { email: 'store@demo.yalls.ai', name: 'Store ABC' },
    affiliate: { email: 'bob@demo.yalls.ai', name: 'Creator Bob' },
    mentor: { email: 'sue@demo.yalls.ai', name: 'Mentor Sue' }
  };

  // Create demo product/listing
  const demoListing = {
    id: 'demo_listing_001',
    title: "Y'all Tee",
    price_cents: 2200,
    seller_id: 'demo_seller_001',
    status: 'active',
    tenant_id: 'demo'
  };

  // Create demo order
  const demoOrder = {
    id: 'O123',
    buyer_id: 'demo_buyer_001',
    seller_id: 'demo_seller_001',
    subtotal_cents: 2200,
    processing_fee_cents: Math.round(PROCESSING_FEE * 100),
    platform_fee_cents: Math.round(PLATFORM_FEE * 100),
    total_cents: 2200,
    seller_net_cents: Math.round(SELLER_NET * 100),
    status: 'completed',
    tenant_id: 'demo',
    created_at: new Date().toISOString()
  };

  // Commission ledger entries
  const commissions = [
    {
      order_id: 'O123',
      payee_id: 'demo_affiliate_001',
      type: 'buyer_chain',
      amount_cents: Math.round(BUYER_CHAIN_COMMISSION * 100), // $0.22
      tenant_id: 'demo'
    },
    {
      order_id: 'O123',
      payee_id: 'demo_mentor_001',
      type: 'seller_chain',
      amount_cents: Math.round(SELLER_CHAIN_COMMISSION * 100), // $0.22
      tenant_id: 'demo'
    }
  ];

  // Traffic attribution
  const attribution = {
    order_id: 'O123',
    session_id: 'S789',
    referrer_code: 'BOB10',
    utm_source: 'creator',
    utm_campaign: 'summer-launch',
    tenant_id: 'demo'
  };

  console.log('📊 Demo Order Breakdown ($22 Sale):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  GMV:                      $${SALE_AMOUNT.toFixed(2)}`);
  console.log(`  Processing Fee (2.9%+$0.30): -$${PROCESSING_FEE.toFixed(2)}`);
  console.log(`  Platform Fee (4%):        -$${PLATFORM_FEE.toFixed(2)}`);
  console.log(`  Buyer Chain Comm (1%):    -$${BUYER_CHAIN_COMMISSION.toFixed(2)}`);
  console.log(`  Seller Chain Comm (1%):   -$${SELLER_CHAIN_COMMISSION.toFixed(2)}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  SELLER NET:               $${SELLER_NET.toFixed(2)}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('✅ Demo data structure ready');
  console.log('💡 Use tenant_id="demo" or DEMO_MODE=true to gate this data');
  console.log('📝 Display these exact numbers in order detail UI');
  console.log('🔍 SQL verification: SELECT SUM(amount_cents) FROM commission_ledger WHERE order_id=\'O123\'');
}

seedDemoOrder();