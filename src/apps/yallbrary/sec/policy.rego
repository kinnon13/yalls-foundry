# Role: Security policy for yallbrary
# Path: src/apps/yallbrary/sec/policy.rego

package yallbrary

default allow = false

allow {
  input.user.authenticated == true
}
