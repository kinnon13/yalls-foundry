# Role: OPA policy for AI capability access control
# Path: yalls-inc/yalls-ai/sec/ai-opa.rego

package yalls.ai.access

# Default deny
default allow = false

# User tier: Basic AI features
allow {
  input.role == "user"
  input.capability in ["suggest.follow", "discover.content", "personalize.feed"]
}

# Creator tier: All user features + monetization
allow {
  input.role == "creator"
  input.capability in [
    "suggest.follow",
    "discover.content",
    "personalize.feed",
    "monetize.ideas",
    "audience.insights",
    "content.optimize"
  ]
}

# Business tier: All features
allow {
  input.role == "business"
}

# Rate limit check (stub)
rate_limit_ok {
  # TODO: Check rate limit from Redis or Supabase
  true
}

# Final gate
final_decision {
  allow
  rate_limit_ok
}
