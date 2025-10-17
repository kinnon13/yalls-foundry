# RPC Usage Guide
**Production-grade database function calls for billion-user scale**

## Notifications

### Mark Single Notification as Read
```typescript
await supabase.rpc('notif_mark_read', { 
  p_ids: [notificationId] 
});
```

### Mark Multiple as Read (Batch)
```typescript
await supabase.rpc('notif_mark_read', { 
  p_ids: [id1, id2, id3] 
});
```

### Mark All as Read
```typescript
await supabase.rpc('notif_mark_all_read');
```

---

## Feed & Posts

### Hide Post from Feed
```typescript
await supabase.rpc('feed_hide', { 
  p_post_id: post.id 
});
```

### Repost with Cross-Posting
```typescript
// Simple repost
const { data: newPostId } = await supabase.rpc('post_repost', {
  p_source_post_id: originalPost.id,
  p_caption: '🔥 Amazing!',
  p_target_ids: null,
});

// Cross-post to multiple entities
const { data: newPostId } = await supabase.rpc('post_repost', {
  p_source_post_id: originalPost.id,
  p_caption: 'Sharing with my networks',
  p_target_ids: [entityId1, entityId2, entityId3],
});
```

### Create New Post
```typescript
await supabase.rpc('post_create', {
  p_body: 'Hello world!',
  p_visibility: 'public',
  p_entity_id: null,
  p_media: [{ url: 'https://...', type: 'image' }],
});
```

---

## Incentives & Nominations

### Check Bonus Eligibility
```typescript
const { data } = await supabase.rpc('bonus_payout_eligibility', {
  p_user_id: user.id,
  p_program_id: program.id,
});

if (data.eligible) {
  console.log('User is eligible!');
} else {
  console.log('Reason:', data.reason); // 'program_inactive' | 'no_nominations'
}
```

### Nominate a Foal
```typescript
const { data: nominationId } = await supabase.rpc('nominate_foal', {
  p_program_id: program.id,
  p_foal_name: 'Silver Star',
});
```

---

## Farm Operations

### Generate Invoice
```typescript
const { data: invoiceId } = await supabase.rpc('invoice_generate', {
  p_user_id: boarder.userId,
  p_total_cents: 50000, // $500.00
  p_meta: {
    month: '2025-10',
    services: ['board', 'training'],
  },
});
```

### Apply Care Plan to Horse
```typescript
await supabase.rpc('care_plan_apply', {
  p_care_plan_id: carePlan.id,
  p_horse_id: horse.id,
});
```

---

## Calendar & NBA

### Get Calendar Feed (Date Range)
```typescript
const { data } = await supabase.rpc('calendar_feed', {
  p_from: '2025-10-01T00:00:00Z',
  p_to: '2025-10-31T23:59:59Z',
});

console.log(data.appointments); // Array of appointments
console.log(data.events);       // Array of events
```

### Get Next Best Actions (AI)
```typescript
const { data: actions } = await supabase.rpc('rocker_next_best_actions');

actions?.forEach((action: any) => {
  console.log(`${action.action}: priority ${action.score}`);
});
// Output:
// review_notifications: priority 5
// complete_overdue_tasks: priority 3
```

---

## Rate Limiting

### Check Rate Limit (Edge Functions)
```typescript
const { data } = await supabase.rpc('check_rate_limit', {
  p_scope: `user:${userId}:post_create`,
  p_limit: 10,
  p_window_sec: 60,
});

if (!data.allowed) {
  throw new Error(`Rate limited. Retry in ${data.window_sec}s`);
}
```

---

## Cart & Orders

### Add Item to Cart
```typescript
await supabase.rpc('cart_upsert_item', {
  p_listing_id: listing.id,
  p_qty: 2,
  p_session_id: sessionId, // For guest checkout
});
```

### Get Cart Contents
```typescript
const { data: items } = await supabase.rpc('cart_get', {
  p_session_id: sessionId, // Optional for guests
});
```

### Merge Guest Cart to User (After Login)
```typescript
await supabase.rpc('cart_merge_guest_to_user', {
  p_session_id: guestSessionId,
});
```

### Create Order from Cart
```typescript
const { data } = await supabase.rpc('order_start_from_cart', {
  p_cart_id: cart.id,
  p_idempotency_key: `order_${Date.now()}_${userId}`,
});

console.log('Order ID:', data.order_id);
console.log('Payment Intent:', data.stripe_payment_intent_id);
```

---

## Entity Management

### Create Unclaimed Entity
```typescript
const { data: entityId } = await supabase.rpc('entity_create_unclaimed', {
  p_kind: 'horse',
  p_display_name: 'Thunder',
  p_handle: 'thunder-2025',
  p_provenance: { source: 'user_submission' },
  p_contributor_user_id: userId,
  p_window_key: 'contributor.60', // 60-day claim window
});
```

