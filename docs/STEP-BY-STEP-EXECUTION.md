# Step-by-Step Execution Plan
## 10M-User Production Readiness

**Duration:** 6 weeks  
**Team Size:** 1-3 developers  
**Approach:** Ship incrementally, verify continuously, improve iteratively

---

## ✅ Phase 0: Foundation & Infrastructure (Week 1, Days 1-2)

### Step 0.1: Database Migration Approval & Execution
**Goal:** Get all P0 schema changes live

**Actions:**
1. Review and approve migrations:
   - `20251017213919_profile_pins_system_fixed.sql`
   - `20251017213942_favorites_system.sql`
   - `20251017214007_reposts_with_attribution.sql`
   - `20251017214007_linked_accounts_with_verification.sql`
2. Run migration tool
3. Verify types regenerated in `src/integrations/supabase/types.ts`
4. Test all new RPCs work:
   ```bash
   # Create test script
   npm run test:rpc
   ```

**Deliverables:**
- ✅ All 4 migrations applied
- ✅ Types file updated
- ✅ RPC smoke tests pass

**Verification:**
```sql
SELECT * FROM prod_gap_report(); -- Should show fewer gaps
```

---

### Step 0.2: Core Infrastructure Setup
**Goal:** Wire up observability, caching, and pooling

**Actions:**
1. **Sentry Integration:**
   ```typescript
   // src/lib/monitoring/sentry.ts
   - Initialize Sentry with DSN
   - Add breadcrumbs to all RPC calls
   - Wire error boundaries
   ```

2. **Redis Setup (for rate limits & cache):**
   ```typescript
   // supabase/functions/_shared/redis-client.ts
   - Create Redis client wrapper
   - Add cache read-through helpers
   - Wire to rate limit wrapper
   ```

3. **PgBouncer Configuration:**
   ```toml
   # supabase/config.toml
   - Configure pooler settings
   - Set statement timeout
   ```

4. **CDN Setup:**
   - Configure Cloudflare for assets
   - Set up image transforms
   - Configure cache headers

**Deliverables:**
- ✅ Sentry capturing errors
- ✅ Redis responding
- ✅ PgBouncer routing queries
- ✅ CDN serving assets

**Verification:**
- Check Sentry dashboard for events
- Run `redis-cli ping`
- Query via pooler succeeds
- Assets load from CDN

---

## 🎯 Phase 1: Profile & Identity (Week 1, Days 3-7)

### Step 1.1: Profile Pins UI
**Goal:** Users can pin 1-8 items to their profile with drag-and-drop

**Actions:**
1. **Create Pin Types:**
   ```typescript
   // src/types/profile.ts
   export type PinType = 'post' | 'event' | 'horse' | 'earning' | 'link' | 'achievement';
   export interface ProfilePin {
     id: string;
     user_id: string;
     pin_type: PinType;
     ref_id: string;
     position: number;
     title: string;
     metadata: Record<string, any>;
   }
   ```

2. **Create Pin Components:**
   ```typescript
   // src/components/profile/pins/PinBoard.tsx
   - Drag-and-drop grid (react-beautiful-dnd or dnd-kit)
   - Keyboard reordering (arrow keys + space)
   - Optimistic updates
   - Empty state
   - Loading skeleton
   ```

   ```typescript
   // src/components/profile/pins/PinCard.tsx
   - Renders each pin type
   - Edit/remove controls
   - Shimmer on drag
   ```

   ```typescript
   // src/components/profile/pins/AddPinModal.tsx
   - Search available items
   - Filter by type
   - Preview before adding
   ```

3. **Wire to Backend:**
   ```typescript
   // src/hooks/useProfilePins.ts
   export function useProfilePins(userId: string) {
     const { data, mutate } = useSWR(`/pins/${userId}`, () =>
       supabase.rpc('profile_pins_get', { p_user_id: userId })
     );
     
     const reorder = async (pins: ProfilePin[]) => {
       // Optimistic update
       mutate(pins, false);
       // Server call
       await supabase.rpc('profile_pins_set', { p_pins: pins });
       mutate();
     };
     
     return { pins: data, reorder };
   }
   ```

