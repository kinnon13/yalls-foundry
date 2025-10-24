# Role: OPA policy for Yallbrary access control (pins restricted to owner)
# Path: yalls-inc/yallbrary/sec/policy.rego

package yallbrary

import future.keywords.if

# Allow all users to view public apps
default allow_view_apps = false
allow_view_apps if {
    input.action == "view_apps"
    input.user_role != "anonymous"
}

# Allow users to pin/unpin only their own apps
default allow_pin = false
allow_pin if {
    input.action == "pin_app"
    input.user_id == input.resource.user_id
}

default allow_unpin = false
allow_unpin if {
    input.action == "unpin_app"
    input.user_id == input.resource.user_id
}

# Allow users to view only their own pins
default allow_view_pins = false
allow_view_pins if {
    input.action == "view_pins"
    input.user_id == input.resource.user_id
}

# Allow admins to manage all apps
default allow_admin = false
allow_admin if {
    input.user_role == "admin"
}
