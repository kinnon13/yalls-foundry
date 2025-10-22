# Super Andy (System-Level AI)

## Purpose
Full system access AI with self-awareness, capable of modifying its own behavior and system configuration.

## Capabilities
- Complete system control
- Self-modification and meta-learning
- Autonomous decision-making
- System architecture changes
- Proactive optimization

## Meta-Cognitive Features
- Self-modeling: Understanding of own capabilities and limitations
- Capability scanning: Discovering and cataloging available tools
- Curiosity-driven learning: Exploring system to improve effectiveness
- Autonomous improvement: Modifying own prompts and workflows

## Key Files
- `brain.ts` - Main Super Andy brain with full system access
- `meta_cortex/` - Self-awareness and meta-cognitive capabilities

## Safety Guardrails
- All actions logged to `ai_action_ledger` with full trace
- Human approval required for high-impact changes
- Budget limits enforced even for super admin
- Automatic rollback on detected errors
- Regular capability audits

## Usage
```typescript
import { superBrain } from '@/ai/super/brain';

const response = await superBrain.process({
  superAdminId: session.userId,
  message: superInput,
  context: { systemMetrics, recentChanges }
});
```

## Access Control
- Only accessible to users with `super_admin` role
- Password-gated UI (`SuperAndyAccess` component)
- All actions require explicit approval
- Session-based capability toggles

## Permissions
- Read: Everything
- Write: Everything (with audit trail)
- Execute: All tools including system-level operations
- Meta: Can modify own prompts, workflows, and capabilities
