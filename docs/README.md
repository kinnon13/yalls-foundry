# Documentation Index

**Last Updated:** 2025-10-22

## Overview

This directory contains all project documentation organized by purpose: architecture decisions, development processes, production deployment, and audit reports.

## Directory Structure

```
docs/
├── architecture/  # System design, constraints, and technical decisions
├── processes/     # Development workflows, branching strategies, and team protocols
├── production/    # Deployment, hardening, and operational readiness
└── audit/         # Compliance snapshots and security reports
```

## Quick Navigation

### 📐 Architecture
Documents defining system structure, design constraints, and technical decisions.

- **[10-SECTION-LOCKDOWN.md](./architecture/10-SECTION-LOCKDOWN.md)**
  - Hard limit of 10 application sections for maintainability
  - Route structure and aliases
  - CI guardrails for architectural compliance
  - Core RPCs and section definitions

### 🔀 Processes
Development workflows, branching strategies, and collaboration protocols.

- **[BRANCHING_STRATEGY.md](./processes/BRANCHING_STRATEGY.md)**
  - Multi-stream parallel development workflow
  - Migration train coordination for DB changes
  - Environment split (prod/staging/scratch)
  - CI/CD gates and deployment flow
  - 2-week sprint timeline and work distribution

- **[SOLO_WORKFLOW.md](./processes/SOLO_WORKFLOW.md)**
  - Simplified workflow for solo developer
  - Multi-device branch assignment
  - Device switching protocols
  - Merge and rollback procedures

### 🚀 Production
Deployment procedures, hardening checklists, and operational readiness.

- **[PRODUCTION_HARDENING.md](./production/PRODUCTION_HARDENING.md)**
  - Tenant isolation and blast radius control
  - Dual search architecture (private vs marketplace)
  - Job queue patterns for heavy operations
  - Rate limiting per-org implementation
  - Acceptance criteria for production readiness

### 📊 Audit
Historical snapshots, security reports, and compliance documentation.

- Audit reports and compliance snapshots are stored here
- Security scan results and remediation tracking
- Historical architecture decisions and their rationale

## Document Standards

All documentation in this directory follows these standards:

1. **Metadata**: Each document includes "Last Updated: YYYY-MM-DD" timestamp
2. **Code Blocks**: All code examples specify language (```ts, ```sql, ```bash, etc.)
3. **Secrets**: No live API keys or tokens (use `[EXAMPLE_KEY_HERE]` placeholders)
4. **Links**: Relative links within docs, absolute for external references
5. **Structure**: Clear headings, actionable sections, defined success criteria

## For New Engineers

Start here:
1. Read [10-SECTION-LOCKDOWN.md](./architecture/10-SECTION-LOCKDOWN.md) to understand system constraints
2. Review [SOLO_WORKFLOW.md](./processes/SOLO_WORKFLOW.md) or [BRANCHING_STRATEGY.md](./processes/BRANCHING_STRATEGY.md) depending on team size
3. Check [PRODUCTION_HARDENING.md](./production/PRODUCTION_HARDENING.md) for deployment readiness

## For AI Agents

When answering questions about:
- **Architecture**: Refer to `architecture/` for system design constraints
- **Workflows**: Refer to `processes/` for branching and development protocols  
- **Deployment**: Refer to `production/` for hardening and readiness criteria
- **Compliance**: Refer to `audit/` for historical context and reports

## Contributing

When adding new documentation:
1. Place in appropriate subdirectory based on purpose
2. Add entry to this README under correct section
3. Include "Last Updated: YYYY-MM-DD" at bottom
4. Ensure all code blocks have language hints
5. Replace any real secrets with placeholders
6. Run `node scripts/health/generate-report.mjs` to verify doc integrity

## Cross-References

- Project root [README.md](../README.md) - Project overview and quick start
- [Scripts README](../scripts/README.md) - Automation and validation tools
- [PROJECT_RULES.md](../PROJECT_RULES.md) - Governance and enforcement rules
- [structure.lock.json](../structure.lock.json) - File structure constraints

---

**Last Updated:** 2025-10-22