4. **Add to Profile Page:**
   ```typescript
   // src/routes/profile/[id].tsx
   <ProfileHeader />
   <PinBoard userId={params.id} />
   <ProfileTabs />
   ```

**Deliverables:**
- ✅ PinBoard component with D&D
- ✅ Keyboard navigation works
- ✅ Optimistic updates smooth
- ✅ Audit trail captured

**Tests:**
```typescript
// e2e/profile-pins.spec.ts
test('can add pin', async ({ page }) => { ... });
test('can reorder pins', async ({ page }) => { ... });
test('keyboard navigation', async ({ page }) => { ... });
```

**Verification:**
- Drag pin → position updates instantly
- Refresh page → order persists
- Press Tab → focus moves between pins
- Axe scan → 0 violations

---

### Step 1.2: Favorites System
**Goal:** Users can favorite posts, entities, events with instant feedback

**Actions:**
1. **Create Favorite Hook:**
   ```typescript
   // src/hooks/useFavorite.ts
   export function useFavorite(type: FavoriteType, refId: string) {
     const [isFavorited, setFavorited] = useState(false);
     
     const toggle = async () => {
       // Optimistic
       setFavorited(!isFavorited);
       // Server
       const { data } = await supabase.rpc('favorite_toggle', {
         p_fav_type: type,
         p_ref_id: refId
       });
       setFavorited(data.is_favorited);
     };
     
     return { isFavorited, toggle };
   }
   ```

2. **Add Favorite Button:**
   ```typescript
   // src/components/common/FavoriteButton.tsx
   - Heart icon with animation
   - Haptic feedback
   - Rate limited (5/sec)
   ```

3. **Favorites Tab:**
   ```typescript
   // src/routes/profile/[id]/favorites.tsx
   - Group by type (posts, events, entities)
   - Infinite scroll
   - Empty state
   ```

4. **Wire Everywhere:**
   - PostCard → add favorite button
   - EventCard → add favorite button
   - EntityHeader → add favorite button

**Deliverables:**
- ✅ Toggle < 100ms perceived
- ✅ Favorites tab paginated
- ✅ Rate limiting enforced

**Tests:**
```typescript
// e2e/favorites.spec.ts
test('toggle favorite', async ({ page }) => { ... });
test('favorites appear in tab', async ({ page }) => { ... });
```

---

### Step 1.3: Reposts with Attribution
**Goal:** Users can repost with caption; attribution chain visible

**Actions:**
1. **Repost Modal:**
   ```typescript
   // src/components/posts/RepostModal.tsx
   - Shows original post
   - Caption textarea
   - Entity picker (cross-post)
   - Preview
   ```

2. **Repost Hook:**
   ```typescript
   // src/hooks/useRepost.ts
   const repost = async (sourceId: string, caption?: string, targets?: string[]) => {
     const { data } = await supabase.rpc('post_repost', {
       p_source_post_id: sourceId,
       p_caption: caption,
       p_targets: targets
     });
     return data;
   };
   ```

3. **Attribution Display:**
   ```typescript
   // src/components/posts/PostCard.tsx
   {post.is_repost && (
     <div className="text-muted-foreground text-sm">
       Reposted from {post.original_author}
     </div>
   )}
   ```

4. **Reposts Tab:**
   ```typescript
   // src/routes/profile/[id]/reposts.tsx
   - Shows user's reposts
   - Groups by entity if cross-posted
   ```

**Deliverables:**
- ✅ Repost button on all posts
- ✅ Attribution chain unbreakable
- ✅ Reposts tab functional

**Tests:**
```typescript
// e2e/reposts.spec.ts
test('repost with caption', async ({ page }) => { ... });
test('attribution shows', async ({ page }) => { ... });
```

---

### Step 1.4: Linked Accounts & Verification
**Goal:** Users can link social accounts; verified badge shows

**Actions:**
1. **Linked Accounts UI:**
   ```typescript
   // src/components/profile/LinkedAccounts.tsx
   - List of linked accounts
   - Add account button
   - Verification status badge
   - Proof URL link
   ```

