/**
 * AI Tool Schema Definitions
 * Zod schemas for runtime validation of tool configurations
 */

import { z } from 'zod';

/**
 * Tool role - who can invoke this tool
 */
export const ToolRoleSchema = z.enum(['user', 'admin', 'super']);

/**
 * Tool kind - how the tool is implemented
 */
export const ToolKindSchema = z.enum(['native', 'openapi', 'webhook']);

/**
 * Tool specification schema
 */
export const ToolSchema = z.object({
  role: ToolRoleSchema,
  name: z.string().min(1).max(100),
  version: z.string().default('1'),
  kind: ToolKindSchema,
  spec: z.record(z.any()),
  allow_domains: z.array(z.string()).default([]),
  rate_limit_per_min: z.number().int().positive().default(60),
  enabled: z.boolean().default(true),
});

export type Tool = z.infer<typeof ToolSchema>;
export type ToolRole = z.infer<typeof ToolRoleSchema>;
export type ToolKind = z.infer<typeof ToolKindSchema>;

/**
 * Native tool spec (TypeScript function)
 */
export const NativeToolSpecSchema = z.object({
  description: z.string(),
  parameters: z.object({
    type: z.literal('object'),
    properties: z.record(z.any()),
    required: z.array(z.string()).optional(),
  }),
});

/**
 * OpenAPI tool spec (subset)
 */
export const OpenAPIToolSpecSchema = z.object({
  openapi_url: z.string().url(),
  operation_id: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  path: z.string(),
  servers: z.array(z.string().url()),
  auth_template: z.string().optional(),
});

/**
 * Webhook tool spec
 */
export const WebhookToolSpecSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST']),
  headers: z.record(z.string()).optional(),
  auth_template: z.string().optional(),
  timeout_ms: z.number().int().positive().default(30000),
});

/**
 * Tool invocation result
 */
export const ToolResultSchema = z.object({
  success: z.boolean(),
  result: z.any().optional(),
  error: z.string().optional(),
  metadata: z.object({
    duration_ms: z.number(),
    provider: z.string().optional(),
    cost_cents: z.number().optional(),
  }),
});

export type ToolResult = z.infer<typeof ToolResultSchema>;
