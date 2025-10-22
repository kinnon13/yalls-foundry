# Security Policy

**Last Updated:** 2025-10-22

## Overview

This document outlines Y'alls Foundry's security policies, incident response procedures, and compliance requirements.

## Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Minimum necessary permissions
3. **Zero Trust**: Verify every access request
4. **Continuous Monitoring**: Real-time threat detection
5. **Secure by Default**: Security built into development process

## Authentication & Authorization

### User Authentication
- **Required**: Email verification for all accounts
- **Optional**: WebAuthn/passkeys for enhanced security
- **Admin Accounts**: **MANDATORY** WebAuthn hardware key (YubiKey, Touch ID, etc.)

### API Authentication
- **Edge Functions**: JWT tokens via Supabase auth
- **Admin Operations**: Service role keys (never exposed to client)
- **External APIs**: Secrets stored in Supabase Vault

### Row Level Security (RLS)
All user-facing tables **MUST** have RLS enabled:
- Users can only access their own data
- Org-scoped data isolated per organization
- Admin overrides only via explicit policies

## Data Protection

### Data Classification

| Level | Description | Examples | Encryption |
|-------|-------------|----------|------------|
| Public | Freely shareable | Business listings, public profiles | HTTPS only |
| Internal | Company use only | Analytics, logs | At rest + transit |
| Confidential | User PII | Email, payment info | Encrypted fields |
| Restricted | Payment data | Stripe tokens | Never stored |

### Encryption Standards
- **At Rest**: AES-256 (Supabase default)
- **In Transit**: TLS 1.3 minimum
- **Secrets**: Supabase Vault with automatic rotation
- **Backups**: Encrypted before S3/R2 upload

### Data Retention

| Data Type | Retention Period | Action After |
|-----------|------------------|--------------|
| User profiles | While account active | Anonymize on delete |
| Transaction logs | 7 years | Required for tax compliance |
| AI action ledger | 2 years | Archive to cold storage |
| Audit logs | 7 years | Compliance requirement |
| System metrics | 90 days | Aggregate, then delete |

## Incident Response

### Severity Levels

**P0 - Critical** (Response: Immediate)
- Data breach or exposure
- Complete service outage
- Payment system compromise

**P1 - High** (Response: < 4 hours)
- Partial service degradation
- Security vulnerability discovery
- Unauthorized access attempt

**P2 - Medium** (Response: < 24 hours)
- Performance issues affecting users
- Minor security concerns
- Failed backup jobs

**P3 - Low** (Response: < 1 week)
- Feature requests with security implications
- Documentation updates
- Routine security patches

### Incident Response Procedure

1. **Detection** (Automated alerts or user report)
2. **Assessment** (Determine severity and scope)
3. **Containment** (Isolate affected systems)
4. **Eradication** (Remove threat, patch vulnerability)
5. **Recovery** (Restore normal operations)
6. **Post-Mortem** (Document lessons learned)

### Communication Protocol

**Internal**:
- P0/P1: Slack #incidents channel + SMS to on-call
- P2/P3: Slack #incidents channel

**External (User-Facing)**:
- P0: Status page + email to all users
- P1: Status page update
- P2/P3: No external communication unless user-reported

### On-Call Rotation

- **Primary**: 24/7 coverage, 30min response time (P0), 4hr response time (P1)
- **Secondary**: Backup escalation
- **Escalation Path**: Primary → Secondary → CTO → CEO

## Vulnerability Management

### Reporting

**Internal Discovery**:
1. Create confidential issue in GitHub
2. Notify security team via Slack
3. Assess severity and timeline

**External Discovery**:
- Email: security@yalls-foundry.com
- Response time: 24 hours acknowledgment
- Disclosure timeline: Coordinate with researcher

### Patch Management

**Critical Vulnerabilities** (CVSS ≥ 9.0):
- Patch within 24 hours
- Emergency deploy authorized

**High Vulnerabilities** (CVSS 7.0-8.9):
- Patch within 7 days
- Include in next release

**Medium/Low** (CVSS < 7.0):
- Include in normal sprint cycle
- Document for release notes

## Compliance & Auditing

### SOC 2 Type II (Target)

**Control Families**:
- Security
- Availability
- Confidentiality
- Processing Integrity
- Privacy

**Audit Frequency**: Annual

### GDPR Compliance

**User Rights**:
- Right to access (data export feature)
- Right to erasure (account deletion with anonymization)
- Right to portability (CSV/JSON export)
- Right to be informed (privacy policy)

**Data Processing**:
- Lawful basis documented for each data type
- Third-party processors vetted (Supabase, Stripe, ElevenLabs, OpenAI)
- Data transfer agreements for international transfers

### PCI-DSS (via Stripe)

Y'alls Foundry **does not** store payment card data. All payment processing is handled by Stripe, which is PCI-DSS Level 1 certified.

**Our Responsibilities**:
- Use Stripe.js for card collection (never touches our servers)
- TLS on all payment-related pages
- Secure Stripe webhook verification

## Security Tooling

### Automated Scanning

| Tool | Frequency | Coverage |
|------|-----------|----------|
| Supabase Linter | Pre-commit | RLS policies, schema |
| GitHub CodeQL | Every push | SAST code analysis |
| Dependabot | Daily | Dependency vulnerabilities |
| OWASP ZAP | Weekly | Web vulnerability scan |

### Monitoring & Alerting

- **Supabase Logs**: Centralized logging for edge functions
- **System Metrics**: Real-time dashboard (Grafana)
- **AI Action Ledger**: Track all AI operations
- **Audit Log**: Immutable record of all mutations

## Access Control

### GitHub Repository

- **Admins**: CTO only
- **Write**: Core team (requires 2FA)
- **Read**: Contractors (time-limited)

**Branch Protection** (main):
- Require PR reviews (2 approvals)
- Require status checks passing
- No force pushes

### Supabase Projects

**Production**:
- Service role key: Vault-stored, rotated quarterly
- Dashboard access: Admin only

**Staging**:
- Service role key: Shared with team (1Password)
- Dashboard access: All developers

### Secrets Management

- **Storage**: Supabase Vault + 1Password
- **Rotation**: Automated every 90 days
- **Access**: Logged in audit_log table
- **Sharing**: Never via email/Slack

## Training & Awareness

### Required Training

**All Employees**:
- Security awareness (annual)
- Phishing simulation (quarterly)
- Incident response basics

**Developers**:
- Secure coding practices (onboarding + annual refresh)
- OWASP Top 10 review
- RLS policy design workshop

**Admins**:
- Advanced threat detection
- Incident commander training
- Compliance requirements overview

## Contact

- **Security Issues**: security@yalls-foundry.com
- **General Inquiries**: support@yalls-foundry.com
- **Bug Bounty**: (Coming soon - responsible disclosure encouraged)

---

**Last Updated:** 2025-10-22
