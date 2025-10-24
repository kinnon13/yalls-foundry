# Yalls AI - Tiered Oracle System

## Overview

Yalls AI is a role-based AI oracle that provides contextual suggestions and insights based on user tier (user, creator, business). It gates capabilities by role to prevent abuse and manage costs.

## Tiers

### 1. User Tier (Free)

**Capabilities:**
- `suggest.follow`: Personalized follow suggestions
- `discover.content`: Content discovery based on interests
- `personalize.feed`: Feed personalization

**Rate Limit:** 10 queries/min  
**Cost:** 100-200 tokens/query

### 2. Creator Tier ($9.99/mo)

**Capabilities:**
- All user tier features
- `monetize.ideas`: Monetization strategy suggestions
- `audience.insights`: Audience analytics and trends
- `content.optimize`: Content optimization tips

**Rate Limit:** 5 queries/min  
**Cost:** 500-700 tokens/query

### 3. Business Tier ($49.99/mo)

**Capabilities:**
- All creator tier features
- `forecast.revenue`: 30/90-day revenue forecasting
- `optimize.inventory`: Inventory optimization recommendations
- `predict.churn`: Customer churn prediction

**Rate Limit:** 3 queries/min  
**Cost:** 1000-1500 tokens/query

## Integration

```typescript
import { executeQuery } from '@/yalls-ai/services/tiered-kernel';

const result = await executeQuery('user', 'suggest.follow', {
  userId: 'user123',
  interests: ['tech', 'startup'],
});

console.log(result.suggestion); // "Follow @elon for tech insights"
```

## Security

Access is gated by OPA policy (`sec/ai-opa.rego`). Attempting to access a higher-tier capability without proper role will return `403 Forbidden`.

## Fine-Tuning

Daily fine-tuning cron (`scripts/fine-tune-cron.py`) runs at 2 AM to personalize the oracle based on user feedback and interactions.
