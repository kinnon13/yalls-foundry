# Role: OPA policy for social feed content moderation and access control
# Path: yalls-inc/yalls-social/sec/social-moderate.rego

package yalls_social

import future.keywords.if

# Allow authenticated users to view feed
default allow_view_feed = false
allow_view_feed if {
    input.action == "view_feed"
    input.user_role != "anonymous"
}

# Allow users to create posts
default allow_create_post = false
allow_create_post if {
    input.action == "create_post"
    input.user_id == input.resource.user_id
    not is_blocked_user(input.user_id)
}

# Allow users to like posts
default allow_like_post = false
allow_like_post if {
    input.action == "like_post"
    input.user_role != "anonymous"
}

# Allow users to delete only their own posts
default allow_delete_post = false
allow_delete_post if {
    input.action == "delete_post"
    input.user_id == input.resource.user_id
}

# Admins can moderate any content
default allow_admin_moderate = false
allow_admin_moderate if {
    input.user_role == "admin"
}

# Check if user is blocked (stub for future moderation)
is_blocked_user(user_id) {
    # Stub: Query blocked_users table
    false
}