2. **Verification Flow:**
   ```typescript
   // src/components/profile/VerifyAccountModal.tsx
   - Instructions per provider
   - Proof URL input
   - Submit for verification
   - Admin review queue
   ```

3. **Backend Hook:**
   ```typescript
   // src/hooks/useLinkedAccounts.ts
   const link = async (provider: string, handle: string, proofUrl?: string) => {
     await supabase.rpc('linked_account_upsert', {
       p_provider: provider,
       p_handle: handle,
       p_proof_url: proofUrl
     });
   };
   ```

4. **Verified Badge:**
   ```typescript
   // src/components/profile/ProfileHeader.tsx
   {user.is_verified && <VerifiedBadge />}
   ```

**Deliverables:**
- ✅ Can link 5+ providers
- ✅ Verification badge displays
- ✅ Proof link clickable

**Tests:**
```typescript
// e2e/linked-accounts.spec.ts
test('link account', async ({ page }) => { ... });
test('verify account', async ({ page }) => { ... });
```

---

### Step 1.5: Entity Edges & Ownership Graph
**Goal:** Users define entity relationships; composer auto-suggests

**Actions:**
1. **Edges Manager:**
   ```typescript
   // src/components/entities/EdgesManager.tsx
   - Visual graph (react-flow or cytoscape)
   - Add edge modal
   - Edge type selector
   - Toggle cross-post / auto-propagate
   ```

2. **Edge Types:**
   ```typescript
   type EdgeType = 
     | 'owns'       // user → brand
     | 'manages'    // user → entity
     | 'parent'     // horse → sire/dam
     | 'sponsors'   // brand → event
     | 'partners';  // brand ↔ brand
   ```

3. **Composer Integration:**
   ```typescript
   // src/components/composer/EntityPicker.tsx
   - Fetches edges for user
   - Shows owned/managed first
   - Cross-post checkboxes
   - Auto-propagate badge
   ```

4. **Auto-Propagate Trigger:**
   ```sql
   -- Already in migration
   CREATE TRIGGER post_auto_propagate_trigger ...
   ```

**Deliverables:**
- ✅ Graph editor functional
- ✅ Edges reflected in composer
- ✅ Auto-propagate works

**Tests:**
```typescript
// e2e/entity-edges.spec.ts
test('create edge', async ({ page }) => { ... });
test('composer shows edges', async ({ page }) => { ... });
test('auto-propagate creates targets', async ({ page }) => { ... });
```

---

## 🔔 Phase 2: Notifications & Preferences (Week 2)

### Step 2.1: Notification Lanes
**Goal:** Notifications grouped into priority/social/system lanes

**Actions:**
1. **Update Schema (if not done):**
   ```sql
   ALTER TABLE notifications ADD COLUMN lane TEXT DEFAULT 'social'
     CHECK (lane IN ('priority', 'social', 'system'));
   ```

2. **Lane Drawer:**
   ```typescript
   // src/components/notifications/LaneDrawer.tsx
   - Three tabs (priority, social, system)
   - Badge counts per lane
   - Mark all read per lane
   ```

3. **Backend:**
   ```typescript
   // supabase/functions/notifications/enqueue.ts
   - Classify notification into lane
   - Priority: mentions, orders, events
   - Social: follows, likes, comments
   - System: updates, alerts
   ```

**Deliverables:**
- ✅ Lanes display correctly
- ✅ Badge counts accurate
- ✅ Mark read works per lane

---

### Step 2.2: Preferences & Quiet Hours
**Goal:** Users control notification channels, caps, quiet hours

**Actions:**
1. **Preferences UI:**
   ```typescript
   // src/routes/settings/notifications.tsx
   - Channel toggles (in-app, email, push, sms)
   - Category toggles per channel
   - Quiet hours picker (start/end)
   - Daily cap slider
   - Digest frequency
   ```

