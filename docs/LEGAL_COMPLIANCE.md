# Legal Compliance & User Tracking

## Overview
This document outlines the mandatory tracking and logging that occurs for all users, regardless of consent settings, to ensure legal compliance and platform safety.

## Always-On Tracking (Non-Negotiable)

### 1. User Identity Tracking
**What is tracked:**
- User ID (UUID)
- Email address
- Authentication timestamp
- IP address (in auth logs)
- User agent information

**Why it's always on:**
- Legal compliance and law enforcement requests
- Fraud prevention and security
- Terms of Service enforcement
- DMCA and copyright violation tracking
- Abuse and harassment investigations

**Where it's stored:**
- `auth.users` table (managed by Supabase)
- `profiles` table (user_id)
- `rocker_conversations` table (user_id)
- `ai_interaction_log` table (user_id)
- `admin_audit_log` table (actor_user_id)
- `claim_events` table (actor_user_id, new_owner_id, previous_owner_id)
- `content_flags` table (reporter_user_id)

### 2. Conversation Logging
**What is tracked:**
- All messages sent to Rocker (user and assistant)
- Timestamps of all interactions
- Session IDs for conversation threading
- Metadata (tool calls, navigation, etc.)

**Why it's always on:**
- Platform safety and abuse prevention
- Terms of Service violations (harassment, illegal content)
- User safety investigations
- Law enforcement requests
- Audit trail for system actions

**Where it's stored:**
- `rocker_conversations` table
- `ai_interaction_log` table

### 3. Action Logging
**What is tracked:**
- All actions performed through Rocker (posts, edits, deletions, etc.)
- Content creation and modification
- Administrative actions
- Business operations (CRM, inventory, etc.)

**Why it's always on:**
- Accountability for user actions
- Content moderation and DMCA compliance
- Fraud and abuse detection
- Dispute resolution
- Legal discovery requests

**Where it's stored:**
- `ai_interaction_log` table
- `admin_audit_log` table
- Entity-specific tables (posts, events, etc.)

## Consent-Gated Features

The following features REQUIRE user consent and are NOT enabled by default:

### 1. Memory Storage (`ai_user_memory`)
- Extraction of user preferences from conversations
- Storage of learned patterns and facts
- Personalization data

**How Data is Used:**
- All learned patterns stored confidentially
- Used ONLY for platform training and improvement
- Personal identifiers (names, emails) are NEVER used in AI training data
- Helps improve platform for all users without sharing personal details

**User Control:**
- Users must opt-in via `ai_user_consent.site_opt_in`
- Can be revoked at any time
- Data can be deleted on request
- Full transparency via Knowledge Browser

### 2. Cross-User Analytics (`ai_user_analytics`, `ai_global_patterns`)
- Comparison metrics against other users
- Aggregated pattern detection
- Success rate calculations

**User Control:**
- Requires consent to contribute data
- Individual metrics hidden without consent
- Can opt-out of analytics

### 3. Proactive Suggestions (`ai_proposals`)
- AI-initiated recommendations
- Automated nudges and reminders
- Email/SMS notifications

**User Control:**
- Requires explicit opt-in
- Granular channel control (email, SMS, push)
- Quiet hours settings

## Data Retention

### Mandatory Retention (Cannot be Deleted)
- **Conversation logs:** Retained for 7 years minimum
- **Audit logs:** Retained for 10 years minimum
- **Content violation records:** Retained indefinitely
- **Legal hold data:** Retained per legal requirements

### User-Deletable Data
- `ai_user_memory` - Can be deleted on request
- `ai_user_analytics` - Can be cleared on request
- Personal profile information - Can be edited/deleted

## Export Rights

Users have the right to export:
- All conversation history
- All learned memories
- All interaction logs
- Profile and account data

**Available via:**
- Admin Control Room → Knowledge tab
- Account settings → Export Data
- Support request for comprehensive export

## Law Enforcement Requests

### What We Provide
When legally required, we can provide:
1. Complete user identity (email, user_id, IP addresses)
2. Full conversation history with timestamps
3. All actions performed through the platform
4. Content created, edited, or deleted
5. Associated metadata (locations, timestamps, user agents)

### Legal Requirements
- Valid subpoena, warrant, or court order
- Proper jurisdiction verification
- Notice to user (unless prohibited by law)
- Documentation in `admin_audit_log`

## Privacy & Transparency

### What Users Can See
- Their own conversation history (Knowledge Browser)
- Their own learned memories (with consent)
- Their own analytics (with consent)
- Aggregated, anonymized global patterns

### What Users Cannot See
- Other users' personal information
- Raw system logs and admin actions
- Cross-user comparison details (only percentiles)
- Law enforcement request details

## Compliance Notes

This tracking structure ensures compliance with:
- **GDPR:** Lawful basis = legitimate interests (safety, legal obligations)
- **CCPA:** Required for security and legal compliance
- **COPPA:** Enhanced protections for minors
- **ECPA:** Stored communications act compliance
- **DMCA:** Copyright violation tracking

## Admin Access

Super admins (`kinnonpeck@gmail.com` and others with `admin` role) can:
- View all user identities and conversations
- Export any user's complete history
- Access audit logs for all actions
- Respond to legal requests
- Investigate safety/abuse reports

**Access is logged in `admin_audit_log` for oversight.**

## Questions?

For questions about data tracking, privacy, or legal compliance:
- Review the Privacy Policy
- Contact support
- File a data access request
- Consult legal counsel
