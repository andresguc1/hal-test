# Rollback Runbook

## Overview

This runbook provides step-by-step procedures for rolling back HalTest releases across all distribution channels.

## Rollback Types

| Type                       | Scope                   | Use Case                                   |
| -------------------------- | ----------------------- | ------------------------------------------ |
| **Full Rollback**          | App + Database + npm    | Critical bugs affecting all channels       |
| **App-Only Rollback**      | HalTest Online (Render) | Frontend/backend bugs, database compatible |
| **Database-Only Rollback** | SQLite/PostgreSQL       | Schema migration issues                    |
| **npm Deprecation**        | npm package only        | Critical npm package bugs                  |

---

## Quick Reference

### Emergency Contacts

- **On-call Engineer**: Check PagerDuty / Slack #oncall
- **Render Dashboard**: https://dashboard.render.com
- **npm Package**: https://www.npmjs.com/package/haltest

### Key URLs

- **Production Health**: https://hal-test-backend.onrender.com/api/status
- **Production App**: https://hal-test-backend.onrender.com/app/
- **Staging Health**: https://hal-test-backend-staging.onrender.com/api/status
- **Render Deploys**: https://dashboard.render.com/web/hal-test-backend/deploys

---

## Automated Rollback Triggers

The system automatically triggers rollback when:

1. **Critical Health Check Failure** (every 15 min cron)
   - `/api/status` returns non-200
   - `/app/` returns non-200
   - Doctor endpoint reports Playwright failure

2. **Failed Release Workflow**
   - Release workflow fails at any stage
   - Post-release monitoring detects issues

3. **Manual Trigger**
   - Via GitHub Actions workflow_dispatch

---

## Rollback Procedures

### 1. Full Rollback (App + Database + npm)

**When to use**: Critical bugs affecting all channels, database incompatibility

**Automated** (preferred):

```bash
# Via GitHub Actions
gh workflow run auto-rollback.yml -f rollback_type=full -f backup_name=database.sqlite.2026-09-12T18-46-28.bak
```

**Manual**:

```bash
# 1. Trigger app rollback via Render
gh api -X POST /repos/andresguc1/hal-test/actions/workflows/auto-rollback.yml/dispatches \
  -f rollback_type=full -f backup_name=database.sqlite.2026-09-12T18-46-28.bak

# 2. Or use rollback script directly
export RENDER_API_KEY=your_key
export RENDER_PRODUCTION_SERVICE_ID=your_service_id
node scripts/rollback.js rollback database.sqlite.2026-09-12T18-46-28.bak

# 3. Deprecate npm package
export NPM_TOKEN=your_token
node scripts/npm-deprecate.js deprecate haltest@1.0.72 "Rolled back due to critical issues"
```

**Verification**:

```bash
# Check health
node scripts/rollback.js health

# Expected: All endpoints return 200
# Version in /api/status should match previous version
```

---

### 2. App-Only Rollback (Render)

**When to use**: Frontend/backend bugs, database schema compatible with previous version

**Automated**:

```bash
gh workflow run auto-rollback.yml -f rollback_type=app-only
```

**Manual via Render Dashboard**:

1. Go to https://dashboard.render.com/web/hal-test-backend/deploys
2. Find previous successful deploy (green checkmark)
3. Click "..." menu → "Rollback to this deploy"
4. Confirm rollback

**Manual via API**:

```bash
export RENDER_API_KEY=your_key
export RENDER_PRODUCTION_SERVICE_ID=your_service_id
node scripts/rollback.js app-rollback
```

**Verification**:

```bash
# Wait 2-3 minutes for deploy
node scripts/rollback.js health

# Check version matches previous
curl -s https://hal-test-backend.onrender.com/api/status | jq '.version'
```

---

### 3. Database-Only Rollback

**When to use**: Migration issues, schema incompatibility

**Prerequisites**:

- Valid backup exists in `/backups/`
- Application compatible with previous schema

**Procedure**:

```bash
# List available backups
cd apps/backend && pnpm db:backup:list

# Restore specific backup
export RENDER_API_KEY=your_key  # For production DB (PostgreSQL)
node scripts/rollback.js db-rollback database.sqlite.2026-09-12T18-46-28.bak
```

**For PostgreSQL (Production)**:

```bash
# Using pg_restore (requires DATABASE_URL)
export DATABASE_URL=postgresql://...
pg_restore -d $DATABASE_URL /path/to/backup.sql
```

**PostgreSQL Point-in-Time Recovery (PITR)**:

1. Go to Supabase Dashboard → Database → Backups
2. Select "Point in Time Recovery"
3. Choose timestamp before migration
4. Confirm restore (creates new database)
5. Update `DATABASE_URL` to point to restored database

