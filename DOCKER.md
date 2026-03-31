# 🐳 Docker Deployment Guide

## Overview

Running HAL-TEST in Docker is the **recommended way** for production deployments. It ensures all Playwright dependencies and system libraries are correctly installed, preventing issues like "Page Crashed" errors common in Linux environments.

## Prerequisites

Before starting, ensure you have:
- **Docker Engine** ([Install Guide](https://docs.docker.com/engine/install/))
- **Docker Compose** (usually included with Docker Desktop)

### Linux Users: Post-Installation Steps

After installing Docker on Linux, add your user to the docker group to avoid using `sudo`:

```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Apply changes (logout and login, or run):
newgrp docker

# Verify installation
docker --version
docker compose version
```

## Quick Start

### 1. Configure Environment Variables

Ensure your `.env` file in the project root contains the required variables:

```bash
# Backend Configuration
PORT=2001
NODE_ENV=production

# Supabase Configuration (Required for authentication)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Database (PostgreSQL via Supabase Transaction Pooler - IPv4 compatible)
DATABASE_URL=postgresql://postgres.yourproject:password@aws-0-us-west-2.pooler.supabase.com:6543/postgres

# Security
HALTEST_MASTER_ENCRYPTION_KEY=your_64_character_hex_key
```

> **Important**: Use the **Transaction Pooler** connection string from Supabase (port `6543`) instead of direct connection (port `5432`). The pooler is IPv4 compatible and works better with Docker networking.

### 2. Build and Start the Container

```bash
# Build the image and start in detached mode
docker compose up -d --build
```

This will:
- Build the multi-stage Docker image (~2-3 minutes first time)
- Install all Playwright browser dependencies
- Compile frontend and backend assets
- Start the container in the background

### 3. Verify Container Status

```bash
# Check if container is running
docker ps

# View logs
docker logs hal-test-app --tail 50

# Follow logs in real-time
docker logs -f hal-test-app
```

You should see:
```
✅ Inspector routes registered
✅ 67 action routes registered successfully
🚀 Socket.io server ready and listening on port 2001
Connection has been established successfully.
Database synchronized
```

## Access the Application

Once the container is healthy:
- **App Interface**: http://localhost:2001/app/
- **Landing Page**: http://localhost:2001/
- **API Documentation**: http://localhost:2001/api/docs

## Container Management

```bash
# Stop the container
docker compose down

# Restart without rebuilding
docker compose restart

# Rebuild after code changes
docker compose up -d --build

# View real-time logs
docker logs -f hal-test-app

# Access container shell
docker exec -it hal-test-app sh
```

## Data Persistence

HAL-TEST uses Docker volumes to persist data:
- **Volume Name**: `hal_test_data`
- **Location inside container**: `/app/apps/backend/storage`
- **Contains**: SQLite database, screenshots, session data

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect hal_test_data

# Backup volume data
docker run --rm -v hal_test_data:/data -v $(pwd):/backup alpine tar czf /backup/haltest-backup.tar.gz -C /data .

# Restore volume data
docker run --rm -v hal_test_data:/data -v $(pwd):/backup alpine tar xzf /backup/haltest-backup.tar.gz -C /data
```

## Database Configuration

HAL-TEST supports two database configurations in Docker:

### Option 1: PostgreSQL (Supabase) - Recommended for Production

```bash
# In your .env file
DATABASE_URL=postgresql://postgres.yourproject:password@aws-0-us-west-2.pooler.supabase.com:6543/postgres
```

**Benefits:**
- Scalable and production-ready
- Built-in authentication with Supabase
- Automatic backups
- Multi-region support

**Setup Steps:**

1. Create a Supabase project at https://supabase.com
2. Go to **Project Settings → Database**
3. Click **"Connect"** button in the top navigation bar
4. In the connection dialog:
   - Type: **URI**
   - Source: **Primary Database**
   - Method: **Transaction pooler** (important!)
5. Click "View parameters" to see your password
6. Copy the complete connection string
7. Replace `[YOUR-PASSWORD]` with your actual database password
8. Update your `.env` file with the connection string

> **Why Transaction Pooler?**
> - Direct connection (port 5432) uses IPv6 only
> - Transaction pooler (port 6543) supports IPv4
> - Docker containers may not have IPv6 enabled by default
> - Using the pooler prevents connection errors

### Option 2: SQLite - Good for Development/Testing

```bash
# In docker-compose.yml, comment out DATABASE_URL:
# - DATABASE_URL=${DATABASE_URL}
```

The app will automatically fallback to SQLite stored in the Docker volume.

**Benefits:**
- No external dependencies
- Zero configuration
- Portable (everything in one volume)

**Limitations:**
- Not recommended for production
- No authentication features
- Single-user only

## Troubleshooting

### Container Keeps Restarting

```bash
# Check logs for errors
docker logs hal-test-app --tail 100
```

#### Issue: "Password authentication failed" (Code 28P01)

**Symptoms:**
```
severity: 'FATAL',
code: '28P01',
```

**Solution:**
1. Go to Supabase Dashboard → Project Settings → Database
2. Scroll to "Database Settings"
3. Click "Reset database password"
4. Copy the new password
5. Update your `.env` file `DATABASE_URL` with the new password
6. Restart the container:
   ```bash
   docker compose restart
   ```

#### Issue: "ENOTFOUND" or "ENETUNREACH"

**Symptoms:**
```
Error: getaddrinfo ENOTFOUND db.projectref.supabase.co
connect ENETUNREACH 2600:xxxx:xxxx
```

**Cause:** You're using Direct Connection which is IPv6 only.

**Solution:** Switch to Transaction Pooler:

1. Go to Supabase Dashboard
2. Click **"Connect"** in the top navigation
3. Change **Method** dropdown to **"Transaction pooler"**
4. Notice the hostname changes from `db.xxx.supabase.co:5432` to `aws-0-us-xxxx.pooler.supabase.com:6543`
5. Copy the new connection string
6. Update your `.env` file
7. Rebuild the container:
   ```bash
   docker compose down
   docker compose up -d
   ```

### Cannot Connect to Localhost

If using **network_mode: host** (default on Linux):
```bash
# The container uses your host network directly
# Access via: http://localhost:2001
```

If you need bridge networking instead:

```yaml
# In docker-compose.yml, change:
network_mode: host

# To:
ports:
  - "2001:2001"
```

Then restart:
```bash
docker compose down
docker compose up -d
```

### Playwright Browser Crashes

The Dockerfile uses the official Playwright image which includes all necessary dependencies. If you still see crashes:

```bash
# Rebuild with latest Playwright image
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Port Already in Use

```bash
# Check what's using port 2001
sudo lsof -i :2001

# If it's another Docker container
docker ps -a | grep 2001

# Stop conflicting container
docker stop <container_id>

# Or change the port in docker-compose.yml
ports:
  - "3001:2001"  # Use port 3001 on host
```

## Advanced Configuration

### Custom DNS Servers

The container is configured with Google and Cloudflare DNS for reliable name resolution:

```yaml
dns:
  - 8.8.8.8   # Google DNS
  - 1.1.1.1   # Cloudflare DNS
```

This helps resolve issues with corporate networks or custom DNS setups.

### Environment Variables Override

All `.env` variables are automatically passed to the container. To override specific values:

```yaml
# In docker-compose.yml
environment:
  - PORT=3000              # Change default port
  - NODE_ENV=production
  - DATABASE_URL=postgresql://...  # Override .env value
```

### Multi-Architecture Support

The Docker image supports:
- **linux/amd64** (Intel/AMD x86_64)
- **linux/arm64** (Apple Silicon, ARM servers)

Docker automatically pulls the correct architecture.

## Production Best Practices

### 1. Use External Database

Always use Supabase (PostgreSQL) in production:
```bash
DATABASE_URL=postgresql://postgres.yourproject:password@aws-0-us-west-2.pooler.supabase.com:6543/postgres
```

### 2. Set Strong Encryption Key

Generate a secure 64-character hex key:
```bash
# Generate random key
openssl rand -hex 32

# Add to .env
HALTEST_MASTER_ENCRYPTION_KEY=<generated_key>
```

### 3. Enable Container Health Checks

Add to `docker-compose.yml`:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:2001/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 4. Configure Restart Policy

Already included in `docker-compose.yml`:
```yaml
restart: unless-stopped
```

This ensures the container restarts automatically after crashes or reboots.

### 5. Resource Limits

Add to `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
    reservations:
      cpus: '1'
      memory: 2G
```

## Security Considerations

### 1. Protect Environment Variables

Never commit `.env` to version control:
```bash
# .gitignore
.env
.env.local
.env.production
```

### 2. Use Docker Secrets (Production)

For sensitive data in production:
```yaml
secrets:
  database_url:
    file: ./secrets/database_url.txt

services:
  hal-test:
    secrets:
      - database_url
```

### 3. Network Isolation

For better security, use bridge networking instead of host mode:
```yaml
network_mode: bridge
ports:
  - "2001:2001"
```

## Monitoring and Logs

### View Logs

```bash
# Last 100 lines
docker logs hal-test-app --tail 100

# Follow in real-time
docker logs -f hal-test-app

# With timestamps
docker logs -t hal-test-app

# Specific time range
docker logs --since 10m hal-test-app
```

### Export Logs

```bash
# Save to file
docker logs hal-test-app > haltest.log 2>&1

# With rotation
docker logs --since 24h hal-test-app > haltest-$(date +%Y%m%d).log
```

### Container Stats

```bash
# Real-time resource usage
docker stats hal-test-app

# All containers
docker stats
```

## Backup and Migration

### Full Backup

```bash
# Stop container
docker compose down

# Backup volume
docker run --rm -v hal_test_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/haltest-backup-$(date +%Y%m%d).tar.gz -C /data .

# Restart
docker compose up -d
```

### Restore from Backup

```bash
# Stop container
docker compose down

# Remove old volume (optional)
docker volume rm hal_test_data

# Create new volume
docker volume create hal_test_data

# Restore data
docker run --rm -v hal_test_data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/haltest-backup-20260210.tar.gz -C /data

# Restart
docker compose up -d
```

### Migration to New Server

```bash
# On old server
docker compose down
docker run --rm -v hal_test_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/migration.tar.gz -C /data .

# Transfer file to new server
scp migration.tar.gz user@newserver:/path/to/haltest/

# On new server
cd /path/to/haltest
docker volume create hal_test_data
docker run --rm -v hal_test_data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/migration.tar.gz -C /data
docker compose up -d
```

## Support

If you encounter issues not covered here:
1. Check logs: `docker logs hal-test-app`
2. Search [GitHub Issues](https://github.com/andresguc1/hal-test/issues)
3. Join [Slack Community](https://join.slack.com/t/haltest-talk/shared_invite/zt-3tzii9nxh-vgdIcI5A8bg~GCG8QF6MuA)
4. Open a new issue with:
   - Docker version: `docker --version`
   - OS/Distribution
   - Complete logs
   - Steps to reproduce
