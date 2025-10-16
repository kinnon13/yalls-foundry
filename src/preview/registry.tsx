import { lazy } from 'react';

export type PreviewGroup = 'App' | 'Pay' | 'Admin' | 'Data';

export type PreviewItem = {
  id: string;           // unique, kebab
  label: string;        // human readable
  path: string;         // /preview/<slug>
  group: PreviewGroup;
  // lazy component (no side-effects, no writes)
  Component: React.LazyExoticComponent<React.ComponentType<any>>;
  desc?: string;        // optional short description
};

// Lazy pages (stubs only; no money moves here)
const PayCheckout      = lazy(() => import('./screens/pay/CheckoutPreview'));
const PayOnboarding    = lazy(() => import('./screens/pay/OnboardingPreview'));
const PayPayouts       = lazy(() => import('./screens/pay/PayoutsPreview'));
const PayLabels        = lazy(() => import('./screens/pay/LabelsPreview'));
const AdminRisk        = lazy(() => import('./screens/admin/RiskPreview'));
const AdminCapabilities= lazy(() => import('./screens/admin/CapabilitiesPreview'));
const DataExports      = lazy(() => import('./screens/data/ExportsPreview'));
const DataReports      = lazy(() => import('./screens/data/ReportsPreview'));
const AppOrdersRead    = lazy(() => import('./screens/app/OrdersReadOnlyPreview'));

export const PREVIEW_ITEMS: PreviewItem[] = [
  // Pay
  { id: 'pay-checkout',    label: 'Checkout (Pay)',      path: '/preview/pay/checkout',    group: 'Pay',   Component: PayCheckout,    desc: 'Hosted checkout mock; posts messages back to app' },
  { id: 'pay-onboarding',  label: 'Onboarding (KYC)',    path: '/preview/pay/onboarding',  group: 'Pay',   Component: PayOnboarding,  desc: 'Stripe Connect onboarding stub' },
  { id: 'pay-payouts',     label: 'Payouts',             path: '/preview/pay/payouts',     group: 'Pay',   Component: PayPayouts,     desc: 'Balances, schedules, holds' },
  { id: 'pay-labels',      label: 'Shipping Labels',     path: '/preview/pay/labels',      group: 'Pay',   Component: PayLabels,      desc: 'Buy/verify labels; unlocks commissions' },

  // Admin
  { id: 'admin-risk',      label: 'Risk & Chargebacks',  path: '/preview/admin/risk',      group: 'Admin', Component: AdminRisk,      desc: 'Chargeback queue, flags, actions' },
  { id: 'admin-caps',      label: 'Capability Browser',  path: '/preview/admin/capabilities', group: 'Admin', Component: AdminCapabilities, desc: 'Feature catalog, gaps, usage' },

  // Data
  { id: 'data-exports',    label: 'Exports',             path: '/preview/data/exports',    group: 'Data',  Component: DataExports,    desc: 'CSV/JSON export requests (read-only)' },
  { id: 'data-reports',    label: 'Reports',             path: '/preview/data/reports',    group: 'Data',  Component: DataReports,    desc: 'Scheduled reports mock' },

  // App
  { id: 'app-orders-ro',   label: 'Orders (Read-only)',  path: '/preview/app/orders',      group: 'App',   Component: AppOrdersRead,  desc: 'Order details (no mutation)' },
];

export function getPreviewGroups() {
  return Array.from(new Set(PREVIEW_ITEMS.map(i => i.group))).sort();
}