2. **Backend Respect:**
   ```typescript
   // supabase/functions/_shared/should-notify.ts
   export async function shouldNotify(
     userId: string,
     category: string,
     channel: string
   ): Promise<boolean> {
     const prefs = await getPrefs(userId);
     
     // Check quiet hours
     if (isQuietHours(prefs.quiet_hours)) return false;
     
     // Check daily cap
     if (await todayCount(userId) >= prefs.daily_cap) return false;
     
     // Check channel enabled
     if (!prefs.channels[channel]) return false;
     
     // Check category enabled
     if (!prefs.categories[category]) return false;
     
     return true;
   }
   ```

3. **Digest Email:**
   ```typescript
   // supabase/functions/notification-digest/index.ts
   - Cron job (daily 8am user local time)
   - Fetches unread notifications
   - Groups by category
   - Sends email via template
   ```

**Deliverables:**
- ✅ Prefs UI complete
- ✅ Quiet hours enforced
- ✅ Daily cap works
- ✅ Digest sends

**Tests:**
```typescript
// e2e/notification-prefs.spec.ts
test('quiet hours blocks', async ({ page }) => { ... });
test('daily cap enforced', async ({ page }) => { ... });
```

---

## ✍️ Phase 3: Composer & Cross-Posting (Week 3)

### Step 3.1: Full Composer UI
**Goal:** Write posts, schedule, tag, attach media, cross-post

**Actions:**
1. **Composer Component:**
   ```typescript
   // src/components/composer/Composer.tsx
   - Rich text editor (Tiptap or Lexical)
   - Media uploader (images, videos)
   - Tag picker (entities, events, horses)
   - Entity picker (cross-post targets)
   - Schedule picker
   - Draft save
   - Character counter
   - Preview mode
   ```

2. **Backend:**
   ```typescript
   // supabase/functions/post-create/index.ts
   - Validate media
   - Create post row
   - Insert post_targets if cross-posting
   - Schedule if future date
   - Trigger auto-propagate
   - Return post ID
   ```

3. **Drafts:**
   ```typescript
   // src/hooks/useDrafts.ts
   - Auto-save every 5s
   - Load drafts
   - Delete draft on publish
   ```

**Deliverables:**
- ✅ Composer feature-complete
- ✅ Cross-post works
- ✅ Drafts save/load
- ✅ Media uploads

**Tests:**
```typescript
// e2e/composer.spec.ts
test('create post', async ({ page }) => { ... });
test('cross-post', async ({ page }) => { ... });
test('schedule post', async ({ page }) => { ... });
```

---

## 🎪 Phase 4: Events & Producer Tools (Week 4)

### Step 4.1: Discounts & Comp Codes
**Goal:** Producers create discount codes with limits

**Actions:**
1. **Schema:**
   ```sql
   CREATE TABLE discount_codes (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     event_id UUID REFERENCES events(id),
     code TEXT UNIQUE,
     discount_type TEXT CHECK (discount_type IN ('percent', 'fixed', 'comp')),
     discount_value NUMERIC,
     max_uses INT,
     used_count INT DEFAULT 0,
     expires_at TIMESTAMPTZ,
     metadata JSONB
   );
   ```

2. **UI:**
   ```typescript
   // src/components/events/DiscountCodeManager.tsx
   - Create code modal
   - List active codes
   - Usage stats
   - Expire/disable
   ```

3. **Apply at Checkout:**
   ```typescript
   // src/hooks/useCheckout.ts
   const applyCode = async (code: string) => {
     const { data } = await supabase.rpc('discount_apply', {
       p_code: code,
       p_cart_total: cartTotal
     });
     setDiscount(data.discount);
   };
   ```

**Deliverables:**
- ✅ Codes work at checkout
- ✅ Usage limits enforced
- ✅ Stats accurate

---

### Step 4.2: Waitlist & Overbooking
**Goal:** Accept waitlist when sold out; ladder when spots open

**Actions:**
1. **Schema:**
   ```sql
   CREATE TABLE waitlist (
     id UUID PRIMARY KEY,
     event_id UUID REFERENCES events(id),
     user_id UUID REFERENCES auth.users(id),
     position INT,
     notified_at TIMESTAMPTZ,
     converted_at TIMESTAMPTZ
   );
   ```

2. **Join Waitlist:**
   ```typescript
   // src/hooks/useWaitlist.ts
   const join = async (eventId: string) => {
     await supabase.rpc('waitlist_join', { p_event_id: eventId });
   };
   ```

