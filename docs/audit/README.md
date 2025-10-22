# Audit Reports

**Last Updated:** 2025-10-22

## Purpose

This directory stores audit reports, compliance snapshots, security scan results, and historical architecture decision records.

## Contents

### Security Audits
- RLS policy verification results
- Tenant isolation test reports
- Penetration testing findings
- Vulnerability scan outputs

### Compliance Reports
- Database schema compliance checks
- Code quality metrics
- Architecture constraint adherence
- API security reviews

### Historical Records
- Major architectural decision documents (ADRs)
- Migration impact assessments
- Performance benchmarking results
- Incident post-mortems

## Report Standards

All audit reports in this directory should include:

1. **Timestamp**: Clear date/time of when the audit was performed
2. **Scope**: What was audited (tables, functions, endpoints, etc.)
3. **Methodology**: How the audit was conducted
4. **Findings**: Issues discovered, categorized by severity
5. **Remediation**: Actions taken or recommended
6. **Sign-off**: Who performed and reviewed the audit

## Severity Levels

- **CRITICAL**: Security vulnerability, data exposure risk, or system failure
- **HIGH**: Significant issue affecting functionality or performance
- **MEDIUM**: Quality issue or minor security concern
- **LOW**: Code style, documentation, or optimization opportunity
- **INFO**: Informational finding, no action required

## Naming Convention

```
YYYY-MM-DD-[audit-type]-[component].md

Examples:
2025-10-22-rls-verification-all-tables.md
2025-10-22-security-scan-edge-functions.md
2025-10-22-performance-benchmark-search.md
```

## Automated Audits

The following audits run automatically in CI:

```bash
# RLS policy verification
./scripts/audit/verify-rls.sh

# Tenant guard enforcement
./scripts/audit/check-tenant-guards.sh

# Health check
node scripts/health/generate-report.mjs
```

Results are automatically stored here when running in CI.

## Manual Audits

For manual audits, use the provided templates:

```bash
# Security audit template
cp docs/audit/templates/security-audit.template.md \
   docs/audit/$(date +%Y-%m-%d)-security-audit-[component].md

# Performance audit template
cp docs/audit/templates/performance-audit.template.md \
   docs/audit/$(date +%Y-%m-%d)-performance-audit-[component].md
```

## Retention Policy

- **Critical findings**: Keep indefinitely
- **High/Medium findings**: Keep for 2 years after remediation
- **Low/Info findings**: Keep for 1 year
- **Routine reports**: Keep most recent 10, archive older

## Access Control

- **Read**: All team members
- **Write**: Security team, DevOps, Tech Lead
- **Delete**: Tech Lead approval required

## Related Documentation

- [Production Hardening](../production/PRODUCTION_HARDENING.md)
- [Branching Strategy](../processes/BRANCHING_STRATEGY.md)
- [Audit Scripts](../../scripts/audit/README.md)

---

**Last Updated:** 2025-10-22
