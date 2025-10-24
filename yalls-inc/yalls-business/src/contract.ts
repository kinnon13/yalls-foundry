/**
 * Yalls-Business Contract
 * Defines business app capabilities and routing
 */

export interface BusinessContract {
  id: 'yalls-business';
  routes: string[];
  capabilities: {
    crm: string[];
    inventory: string[];
    payroll: string[];
  };
}

export const businessContract: BusinessContract = {
  id: 'yalls-business',
  routes: ['/business/crm', '/business/inventory', '/business/payroll'],
  capabilities: {
    crm: ['contacts.create', 'contacts.export', 'invoices.sync'],
    inventory: ['stock.track', 'reorder.alert'],
    payroll: ['expenses.approve', 'ach.wire'], // ties to yallspay
  },
};