---

### 4. npm Package Deprecation

**When to use**: Critical bug in published npm package

**Procedure**:

```bash
# Get current version
VERSION=$(node -p "require('./apps/cli/package.json').version")

# Deprecate
export NPM_TOKEN=your_npm_token
node scripts/npm-deprecate.js deprecate haltest@$VERSION "Critical bug - use previous version"

# Verify
npm view haltest@$VERSION deprecated
```

**User Impact**:

- `npx haltest@latest` will show deprecation warning
- Users pinned to specific version unaffected
- `npm install haltest@1.0.71` still works

**Recovery** (if fixed):

```bash
# Undeprecate if bug was minor
node scripts/npm-deprecate.js undeprecate haltest@$VERSION
```

**Note**: Cannot unpublish after 24 hours. Must publish patch version.

---

## Rollback Decision Matrix

| Symptom                  | Recommended Rollback | Reason                     |
| ------------------------ | -------------------- | -------------------------- |
| App crashes on startup   | Full                 | Database may have migrated |
| API errors (500)         | App-only             | Database likely compatible |
| Frontend loads but blank | App-only             | Database not affected      |
| Migration failed         | Database + App       | Schema incompatible        |
| npm package broken       | npm deprecate + App  | Users getting bad package  |
| Performance regression   | App-only             | No data loss risk          |

---

## Post-Rollback Checklist

- [ ] All health endpoints return 200
- [ ] Version in `/api/status` matches expected previous version
- [ ] Frontend loads at `/app/`
- [ ] Landing page loads at `/`
- [ ] Playwright/Chromium functional (`/api/doctor`)
- [ ] Smoke tests pass (`pnpm test` locally if possible)
- [ ] Database connections work
- [ ] Team notified in Slack #deployments
- [ ] Incident documented in GitHub Issue

---

## Database Migration Rollback

Since we use **Sequelize migrations** (not `sync({ alter })`), migrations can be rolled back:

```bash
# Rollback last migration
cd apps/backend && pnpm db:rollback 1

# Rollback multiple migrations
cd apps/backend && pnpm db:rollback 3

# Check status
cd apps/backend && pnpm db:migrate:status

# Re-apply migrations
cd apps/backend && pnpm db:migrate
```

**Important**: Migration rollback is safe because:

- Each migration has explicit `down()` function
- No data loss for additive migrations
- Destructive migrations require manual review

---

## Communication Templates

### Slack Notification (Auto-rollback)

```
🚨 AUTO-ROLLBACK TRIGGERED
Service: HalTest Production
Time: 2026-09-12 14:30 UTC
Trigger: Health check failure (api/status: 500)
Action: Rolled back to deploy abc1234
Backup: database.sqlite.2026-09-12T18-46-28.bak
Status: ✅ Rollback complete, health checks passing
```

### GitHub Issue (Post-Rollback)

```
Title: Rollback v1.0.72 → v1.0.71 - [Root Cause]

## What Happened
Brief description of the issue

## Root Cause
Technical explanation

## Impact
- Users affected: X
- Duration: Y minutes
- Channels: Online / npm / Both

## Resolution
- Rolled back to v1.0.71
- Database restored from backup X

## Prevention
- [ ] Add test case for scenario
- [ ] Improve health check
- [ ] Add migration validation
```

---

## Dry Run Testing

Test rollback procedures without making changes:

```bash
# Test app rollback
DRY_RUN=true node scripts/rollback.js app-rollback

# Test full rollback
DRY_RUN=true node scripts/rollback.js rollback database.sqlite.2026-09-12T18-46-28.bak

# Test health check
DRY_RUN=true node scripts/rollback.js check
```

---

## Troubleshooting

| Issue                           | Solution                                                    |
| ------------------------------- | ----------------------------------------------------------- |
| Rollback hangs                  | Check Render deploy status manually, force cancel if needed |
| Database restore fails          | Verify backup integrity, try PITR for PostgreSQL            |
| npm deprecate fails             | Verify NPM_TOKEN has publish permissions                    |
| Health check false positive     | Check Render service logs, verify endpoints manually        |
| Version mismatch after rollback | Clear browser cache, check Render deploy history            |

---

## Version Compatibility

| App Version | Min DB Migration | Compatible DB                |
| ----------- | ---------------- | ---------------------------- |
| 1.0.70      | 20260912000000   | ✅                           |
| 1.0.71      | 20260912000000   | ✅                           |
| 1.0.72      | 20260912000000   | ❌ (migration 0002 required) |

**Rule**: Never rollback app to version incompatible with current database migration.

---

## Runbook Maintenance

- Review quarterly
- Update after each rollback
- Test procedures in staging monthly
- Keep backup retention at 30 days minimum
