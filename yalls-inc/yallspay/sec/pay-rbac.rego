# Role: OPA policy for Yallspay payment access control
# Path: yalls-inc/yallspay/sec/pay-rbac.rego

package yalls.pay.access

# Default deny
default allow = false

# Users can view their own payouts
allow {
  input.action == "view_payouts"
  input.user_id == input.resource_owner
}

# Users can request payouts for their own account
allow {
  input.action == "request_payout"
  input.user_id == input.resource_owner
  input.amount <= input.available_balance
}

# Admins can view all payouts
allow {
  input.role == "admin"
  input.action in ["view_payouts", "process_payout"]
}

# Platform can process batch payouts
allow {
  input.role == "platform"
  input.action == "batch_payout"
}

# Rate limit check (stub)
rate_limit_ok {
  # TODO: Check rate limit from Redis
  true
}

# Balance check for payouts
balance_check {
  input.amount <= input.available_balance
}

# Final decision
final_decision {
  allow
  rate_limit_ok
  balance_check
}
