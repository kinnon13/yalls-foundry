/**
 * Role: Yallspay service - payment processing with MLM splits
 * Path: yalls-inc/yallspay/src/services/yallpay.service.ts
 */

import { supabase } from '@/integrations/supabase/client';
import { splitCommission, type SplitInput } from '../../libs/utils/commission-splitter';

export interface PaymentRequest {
  userId: string;
  amount: number;
  productId: string;
  gateway: 'stripe' | 'venmo';
  uplineChain: string[];
}

export interface PayoutRecord {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  gateway: string;
  created_at: string;
}

/**
 * Process payment and distribute MLM commissions
 */
export async function processPayment(request: PaymentRequest): Promise<string> {
  // Calculate commission splits
  const splits = splitCommission({
    transactionAmount: request.amount,
    userId: request.userId,
    uplineChain: request.uplineChain,
  });

  // Insert payment record
  const { data: payment, error } = await supabase
    .from('yallspay_payments')
    .insert({
      user_id: request.userId,
      amount: request.amount,
      product_id: request.productId,
      gateway: request.gateway,
      status: 'processing',
      splits: splits,
    })
    .select()
    .single();

  if (error) throw error;

  // TODO: Call Stripe/Venmo API for actual payment processing

  return payment.id;
}

/**
 * Fetch user's payout history
 */
export async function fetchPayouts(userId: string): Promise<PayoutRecord[]> {
  const { data, error } = await supabase
    .from('yallspay_payouts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch user's residual earnings
 */
export async function fetchResiduals(userId: string): Promise<number> {
  // Stub: Query yallspay_residuals table
  const { data, error } = await supabase
    .from('yallspay_residuals')
    .select('amount')
    .eq('user_id', userId);

  if (error) throw error;

  const total = (data || []).reduce((sum, r) => sum + r.amount, 0);
  return parseFloat(total.toFixed(2));
}

/**
 * Request payout to user's bank account
 */
export async function requestPayout(userId: string, amount: number): Promise<void> {
  const { error } = await supabase.from('yallspay_payouts').insert({
    user_id: userId,
    amount,
    status: 'pending',
    gateway: 'stripe', // Default to Stripe
  });

  if (error) throw error;
}
