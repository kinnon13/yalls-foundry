# Yalls-Business: Ops & CRM Module

**Role**: Business operations—CRM contacts, invoicing, QuickBooks sync, inventory, payroll/expenses via yallspay event bus.

## Features
- **CRM**: Contact management, lead tracking, exports (CSV/PDF)
- **QuickBooks Integration**: Revenue aggregation, invoice sync (stub)
- **Inventory**: Product stock tracking, reorder alerts
- **Payroll/Expenses**: Interweave with yallspay via event bus `expense-approved` → ACH wire
- **Downloads**: Export business data (CSV/PDF) with ownership validation
- **AI Predictions**: Business-tier forecasting (revenue cohorts, churn)

## Structure
- `libs/utils/revenue-agg.ts`: Revenue aggregation by cohort
- `services/crm.service.ts`: CRM/QuickBooks API (stub Stripe/ACH)
- `scripts/daily-aggregate.py`: Batch revenue processing (cron)
- `cypress/e2e/crm.spec.cy.ts`: E2E tests (download CSV, ACH wire)
- `k6/load-invoice.js`: Load test 1K concurrent invoices
- `sec/business-compliance.rego`: OPA policy (owner-only exports)

## Event Bus Integration
- **Emit**: `expense-approved` → triggers yallspay ACH wire
- **Listen**: `payout-completed` (from yallspay) → update business ledger

## Access Control
- **Owner**: Full CRM, exports, QuickBooks sync
- **Staff**: View-only CRM, no exports
- **User**: No access (business-tier only)
