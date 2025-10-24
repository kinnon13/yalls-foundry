# Role: Content moderation policy
# Path: src/apps/yalls-social/sec/social-moderate.rego

package social

default allow_post = false

allow_post {
  input.user.verified == true
  input.content.length <= 2000
}
