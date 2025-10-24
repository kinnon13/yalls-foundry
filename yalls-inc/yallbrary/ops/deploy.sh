#!/bin/bash
# Role: Deploy Yallbrary widgets to production rocker
# Path: yalls-inc/yallbrary/ops/deploy.sh
# Usage: ./yalls-inc/yallbrary/ops/deploy.sh

set -e

echo "🚀 Deploying Yallbrary widgets..."

# Build widgets
echo "📦 Building widgets..."
node yalls-inc/yallbrary/scripts/build-widgets.js

# Deploy edge function
echo "⚡ Deploying edge function..."
npx supabase functions deploy yallbrary

# Run migrations
echo "🗄️  Running migrations..."
npx supabase db push

echo "✅ Yallbrary deployed successfully!"
echo "🔗 Test at: https://your-app.lovable.app?app=yallbrary"
