import { z } from "zod";

export const Money = z.number().int().min(1, "Must be at least 1 cent").max(10_000_000, "Must be under $100,000");
export const Qty = z.number().int().min(1, "Quantity must be at least 1").max(9999, "Quantity too large");

export const ListingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120, "Title too long"),
  description: z.string().min(1, "Description required").max(4_000, "Description too long"),
  price_cents: Money,
  stock_qty: z.number().int().min(0, "Stock cannot be negative").max(1_000_000, "Stock too large"),
  seller_entity_id: z.string().uuid("Invalid seller entity"),
  media: z.array(z.string().url()).max(12).default([]),
  attributes: z.record(z.any()).default({}),
  status: z.enum(["draft", "active", "archived"]).default("active")
});

export const CartItemSchema = z.object({
  listing_id: z.string().uuid("Invalid listing ID"),
  qty: Qty,
  variant: z.record(z.any()).default({})
});

export const EventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(140, "Title too long"),
  description: z.string().min(1, "Description required").max(4_000, "Description too long"),
  starts_at: z.string().min(1, "Start time required"),
  ends_at: z.string().optional(),
  host_entity_id: z.string().uuid("Invalid host entity"),
  location: z.record(z.any()).default({}),
  ticket_classes: z.array(z.object({
    key: z.string().min(1).max(50),
    name: z.string().min(1).max(80),
    price_cents: Money,
    capacity: z.number().int().min(0).max(100000)
  })).max(50).default([]),
  status: z.enum(["draft", "published", "canceled"]).default("draft")
});

export type ListingInput = z.infer<typeof ListingSchema>;
export type CartItemInput = z.infer<typeof CartItemSchema>;
export type EventInput = z.infer<typeof EventSchema>;
