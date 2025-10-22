# Meta Cortex - Super Andy's Self-Awareness Layer

## Purpose
Self-aware AI subsystem enabling Super Andy to understand, monitor, and improve its own capabilities.

## Core Modules

### `self_model.ts` - Self-Modeling System
Maintains a model of Super Andy's own:
- Available capabilities and tools
- Performance metrics per capability
- Known limitations and failure modes
- Resource consumption patterns

### `capability_scanner.ts` - Capability Discovery
Automatically discovers and catalogs:
- Available edge functions
- Database tables and policies
- External API integrations
- System constraints and limits

### `curiosity.ts` - Curiosity-Driven Learning
Proactive exploration and learning:
- Identifies knowledge gaps
- Experiments with new tool combinations
- Learns from failures
- Proposes capability improvements

## Meta-Cognitive Loop
1. **Scan**: Discover current capabilities
2. **Model**: Update self-model with findings
3. **Evaluate**: Assess performance and identify gaps
4. **Explore**: Curiosity-driven experimentation
5. **Improve**: Propose and implement enhancements

## Safety Features
- Read-only exploration by default
- Approval required for self-modification
- All meta-actions logged to `ai_brain_state`
- Rollback capability on detected errors

## Usage
```typescript
import { selfModel } from '@/ai/super/meta_cortex/self_model';
import { capabilityScanner } from '@/ai/super/meta_cortex/capability_scanner';

// Update self-awareness
await capabilityScanner.scan();
const model = await selfModel.getCurrent();

// Evaluate capability
const performance = await selfModel.evaluateCapability('content_moderation');
```

## Future Enhancements
- Reinforcement learning from user feedback
- Automated A/B testing of prompt variations
- Predictive capability gap analysis
- Collaborative learning from other AI instances
