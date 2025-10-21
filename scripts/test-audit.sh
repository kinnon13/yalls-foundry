#!/bin/bash
# Test the Gemini audit system locally

set -e

echo "🧪 Testing Gemini Audit System"
echo "================================"

# Check for required env vars
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  echo "Set these in your environment or .env file"
  exit 1
fi

# Create synthetic diff
cat > test-audit.diff << 'EOF'
diff --git a/src/components/LoginForm.tsx b/src/components/LoginForm.tsx
index 1234567..abcdefg 100644
--- a/src/components/LoginForm.tsx
+++ b/src/components/LoginForm.tsx
@@ -10,7 +10,7 @@ export function LoginForm() {
   const handleLogin = async (email: string, password: string) => {
-    const response = await fetch('/api/login', {
+    const response = await fetch(`/api/login?token=${localStorage.getItem('token')}`, {
       method: 'POST',
       body: JSON.stringify({ email, password })
     });
@@ -20,6 +20,8 @@ export function LoginForm() {
+    // Store sensitive data in localStorage
+    localStorage.setItem('user_data', JSON.stringify(userData));
   };
EOF

echo ""
echo "📝 Created synthetic diff with security issues"
echo ""

# Call the audit function
echo "🔍 Calling rocker-audit..."
curl -X POST "${VITE_SUPABASE_URL}/functions/v1/rocker-audit" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d @- << EOF | jq '.' > test-audit-results.json
{
  "prNumber": 999,
  "diff": $(cat test-audit.diff | jq -Rs .),
  "repo": "test/repo",
  "ref": "test"
}
EOF

echo ""
echo "✅ Audit complete! Results saved to test-audit-results.json"
echo ""
cat test-audit-results.json | jq -r '.findings[] | "[\(.severity)] \(.title): \(.advice)"'
echo ""

# Cleanup
rm test-audit.diff

exit 0
