#!/bin/bash
# Setup Guard Flow system - run once to install all guards

echo "🛡️  Setting up Guard Flow system..."
echo ""

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo "❌ Deno is not installed. Please install Deno first:"
    echo "   curl -fsSL https://deno.land/install.sh | sh"
    exit 1
fi

echo "✅ Deno found"

# Check if Node.js is installed (for Husky)
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found"

# Install Husky if not already installed
if ! command -v husky &> /dev/null; then
    echo "📦 Installing Husky..."
    npm install husky --save-dev
fi

# Initialize Husky
echo "🔧 Initializing Husky..."
npx husky install

# Make pre-commit hook executable
chmod +x .husky/pre-commit

# Run verification to test everything
echo ""
echo "🧪 Testing guard scripts..."
echo ""

deno run -A scripts/verify-structure.ts
deno run -A scripts/verify-supabase-config.ts
deno run -A scripts/verify-modules.ts

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "✅ Guard Flow setup complete!"
echo ""
echo "Active protections:"
echo "  • Pre-commit hooks (local)"
echo "  • GitHub Actions CI (remote)"
echo "  • Branch protection (configure on GitHub)"
echo ""
echo "Next steps:"
echo "  1. Push changes to GitHub"
echo "  2. Configure branch protection rules on GitHub repo"
echo "  3. Update .github/CODEOWNERS with your username"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
