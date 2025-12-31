# GitHub Actions CI/CD Setup

## 🚀 Current Workflows

### **`ci-cd.yml`** - Main Pipeline
Runs on every push to `main` and on pull requests.

**Jobs:**
1. **🧪 Test & Lint** - Runs ESLint, Prettier, and backend tests
2. **🏗️ Build Check** - Verifies frontend builds successfully
3. **🚀 Deploy** - Orchestrates deployment and runs health checks

## 📋 Workflow Behavior

### On Pull Requests
- ✅ Runs tests and linting
- ✅ Verifies build succeeds
- ❌ Does NOT deploy

### On Push to Main
- ✅ Runs tests and linting
- ✅ Verifies build succeeds
- ✅ Triggers deployment
- ✅ Waits for Netlify/Render to deploy
- ✅ Runs health checks

### Manual Trigger
- Available via "Actions" tab → "Run workflow"
- Useful for redeployment without new commits

## 🔧 Configuration

### Auto-Deploy is Already Enabled
Both Netlify and Render are configured to auto-deploy on push to `main`:
- **Netlify**: Detects changes via GitHub integration
- **Render**: Detects changes via GitHub integration

The GitHub Action doesn't trigger deploys manually - it just:
1. Validates the code
2. Waits for auto-deploys to complete
3. Runs health checks to verify deployment

## 🔐 Secrets (Optional for Advanced Features)

If you want to add manual deploy triggers or deployment notifications:

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add these secrets:

| Secret Name | Description | Where to get it |
|-------------|-------------|-----------------|
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token | Netlify → User Settings → Applications |
| `NETLIFY_SITE_ID` | Site ID | Netlify → Site Settings → Site ID |
| `RENDER_API_KEY` | Render API key | Render → Account Settings → API Keys |
| `RENDER_SERVICE_ID` | Backend service ID | Render → Service → Settings → Service ID |

## 📊 Viewing Results

1. Go to your repo on GitHub
2. Click **Actions** tab
3. Click on any workflow run to see details
4. Green ✅ = Success, Red ❌ = Failed

## 🛠️ Customization

### Disable auto-deploy on Netlify/Render
If you want GitHub Actions to control deploys:
1. Disable auto-deploy on Netlify/Render
2. Uncomment the deploy API calls in `ci-cd.yml`
3. Add required secrets

### Add E2E tests
Add Playwright E2E tests after deployment:
```yaml
- name: 🎭 Run E2E tests
  run: |
    cd apps/frontend
    pnpm exec playwright test --config=playwright.config.ci.js
```

### Add Slack/Discord notifications
Use marketplace actions like:
- `slackapi/slack-github-action`
- `sarisia/actions-status-discord`

## 🚨 Troubleshooting

**Build fails on "pnpm not found"**
- Workflow includes pnpm setup step, should auto-resolve

**Tests fail but you want to deploy anyway**
- Set `continue-on-error: true` on test steps (already configured)

**Deployment health check fails**
- Increase wait time in workflow (currently 60s)
- Check Render/Netlify logs for deployment errors
