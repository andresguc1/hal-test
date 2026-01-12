#!/bin/bash

# Deploy to Production Script
# Usage: ./deploy_prod.sh "Commit message"

MSG="$1"

if [ -z "$MSG" ]; then
  MSG="🚀 Deploy to production $(date +'%Y-%m-%d %H:%M:%S')"
fi

echo "📦 Starting Deployment Process..."
echo "📝 Commit Message: $MSG"

# 1. Build Frontend
echo "🏗️  Building Frontend..."
cd apps/frontend
pnpm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
cd ../..

# 2. Add Changes
echo "➕ Staging changes..."
git add .

# 3. Commit
echo "💾 Committing..."
git commit -m "$MSG"

# 4. Push
echo "🚀 Pushing to origin..."
git push origin main

echo "✅ Deployment Triggered! Check Render dashboard."