3. **Ladder Logic:**
   ```typescript
   // supabase/functions/waitlist-ladder/index.ts
   - Triggered on registration cancellation
   - Gets next in line
   - Sends notification
   - Locks spot for 1hr
   ```

**Deliverables:**
- ✅ Waitlist button shows when full
- ✅ Ladder promotes users
- ✅ Notifications sent

---

### Step 4.3: Producer Console
**Goal:** Producers see registrations, reconcile, settle

**Actions:**
1. **Console Dashboard:**
   ```typescript
   // src/routes/producer/events/[id]/console.tsx
   - Registration list (search, filter)
   - Check-in status
   - Payment status
   - Export CSV
   - Refund modal
   - Settlement summary
   ```

2. **Reconciliation:**
   ```typescript
   // src/components/producer/Reconciliation.tsx
   - Expected revenue
   - Actual collected
   - Pending settlements
   - Dispute list
   ```

**Deliverables:**
- ✅ Console accessible
- ✅ Export works
- ✅ Reconciliation accurate

---

## 💰 Phase 5: Earnings & Commerce (Week 5, Days 1-3)

### Step 5.1: Earnings Visualizations
**Goal:** Users see earnings by tier, capture %, missed opportunities

**Actions:**
1. **Tier Viz:**
   ```typescript
   // src/components/earnings/TierProgress.tsx
   - Current tier badge
   - Progress to next tier
   - Capture % graph
   - Missed earnings tooltip
   ```

2. **Missed Earnings:**
   ```typescript
   // src/hooks/useMissedEarnings.ts
   - Fetches scenarios where upgrade would've helped
   - Shows potential gain
   - CTA to upgrade
   ```

3. **Refund Flow:**
   ```typescript
   // src/components/orders/RefundModal.tsx
   - Reason selector
   - Partial refund slider
   - Preview deduction
   - Submit
   ```

**Deliverables:**
- ✅ Tier viz shows progress
- ✅ Missed earnings accurate
- ✅ Refund flow works

---

## 🤖 Phase 6: Global AI Modal (Week 5, Days 4-7 + Week 6, Days 1-3)

### Step 6.1: Context Compiler
**Goal:** AI knows user's profile, prefs, activity, goals

**Actions:**
1. **Context Schema:**
   ```sql
   CREATE TABLE ai_context (
     user_id UUID PRIMARY KEY,
     profile_graph JSONB,
     preferences JSONB,
     recent_activity JSONB,
     goals JSONB,
     constraints JSONB,
     updated_at TIMESTAMPTZ
   );
   ```

2. **Compiler Function:**
   ```typescript
   // supabase/functions/ai-context-compile/index.ts
   export async function compileContext(userId: string): Promise<ContextBundle> {
     const [profile, prefs, activity, goals] = await Promise.all([
       getProfileGraph(userId),
       getPreferences(userId),
       getRecentActivity(userId, '7 days'),
       getGoals(userId)
     ]);
     
     return {
       user_id: userId,
       profile: {
         entities: profile.entities,
         roles: profile.roles,
         edges: profile.edges
       },
       preferences: prefs,
       activity: {
         posts_count: activity.posts,
         events_attended: activity.events,
         last_active: activity.last_seen
       },
       goals: goals,
       constraints: {
         quiet_hours: prefs.quiet_hours,
         daily_cap: prefs.daily_cap
       },
       cold_start_score: calculateColdStart(activity)
     };
   }
   ```

**Deliverables:**
- ✅ Context compiles in <500ms
- ✅ All relevant data included

---

### Step 6.2: Durable Memory
**Goal:** AI remembers user preferences, past interactions

**Actions:**
1. **Memory Schema:**
   ```sql
   CREATE TABLE ai_memories (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     memory_type TEXT, -- preference, fact, goal, interaction
     content TEXT,
     embedding VECTOR(1536),
     score FLOAT DEFAULT 1.0,
     ttl INTERVAL,
     created_at TIMESTAMPTZ,
     accessed_at TIMESTAMPTZ
   );
   CREATE INDEX ON ai_memories USING ivfflat (embedding vector_cosine_ops);
   ```

