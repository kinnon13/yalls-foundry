import { z } from 'zod';

/**
 * Schema validation for preview postMessage events
 * Fail closed: reject malformed messages
 */

export const HMACTokenSchema = z.object({
  tk: z.string(),
  exp: z.number(),
  origin: z.string(),
});

export const HMACTokenPartialSchema = z.object({
  tk: z.string().optional(),
  exp: z.number().optional(),
  origin: z.string().optional(),
});

export const PreviewEventBaseSchema = z.object({
  source: z.enum(['pay-preview', 'admin-preview', 'data-preview', 'app-preview', 'preview-security']),
  timestamp: z.number().optional(),
  hmac: HMACTokenPartialSchema.optional(),
});

// Pay events
export const PaymentSuccessSchema = PreviewEventBaseSchema.extend({
  type: z.literal('PAYMENT_SUCCESS'),
  orderId: z.string(),
  intentId: z.string().optional(),
});

export const PaymentFailSchema = PreviewEventBaseSchema.extend({
  type: z.literal('PAYMENT_FAIL'),
  orderId: z.string().optional(),
  reason: z.string().optional(),
});

export const KYCCompleteSchema = PreviewEventBaseSchema.extend({
  type: z.literal('KYC_COMPLETE'),
  accountId: z.string().optional(),
});

export const LabelPurchasedSchema = PreviewEventBaseSchema.extend({
  type: z.literal('LABEL_PURCHASED'),
  orderId: z.string(),
  carrier: z.string().optional(),
  tracking: z.string().optional(),
});

// Security events (no HMAC required - parent generates these)
export const BlockedWriteSchema = PreviewEventBaseSchema.extend({
  type: z.literal('BLOCKED_WRITE'),
  method: z.string(),
  url: z.string().optional(),
});

// Admin events
export const RiskActionSchema = PreviewEventBaseSchema.extend({
  type: z.literal('RISK_ACTION'),
  action: z.string(),
  targetId: z.string().optional(),
});

// Data events
export const ExportRequestedSchema = PreviewEventBaseSchema.extend({
  type: z.literal('EXPORT_REQUESTED'),
  format: z.string(),
  filters: z.any().optional(),
});

// App events
export const OrderViewedSchema = PreviewEventBaseSchema.extend({
  type: z.literal('ORDER_VIEWED'),
  orderId: z.string(),
});

export const PreviewEventSchema = z.discriminatedUnion('type', [
  PaymentSuccessSchema,
  PaymentFailSchema,
  KYCCompleteSchema,
  LabelPurchasedSchema,
  BlockedWriteSchema,
  RiskActionSchema,
  ExportRequestedSchema,
  OrderViewedSchema,
]);

export type PreviewEvent = z.infer<typeof PreviewEventSchema>;
export type HMACToken = z.infer<typeof HMACTokenSchema>;
