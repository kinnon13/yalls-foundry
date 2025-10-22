# AI System Architecture

## Overview
This directory contains the entire AI system architecture for the platform, organized by role and capability level.

## Structure

### `/shared/` - Common AI Utilities
Shared modules used across all AI roles:
- **Planning**: Multi-step planning, plan criticism, replanning logic
- **Execution**: Transaction logs, budget tracking, action execution
- **NLP**: Intent routing, entity extraction, command parsing
- **Tools**: Tool registry and adapters for external integrations

### `/user/` - User-Level AI (Rocker)
Personal AI assistant with standard permissions:
- Profile-aware suggestions
- Personal memory and context
- Standard tool access
- No admin capabilities

### `/admin/` - Admin-Level AI
Elevated AI with moderation and management permissions:
- Content moderation
- User management assistance
- Analytics and reporting
- Admin tool access

### `/super/` - Super Andy (System-Level AI)
Full system access with self-awareness:
- Self-modification capabilities
- Complete system control
- Meta-cognitive reasoning
- Curiosity-driven learning

### `/experimental/` - Cutting-Edge Modules
Experimental AI capabilities under development:
- Neuro-symbolic reasoning
- Multimodal processing
- Reinforcement learning
- Hybrid memory systems

## Integration Points
- All AI actions log to `ai_action_ledger` table
- Shared planning and execution modules ensure consistency
- Role-based access control enforced at brain level
- Tool registry provides unified interface to system capabilities

## Key Principles
1. **Role Isolation**: Each AI role operates within clear permission boundaries
2. **Observable Actions**: All AI decisions and actions are logged and auditable
3. **Shared Infrastructure**: Common planning and execution logic across all roles
4. **Graceful Degradation**: AI features degrade gracefully if external services fail