2. **Memory Functions:**
   ```typescript
   // src/lib/ai/memory.ts
   export async function storeMemory(
     userId: string,
     type: MemoryType,
     content: string,
     ttl?: string
   ) {
     const embedding = await generateEmbedding(content);
     await supabase.from('ai_memories').insert({
       user_id: userId,
       memory_type: type,
       content,
       embedding,
       ttl
     });
   }
   
   export async function recallMemories(
     userId: string,
     query: string,
     limit = 5
   ) {
     const queryEmbedding = await generateEmbedding(query);
     const { data } = await supabase.rpc('memory_search', {
       p_user_id: userId,
       p_query_embedding: queryEmbedding,
       p_limit: limit
     });
     return data;
   }
   ```

3. **Decay & Merge:**
   ```typescript
   // supabase/functions/memory-decay/index.ts
   - Cron daily
   - Reduce score on old memories
   - Merge similar memories
   - Delete expired
   ```

**Deliverables:**
- ✅ Memories store correctly
- ✅ Recall works with RAG
- ✅ Decay runs daily

---

### Step 6.3: NBA Engine & Modal
**Goal:** Show 3-7 Next Best Actions ranked by relevance

**Actions:**
1. **NBA Ranker:**
   ```typescript
   // src/lib/ai/nba-ranker.ts
   export async function rankActions(
     context: ContextBundle,
     memories: Memory[],
     availableActions: Action[]
   ): Promise<RankedAction[]> {
     const features = availableActions.map(action => ({
       action,
       recency: calculateRecency(action, context.activity),
       affinity: calculateAffinity(action, memories),
       goal_fit: calculateGoalFit(action, context.goals),
       expected_value: action.expected_value,
       effort_cost: action.effort,
       fatigue: getFatiguePenalty(action, context)
     }));
     
     const scored = features.map(f => ({
       ...f,
       score: weightedSum(f, WEIGHTS)
     }));
     
     return scored
       .sort((a, b) => b.score - a.score)
       .slice(0, 7)
       .map(s => ({
         action: s.action,
         score: s.score,
         explanation: explainScore(s)
       }));
   }
   ```

2. **NBA Modal:**
   ```typescript
   // src/components/ai/NBAModal.tsx
   - Shows 3-7 cards
   - Each card: title, description, CTA, explanation
   - "Why this?" drawer
   - Execute button (runs tool flow)
   - Dismiss / "Less of this"
   ```

3. **Tool Registry:**
   ```typescript
   // src/lib/ai/tool-registry.ts
   export const TOOLS = {
     'pin_earning': {
       name: 'Pin Your Top Earning',
       description: 'Showcase your best performance',
       execute: async (userId: string) => { ... },
       scopes: ['profile.write'],
       rate_limit: { calls: 10, window: '1h' }
     },
     'connect_instagram': {
       name: 'Link Your Ranch Instagram',
       description: 'Grow your reach',
       execute: async (userId: string) => { ... },
       scopes: ['accounts.write'],
       rate_limit: { calls: 5, window: '1h' }
     },
     // ... 48 more tools
   };
   ```

**Deliverables:**
- ✅ Modal shows NBAs
- ✅ Ranking makes sense
- ✅ Tools execute successfully
- ✅ Explanations clear

**Tests:**
```typescript
// e2e/nba-modal.spec.ts
test('shows actions', async ({ page }) => { ... });
test('explain drawer', async ({ page }) => { ... });
test('execute action', async ({ page }) => { ... });
```

---

### Step 6.4: Explainability & Controls
**Goal:** Users understand "why" and can tune

**Actions:**
1. **Explain Drawer:**
   ```typescript
   // src/components/ai/ExplainDrawer.tsx
   - Top 3 signals (chips with scores)
   - Feature importance chart
   - "Less of this" button
   - "More like this" button
   ```

2. **Preference Updates:**
   ```typescript
   // src/hooks/useAIPreferences.ts
   const updatePreference = async (signal: string, direction: 'more' | 'less') => {
     await storeMemory(userId, 'preference', {
       signal,
       direction,
       timestamp: now()
     });
     // Re-rank NBAs
     refetch();
   };
   ```

