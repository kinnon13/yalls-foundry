# Yalls AI - Tiered Oracle System

**Role**: AI oracle with role-based capability gating (user/creator/business tiers)  
**Path**: `yalls-inc/yalls-ai/`

## Features

- **Tiered Kernels**: Role-scaled AI access (user: suggestions, creator: monetization, business: forecasting)
- **Grok-Like Intelligence**: Context-aware prompts with dynamic capability loading
- **Responsive UI**: AI Nudge component (flex-col sm:flex-row for mobile/desktop)
- **Daily Fine-Tuning**: Auto-tuning cron (scripts/fine-tune-cron.py) for personalized oracle
- **Security**: OPA policy (sec/ai-opa.rego) gates AI features by role

## Architecture

```
yalls-ai/
├── src/
│   ├── app/tiered/page.tsx          # Tiered AI UI
│   ├── components/AINudge.tsx       # Suggestion nudges
│   ├── services/tiered-kernel.ts    # Role-based capability router
│   └── contract.ts                  # Section contract
├── libs/models/tiered.model.ts      # Capability definitions
├── scripts/fine-tune-cron.py        # Daily tuning worker
├── cypress/e2e/tier.spec.cy.ts      # Gate tests
├── k6/load-oracle.js                # 500 query load test
├── ops/rollback-ai.sh               # AI rollback utility
└── sec/ai-opa.rego                  # Access policies
```

## Usage

```typescript
import { useTieredAI } from '@/lib/shared/hooks/useTieredAI';

const { suggest, capabilities } = useTieredAI();
const result = await suggest('optimize-cart'); // Role-gated
```

## Capabilities by Role

- **User**: follow suggestions, content discovery
- **Creator**: monetization ideas, audience insights
- **Business**: revenue forecasting, inventory optimization

## Testing

```bash
# E2E gate tests
npx cypress run --spec cypress/e2e/tier.spec.cy.ts

# Load test (500 queries)
k6 run k6/load-oracle.js
```

## Deployment

```bash
./ops/rollback-ai.sh  # If oracle misbehaves
```
