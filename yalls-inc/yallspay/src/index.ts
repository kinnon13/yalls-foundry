/**
 * Role: Yallspay barrel export - public API
 * Path: yalls-inc/yallspay/src/index.ts
 */

export { YallspayContract } from './contract';
export {
  processPayment,
  fetchPayouts,
  fetchResiduals,
  requestPayout,
} from './services/yallpay.service';
export {
  splitCommission,
  validateUplineChain,
  calculateResiduals,
  type CommissionSplit,
  type SplitInput,
} from '../libs/utils/commission-splitter';
export type { PaymentRequest, PayoutRecord } from './services/yallpay.service';