**Deliverables:**
- ✅ Explain shows top signals
- ✅ Tuning updates ranking
- ✅ Changes persist

---

## 🧪 Phase 7: Testing & Quality (Week 6, Days 4-5)

### Step 7.1: E2E Test Coverage
**Goal:** 90% critical path coverage

**Actions:**
1. **Write Playwright Tests:**
   - Profile: pins, favorites, reposts, linked accounts, edges (5 specs)
   - Notifications: lanes, prefs, digest (3 specs)
   - Composer: create, cross-post, schedule (3 specs)
   - Events: discounts, waitlist, console (3 specs)
   - Earnings: tiers, refunds (2 specs)
   - AI: NBA modal, explain, tools (3 specs)

2. **Run in CI:**
   ```yaml
   # .github/workflows/e2e.yml
   - name: E2E Tests
     run: npx playwright test --workers=4
   ```

**Deliverables:**
- ✅ 20+ specs passing
- ✅ CI runs on every PR

---

### Step 7.2: Performance Testing
**Goal:** p95 < 200ms for read paths

**Actions:**
1. **k6 Scenarios:**
   ```javascript
   // tests/k6/feed.js
   export default function() {
     http.get(`${API}/feed`);
   }
   
   // tests/k6/profile.js
   export default function() {
     http.get(`${API}/profile/${USER_ID}`);
   }
   
   // tests/k6/notifications.js
   export default function() {
     http.get(`${API}/notifications`);
   }
   ```

2. **Thresholds:**
   ```javascript
   export const options = {
     thresholds: {
       http_req_duration: ['p(95)<200'],
       http_req_failed: ['rate<0.01']
     }
   };
   ```

3. **Run & Fix:**
   ```bash
   k6 run tests/k6/feed.js --vus 100 --duration 30s
   ```

**Deliverables:**
- ✅ Feed p95 < 200ms
- ✅ Profile p95 < 200ms
- ✅ Notifications p95 < 200ms

---

### Step 7.3: A11y Audit
**Goal:** WCAG AA compliant, 0 axe violations

**Actions:**
1. **Install axe:**
   ```bash
   npm install --save-dev @axe-core/playwright
   ```

2. **Scan Pages:**
   ```typescript
   // tests/a11y/profile.spec.ts
   test('profile accessible', async ({ page }) => {
     await page.goto('/profile/123');
     const results = await injectAxe(page);
     expect(results.violations).toHaveLength(0);
   });
   ```

3. **Fix Violations:**
   - Add ARIA labels
   - Fix contrast ratios
   - Ensure keyboard nav
   - Add skip links

**Deliverables:**
- ✅ 0 axe violations on key pages
- ✅ Keyboard nav complete

---

## 🚀 Phase 8: Launch Prep (Week 6, Days 6-7)

### Step 8.1: Production Infrastructure
**Goal:** All infra live and monitored

**Checklist:**
- ✅ PgBouncer pooling traffic
- ✅ Redis caching feed/profile
- ✅ CDN serving assets (<100ms)
- ✅ Sentry capturing errors (>95% visibility)
- ✅ Health endpoints responding
- ✅ Rate limits enforced (headers present)
- ✅ Backup verified (restore drill passed)

---

### Step 8.2: Feature Flags & Rollout
**Goal:** Dark-launch P0 features, measure impact

**Actions:**
1. **Flag Setup:**
   ```typescript
   // src/lib/feature-flags.ts
   export const FLAGS = {
     profile_pins: { rollout: 0.1, kill_switch: false },
     favorites: { rollout: 0.2, kill_switch: false },
     reposts: { rollout: 0.2, kill_switch: false },
     linked_accounts: { rollout: 0.1, kill_switch: false },
     entity_edges: { rollout: 0.05, kill_switch: false },
     nba_modal: { rollout: 0.05, kill_switch: false }
   };
   ```

2. **Gradual Rollout:**
   - Day 1: 5% users
   - Day 2: 10% users (monitor errors)
   - Day 3: 25% users
   - Day 5: 50% users
   - Day 7: 100% users