### Start Entity Claim
```typescript
const { data: claimId } = await supabase.rpc('entity_claim_start', {
  p_entity_id: entity.id,
  p_method: 'email',
  p_contact_target: 'owner@example.com',
});
```

### Approve Claim (Admin Only)
```typescript
const { data } = await supabase.rpc('entity_claim_approve', {
  p_claim_id: claim.id,
});

console.log('Entity now owned by:', data.owner_user_id);
console.log('Bounty logged:', data.bounty_logged);
```

---

## CRM

### Upsert Contact
```typescript
const { data: contactId } = await supabase.rpc('crm_contact_upsert', {
  p_name: 'Jane Doe',
  p_email: 'jane@example.com',
  p_phone: '+1-555-1234',
  p_tags: ['vip', 'breeder'],
});
```

### Send Direct Message
```typescript
const { data: messageId } = await supabase.rpc('dm_send', {
  p_recipient: recipientUserId,
  p_body: 'Hey, saw your listing!',
  p_metadata: { ref_listing_id: listing.id },
});
```

---

## Voice & AI

### Check Rate Limit for Voice Posts
```typescript
const { data: allowed } = await supabase.rpc('check_voice_post_rate_limit', {
  p_user_id: userId,
  p_max_posts: 5,
  p_window_seconds: 60,
});

if (!allowed) {
  toast({ title: 'Voice limit reached. Try again in 60s.' });
}
```

### Log AI Action
```typescript
await supabase.rpc('rocker_log_action', {
  p_user_id: userId,
  p_agent: 'rocker',
  p_action: 'suggest_followup',
  p_input: { contact_id: contact.id },
  p_output: { suggestions: ['...'] },
  p_result: 'success',
  p_correlation_id: crypto.randomUUID(),
});
```

---

## Event Management

### Get Event Details (Public)
```typescript
const { data: event } = await supabase.rpc('get_event_viewable', {
  p_event_id: eventId,
});

console.log('Host:', event.host_name);
console.log('Location:', event.location);
```

### Submit Entry
```typescript
const { data: entryId } = await supabase.rpc('entry_submit', {
  p_class_id: classId,
  p_rider_user_id: riderId,
  p_horse_entity_id: horseId,
  p_opts: { special_requests: 'early draw' },
});
```

---

## Search

### Global Search (Entities, Listings, Events)
```typescript
const { data: results } = await supabase.rpc('search_entities', {
  p_query: 'Thunder',
  p_tenant_id: tenantId,
  p_limit: 10,
});

results.forEach((r: any) => {
  console.log(`${r.entity_type}: ${r.name} (score: ${r.similarity_score})`);
});
```

---

## Best Practices

### 1. Idempotency
Always include unique keys for critical operations:
```typescript
const idemKey = `post_${userId}_${Date.now()}`;
await supabase.rpc('post_create', {
  p_body: content,
  p_idempotency_key: idemKey,
});
```

### 2. Error Handling
```typescript
const { data, error } = await supabase.rpc('some_rpc', { ... });

if (error) {
  // Handle rate limits
  if (error.message.includes('rate limit')) {
    toast({ title: 'Slow down! Try again in a moment.' });
    return;
  }
  
  // Log to Sentry
  console.error('[RPC] Failed:', error);
  throw error;
}
```

### 3. Type Safety
```typescript
// Define RPC return types
type NBAAction = { action: string; score: number };

const { data } = await supabase.rpc('rocker_next_best_actions');
const actions = (data || []) as NBAAction[];
```

### 4. Batch Operations
Prefer batch RPCs over loops:
```typescript
// ❌ BAD: N+1 queries
for (const id of notifIds) {
  await supabase.rpc('notif_mark_read', { p_ids: [id] });
}

// ✅ GOOD: Single batch call
await supabase.rpc('notif_mark_read', { p_ids: notifIds });
```

---

## Performance Tips

1. **Use indexes:** All RPC queries leverage pre-created indexes
2. **Limit results:** Always use `.limit()` or pass `p_limit` parameters
3. **Cache responses:** Use React Query with 5-minute staleTime for static data
4. **Avoid nested RPCs:** Fetch related data with JOINs, not multiple RPC calls

---

## Security Notes

- All RPCs use `SECURITY DEFINER` with `SET search_path = public`
- User ID scoping enforced via `auth.uid()` checks
- Admin-only functions use `has_role()` guards
- Rate limiting prevents abuse (60 req/min per user)

---

**Next:** See `docs/INFRASTRUCTURE-SETUP.md` for PgBouncer, Redis, Sentry setup
