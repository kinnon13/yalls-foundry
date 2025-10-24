# Role: OPA policy for payment security and cart access control
# Path: yalls-inc/yallmart/sec/pay-rbac.rego

package yallmart

import future.keywords.if

# Allow users to view their own cart
default allow_view_cart = false
allow_view_cart if {
    input.action == "view_cart"
    input.user_id == input.resource.user_id
}

# Allow users to add to their cart
default allow_add_to_cart = false
allow_add_to_cart if {
    input.action == "add_to_cart"
    input.user_id == input.resource.user_id
}

# Allow users to checkout their own cart
default allow_checkout = false
allow_checkout if {
    input.action == "checkout"
    input.user_id == input.resource.user_id
    input.cart_total > 0
}

# Allow users to view their own orders
default allow_view_orders = false
allow_view_orders if {
    input.action == "view_orders"
    input.user_id == input.resource.user_id
}

# Admins can view all orders
default allow_admin_orders = false
allow_admin_orders if {
    input.user_role == "admin"
}
