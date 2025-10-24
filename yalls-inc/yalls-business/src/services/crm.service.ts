/**
 * CRM Service
 * Handles CRM operations, QuickBooks sync, ACH wires (interweave with yallspay)
 */

import { supabase } from '@/integrations/supabase/client';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessId: string;
  status: 'lead' | 'customer' | 'inactive';
  createdAt: string;
}

export interface Invoice {
  id: string;
  businessId: string;
  contactId: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid';
  dueDate: string;
}

/**
 * Fetch CRM contacts for a business
 */
export async function fetchContacts(businessId: string): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email || '',
    phone: c.phone || '',
    businessId: c.business_id,
    status: c.status || 'lead',
    createdAt: c.created_at,
  }));
}

/**
 * Export contacts to CSV
 */
export async function exportContactsCSV(businessId: string): Promise<string> {
  const contacts = await fetchContacts(businessId);
  const header = 'ID,Name,Email,Phone,Status,Created\n';
  const rows = contacts
    .map((c) => `${c.id},${c.name},${c.email},${c.phone},${c.status},${c.createdAt}`)
    .join('\n');
  return header + rows;
}

/**
 * Create invoice (stub: sync to QuickBooks)
 */
export async function createInvoice(
  businessId: string,
  contactId: string,
  amount: number
): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      business_id: businessId,
      contact_id: contactId,
      amount,
      status: 'draft',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    })
    .select()
    .single();

  if (error) throw error;

  // Stub: Sync to QuickBooks API
  console.log('[CRM] QuickBooks sync (stub):', data.id);

  return {
    id: data.id,
    businessId: data.business_id,
    contactId: data.contact_id,
    amount: data.amount,
    status: data.status,
    dueDate: data.due_date,
  };
}

/**
 * Approve expense and trigger yallspay ACH wire via event bus
 */
export async function approveExpense(expenseId: string, amount: number): Promise<void> {
  const { error } = await supabase.from('business_expenses').update({ status: 'approved' }).eq('id', expenseId);

  if (error) throw error;

  // Emit event bus message for yallspay to wire ACH
  await supabase.from('event_bus').insert({
    event_type: 'expense-approved',
    payload: { expenseId, amount },
    created_at: new Date().toISOString(),
  });

  console.log('[CRM] Expense approved, yallspay ACH wire triggered');
}

/**
 * Fetch business revenue summary
 */
export async function fetchRevenueSummary(businessId: string): Promise<{ total: number; monthly: number }> {
  // Stub: Aggregate from invoices table
  const { data, error } = await supabase
    .from('invoices')
    .select('amount')
    .eq('business_id', businessId)
    .eq('status', 'paid');

  if (error) throw error;

  const total = (data || []).reduce((sum, inv) => sum + inv.amount, 0);
  const monthly = total / 12; // stub: should use date ranges

  return { total: parseFloat(total.toFixed(2)), monthly: parseFloat(monthly.toFixed(2)) };
}
