# Yalls-Business Guide

## Overview
Yalls-Business provides enterprise-grade CRM, invoicing, and payroll operations for business owners. It integrates with yallspay for ACH wires and yalls-ai for revenue forecasting.

## Features

### 1. CRM Contacts
- **Create/Update**: Add contacts with name, email, phone
- **Export**: Owner-only CSV/PDF export (gated by OPA policy)
- **Lead Tracking**: Status pipeline (lead → customer → inactive)

### 2. Invoicing
- **QuickBooks Sync**: Stub integration for invoice sync
- **Status Pipeline**: draft → sent → paid
- **Revenue Aggregation**: Daily batch via `scripts/daily-aggregate.py`

### 3. Payroll & Expenses
- **Approve Expenses**: Owner approves → emits `expense-approved` event
- **ACH Wire**: Yallspay listens to event bus → processes ACH
- **Event Bus Flow**:
  1. Owner clicks "Approve" in `/business/payroll`
  2. `crm.service.ts` inserts `event_bus` record
  3. Yallspay edge function `yallspay-ach-wire` picks up event
  4. ACH wire initiated via Stripe/Venmo API (stub)

### 4. AI Forecasting
- **Revenue Cohorts**: `libs/utils/revenue-agg.ts` calculates monthly cohorts
- **Churn Prediction**: Business-tier AI (via yalls-ai) predicts churn
- **Forecasting**: 3-month revenue forecast via `forecastRevenue()`

## Access Control (OPA)
- **Owner**: Full access (exports, QuickBooks, ACH approvals)
- **Staff**: View-only CRM, no exports
- **User**: No business features (tier-gated)

## Event Bus Integration
### Emit Events
```typescript
await supabase.from('event_bus').insert({
  event_type: 'expense-approved',
  payload: { expenseId, amount },
});
```

### Listen to Events (Yallspay)
```typescript
// In yallspay edge function
const { data } = await supabase.from('event_bus')
  .select('*')
  .eq('event_type', 'expense-approved')
  .is('processed', null);
// Process ACH wires
```

## Load Testing
- **K6 Script**: `k6/load-invoice.js` simulates 1K concurrent invoices
- **Cypress E2E**: `cypress/e2e/crm.spec.cy.ts` tests export/ACH flow

## Backup & Ops
- **Daily Backup**: `ops/backup-ops.sh` dumps crm_contacts, invoices, expenses
- **Cron**: Run at 3am daily via `0 3 * * * /path/to/backup-ops.sh`

## Husky Pre-Commit
- DTO validation (TypeScript noEmit)
- ESLint checks (max-warnings 0)
- OPA policy syntax validation
- Unit tests for `revenue-agg.ts`