3. **Monitor Metrics:**
   - Error rate (should stay <0.5%)
   - Latency (p95 < 200ms)
   - User engagement (time on site, actions per session)

**Deliverables:**
- ✅ Flags controlling rollout
- ✅ Metrics dashboards live
- ✅ Kill switches tested

---

### Step 8.3: Documentation & Runbooks
**Goal:** Team can operate and debug

**Create:**
1. **Feature Docs:**
   - Profile Pins: `/docs/features/profile-pins.md`
   - Favorites: `/docs/features/favorites.md`
   - NBA Modal: `/docs/features/nba-modal.md`

2. **Runbooks:**
   - Incident Response: `/docs/runbooks/incident-response.md`
   - DB Restore: `/docs/runbooks/db-restore.md`
   - Feature Rollback: `/docs/runbooks/rollback.md`

3. **API Docs:**
   - Generate OpenAPI spec
   - Publish to `/docs/api`

**Deliverables:**
- ✅ 10+ docs committed
- ✅ Runbooks rehearsed

---

## 📊 Success Metrics (Measure Weekly)

### Week 1-2: Foundation
- ✅ Migrations applied
- ✅ Sentry capturing events
- ✅ Profile features shipped (pins, favorites, reposts, linked accounts, edges)

### Week 3-4: Social & Events
- ✅ Composer feature-complete
- ✅ Cross-posting works
- ✅ Discounts/waitlist live
- ✅ Producer console functional

### Week 5-6: AI & Polish
- ✅ NBA modal showing actions
- ✅ Memory storing/recalling
- ✅ Tests passing (90% coverage)
- ✅ Perf thresholds met (p95 < 200ms)
- ✅ A11y compliant (0 violations)

### Launch:
- ✅ Feature flags controlling rollout
- ✅ 0 P0 bugs in first 48hrs
- ✅ Error rate <0.5%
- ✅ User engagement up 20%

---

## 🎯 Daily Standup Template

**What shipped yesterday:**
- [Feature] merged to main
- [Test] coverage at X%

**Shipping today:**
- [Feature] PR ready for review
- [Bug] fix deployed

**Blockers:**
- Waiting on [dependency]
- Need help with [issue]

**Metrics:**
- Error rate: X%
- p95 latency: Xms
- Test coverage: X%

---

## 🚨 When Things Go Wrong

### Rollback Procedure:
1. Hit kill switch in feature flags
2. Revert last deploy (Lovable history)
3. Check Sentry for errors
4. Post incident report

### Debug Checklist:
- ✅ Check Sentry for stack traces
- ✅ Check logs in edge functions
- ✅ Check DB slow query log
- ✅ Check Redis hit rate
- ✅ Check CDN cache status
- ✅ Run `prod_gap_report()` for schema drift

---

## 🎓 Post-Launch Roadmap (P1, P2, P3)

### P1 (Weeks 7-10):
- Expand NBA tools to 50+
- Mobile gestures + PWA
- i18n (en/es/fr)
- Moderation console
- Tax/KYC for earnings

### P2 (Weeks 11-14):
- Subscriptions/memberships
- Advanced analytics
- Waivers/e-sign
- Live leaderboards
- Webhooks API

### P3 (Months 4-6):
- White-label
- API marketplace
- Advanced automations
- Multi-currency
- Affiliate network

---

## ✅ Definition of "Done" (Per Feature)

A feature is DONE when:
1. ✅ Schema + RLS + indexes exist
2. ✅ RPCs are idempotent, instrumented, rate-limited
3. ✅ UI has loading/empty/error/a11y states
4. ✅ AI hooks wired (NBA/Explain/Memory)
5. ✅ Tests pass (unit + e2e + k6)
6. ✅ Docs written (feature + runbook)
7. ✅ Feature-flagged with rollback path
8. ✅ Sentry capturing errors
9. ✅ Metrics dashboards showing data
10. ✅ PR approved + merged + deployed

---

**Next Action:** Review this plan, then approve pending migrations to start Week 1, Step 0.1.