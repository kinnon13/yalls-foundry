#!/bin/bash
# Role: Deploy yallbrary to rocker
# Path: src/apps/yallbrary/ops/deploy.sh

echo "Deploying yallbrary..."
npm run build
echo "Deploy complete"
