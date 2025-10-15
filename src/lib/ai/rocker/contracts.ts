/**
 * Type-safe contracts for Rocker AI tools
 * Ensures compile-time and runtime validation
 */

import { z } from 'zod';

// Save Post
export const SavePostSchema = z.object({
  post_id: z.string().uuid(),
  collection: z.string().optional(),
  note: z.string().optional()
});
export type SavePost = z.infer<typeof SavePostSchema>;

// Unsave Post
export const UnsavePostSchema = z.object({
  post_id: z.string().uuid()
});
export type UnsavePost = z.infer<typeof UnsavePostSchema>;

// Reshare Post
export const ResharePostSchema = z.object({
  post_id: z.string().uuid(),
  commentary: z.string().optional(),
  visibility: z.enum(['public', 'followers', 'private']).default('public')
});
export type ResharePost = z.infer<typeof ResharePostSchema>;

// Recall Content
export const RecallContentSchema = z.object({
  query: z.string().min(1).max(500)
});
export type RecallContent = z.infer<typeof RecallContentSchema>;

// Upload Media
export const UploadMediaSchema = z.object({
  file_name: z.string(),
  file_type: z.string(),
  file_size: z.number().positive(),
  caption: z.string().optional(),
  visibility: z.enum(['public', 'private']).default('private')
});
export type UploadMedia = z.infer<typeof UploadMediaSchema>;

// Generate Event Form
export const GenerateEventFormSchema = z.object({
  event_type: z.string(),
  prompt: z.string().optional()
});
export type GenerateEventForm = z.infer<typeof GenerateEventFormSchema>;

// Consent
export const ConsentAcceptSchema = z.object({
  policy_version: z.string().default('v1'),
  scopes: z.array(z.string()),
  proactive_enabled: z.boolean().default(false),
  site_opt_in: z.boolean(),
  email_opt_in: z.boolean().default(false),
  sms_opt_in: z.boolean().default(false),
  push_opt_in: z.boolean().default(false)
});
export type ConsentAccept = z.infer<typeof ConsentAcceptSchema>;

// Memory
export const WriteMemorySchema = z.object({
  type: z.enum(['fact', 'preference', 'goal', 'relationship', 'skill', 'achievement']),
  key: z.string(),
  value: z.any(),
  confidence: z.number().min(0).max(1).optional(),
  source: z.string().default('chat'),
  tags: z.array(z.string()).optional(),
  expires_at: z.string().datetime().optional()
});
export type WriteMemory = z.infer<typeof WriteMemorySchema>;

export const SearchMemorySchema = z.object({
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  type: z.enum(['fact', 'preference', 'goal', 'relationship', 'skill', 'achievement']).optional(),
  limit: z.number().positive().max(100).default(10)
});
export type SearchMemory = z.infer<typeof SearchMemorySchema>;

// Proposals
export const CreateProposalSchema = z.object({
  type: z.string(),
  payload: z.any(),
  due_at: z.string().datetime()
});
export type CreateProposal = z.infer<typeof CreateProposalSchema>;

// Tool Registry
export const TOOL_CONTRACTS = {
  'posts.save': SavePostSchema,
  'posts.unsave': UnsavePostSchema,
  'posts.reshare': ResharePostSchema,
  'rocker.recall': RecallContentSchema,
  'media.upload': UploadMediaSchema,
  'events.generate_form': GenerateEventFormSchema,
  'consent.accept': ConsentAcceptSchema,
  'memory.write': WriteMemorySchema,
  'memory.search': SearchMemorySchema,
  'proposals.create': CreateProposalSchema
} as const;

export type ToolName = keyof typeof TOOL_CONTRACTS;

/**
 * Validate tool arguments at runtime
 */
export function validateToolArgs<T extends ToolName>(
  toolName: T,
  args: unknown
): z.infer<typeof TOOL_CONTRACTS[T]> {
  const schema = TOOL_CONTRACTS[toolName];
  return schema.parse(args);
}

/**
 * Type guard for tool arguments
 */
export function isValidToolArgs<T extends ToolName>(
  toolName: T,
  args: unknown
): args is z.infer<typeof TOOL_CONTRACTS[T]> {
  const schema = TOOL_CONTRACTS[toolName];
  return schema.safeParse(args).success;
}
