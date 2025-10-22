# Shared AI Utilities

## Purpose
Common utilities and infrastructure used across all AI roles (User, Admin, Super Andy).

## Modules

### `/planning/` - Multi-Step Planning
- `planner.ts` - Decomposes complex user requests into executable steps
- `critic.ts` - Reviews plans for feasibility, safety, and cost
- `replanner.ts` - Adjusts plans when execution fails or context changes

### `/exec/` - Execution Engine
- `executor.ts` - Executes planned steps with retry logic and rollback
- `transaction_log.ts` - Records all actions with timestamps and outcomes
- `budgets.ts` - Tracks token usage, API costs, and enforces limits

### `/nlp/` - Natural Language Processing
- `intent_router.ts` - Routes user input to appropriate AI capability
- `entity_extract.ts` - Extracts entities (people, places, dates) from text
- `command_parser.ts` - Parses natural language into structured commands

### `/tools/` - Tool Registry
- `registry.ts` - Central registry of available tools for each AI role
- `adapters/` - Adapters for external services (calendar, email, web search)

## Usage Pattern
```typescript
import { planner } from '@/ai/shared/planning/planner';
import { executor } from '@/ai/shared/exec/executor';

// Plan a complex task
const plan = await planner.createPlan(userRequest, context);

// Execute the plan
const result = await executor.execute(plan);
```

## Design Philosophy
- **Reusable**: All modules designed for use across user/admin/super AI
- **Composable**: Functions can be combined in different workflows
- **Observable**: Every action logs to audit trail
- **Fail-Safe**: Graceful degradation when external services unavailable
