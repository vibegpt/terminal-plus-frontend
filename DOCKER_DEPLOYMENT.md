# Docker Deployment Guide

## Production Docker Setup

This project includes a production-ready Docker configuration with multi-stage builds and optimized nginx serving.

### Files Created

- `Dockerfile.production` - Multi-stage Docker build
- `nginx.conf` - Optimized nginx configuration
- `nginx-default.conf` - SPA routing and caching rules
- `.dockerignore` - Optimized build context
- `docker-compose.yml` - Easy deployment setup

### Environment Variables

Create a `.env.local` file with:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Sentry Configuration
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# App Environment
VITE_APP_ENV=production
```

### Building and Running

#### Option 1: Docker Compose (Recommended)
```bash
# Build and run
docker-compose up --build

# Run in background
docker-compose up -d --build
```

#### Option 2: Direct Docker
```bash
# Build the image
docker build -f Dockerfile.production \
  --build-arg VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
  --build-arg VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
  --build-arg VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
  --build-arg VITE_APP_ENV=production \
  -t terminal-plus:latest .

# Run the container
docker run -p 80:80 terminal-plus:latest
```

### Features

#### Multi-Stage Build
- **Stage 1**: Node.js build environment
- **Stage 2**: Lightweight nginx Alpine image

#### Optimized Nginx Configuration
- ✅ SPA routing with fallback to index.html
- ✅ Gzip compression for all text assets
- ✅ Aggressive caching for static assets (1 year)
- ✅ No caching for HTML and service worker
- ✅ Security headers
- ✅ Health check endpoint

#### PWA Optimizations
- ✅ Service worker served with no-cache headers
- ✅ Manifest caching optimized
- ✅ Static asset caching for performance

#### Security
- ✅ X-Frame-Options: SAMEORIGIN
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection enabled
- ✅ Referrer-Policy configured

### Health Checks

The container includes health checks:
- **Endpoint**: `http://localhost/health`
- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Retries**: 3

### Performance Features

- **Gzip Compression**: Enabled for all text assets
- **Static Asset Caching**: 1 year cache for JS, CSS, images
- **SPA Routing**: All routes fallback to index.html
- **Optimized MIME Types**: Proper content-type headers

### Production Deployment

1. Set up your environment variables
2. Build the Docker image
3. Deploy to your container platform (AWS ECS, Google Cloud Run, etc.)
4. Configure your load balancer to point to the container

The app will be available at `http://localhost:80` (or your configured port).
