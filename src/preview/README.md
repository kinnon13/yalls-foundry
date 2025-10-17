# Preview System - Architecture & Security

## Overview
Read-only UI previews for Pay/Admin/Data experiences. No writes, no money moves.

## Security Model (Defense-in-Depth)
1. **Env flag** - VITE_PREVIEW_ENABLED must be true
2. **Admin auth** - Routes gated via PreviewGuard
3. **Origin allowlist** - Only trusted domains accepted
4. **HMAC tokens** - 5-minute signed tokens prevent spoofing
5. **Mutation blocking** - Fetch/XHR/WebSocket/Forms/SendBeacon blocked
6. **Schema validation** - All messages validated via zod
7. **Server audit** - All events logged to audit-preview-event function

## Hand-off Contract

```typescript
type PreviewEvent =
  | { source: 'pay-preview', type: 'PAYMENT_SUCCESS', orderId: string, intentId?: string }
  | { source: 'pay-preview', type: 'PAYMENT_FAIL', orderId?: string, reason?: string }
  | { source: 'pay-preview', type: 'KYC_COMPLETE', accountId?: string }
  | { source: 'pay-preview', type: 'LABEL_PURCHASED', orderId: string, carrier?: string, tracking?: string }
  | { source: 'preview-security', type: 'BLOCKED_WRITE', method: string, url?: string }
```

## Usage

Open preview with HMAC:
```typescript
import { openPreviewWindow } from '@/lib/preview/openPreview';
const win = await openPreviewWindow('/preview/pay/checkout');
```

Listen for events in parent:
```typescript
import { usePreviewMessage } from '@/preview/usePreviewMessage';
usePreviewMessage((event) => {
  // Handle validated + audited event
});
```

## Rollout to Subdomains
When moving to real subdomains, update only the origin allowlist - contract stays identical.
