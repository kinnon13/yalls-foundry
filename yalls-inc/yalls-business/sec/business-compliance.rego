# OPA Policy: Business Compliance & Access Control
# Enforces owner-only exports, staff view-only, event bus gating

package yalls.business

import future.keywords.if
import future.keywords.in

# Allow owner full access to CRM/exports
allow if {
  input.user.role == "owner"
  input.action in ["contacts.export", "expenses.approve", "invoices.sync"]
}

# Allow staff view-only (no exports/approvals)
allow if {
  input.user.role == "staff"
  input.action in ["contacts.view", "invoices.view"]
}

# Deny regular users from business features
deny if {
  input.user.role == "user"
  startswith(input.action, "business.")
}

# Gate QuickBooks sync to owner only
allow_quickbooks_sync if {
  input.user.role == "owner"
  input.business_id == input.user.business_id
}

# Event bus: Only owner can emit expense-approved
allow_event_emit if {
  input.user.role == "owner"
  input.event_type == "expense-approved"
}

# Audit logging required for exports
audit_required if {
  input.action == "contacts.export"
}
