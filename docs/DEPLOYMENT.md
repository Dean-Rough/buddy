# Deployment & Environment Setup - Onda Platform (Web-First PWA)

## 🌐 Progressive Web App (PWA) Configuration

### PWA Setup Requirements

Create the following files in your project root:

#### 1. `public/manifest.json`

```json
{
  "name": "Onda - Safe AI Chat for Kids",
  "short_name": "Onda",
  "description": "A safe AI companion for children aged 6-12",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### 2. Service Worker Setup

Create `public/sw.js` for offline capability:

```javascript
// Basic service worker for offline support
const CACHE_NAME = 'onda-v1';
const urlsToCache = ['/', '/offline', '/manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches
      .match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

#### 3. Mobile Web Optimization Checklist

- [ ] Add viewport meta tag in `app/layout.tsx`
- [ ] Implement touch-friendly tap targets (min 44x44px)
- [ ] Add iOS-specific meta tags for PWA support
- [ ] Test on real devices (iOS Safari, Android Chrome)
- [ ] Implement app install prompt component
- [ ] Add offline page for graceful degradation
- [ ] Optimize images for mobile bandwidth
- [ ] Enable text selection prevention in chat UI
- [ ] Add pull-to-refresh functionality
- [ ] Implement smooth scrolling for chat

### Install-to-Home-Screen Implementation

Add to parent onboarding flow:

```typescript
// components/pwa/InstallPrompt.tsx
const [installPrompt, setInstallPrompt] = useState(null);

useEffect(() => {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    setInstallPrompt(e);
  });
}, []);

const handleInstall = async () => {
  installPrompt.prompt();
  const { outcome } = await installPrompt.userChoice;
  if (outcome === 'accepted') {
    // Track successful installation
  }
};
```

## Environment Configuration

### Required Environment Variables

Create `.env.local` file in project root:

```bash
# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Database (NeonDB)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
SHADOW_DATABASE_URL=postgresql://username:password@host:port/shadow_db?sslmode=require

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER_PREFERENCE=openai # or anthropic

# Voice Services (Cartesia)
CARTESIA_API_KEY=cartesia_...
CARTESIA_VOICE_ID_RACCOON=voice_...
CARTESIA_VOICE_ID_JELLYFISH=voice_...
CARTESIA_VOICE_ID_ROBOT=voice_...

# Safety & Monitoring
SAFETY_WEBHOOK_URL=https://your-domain.com/api/webhooks/safety
MODERATION_QUEUE_WEBHOOK=https://your-domain.com/api/webhooks/moderation
SAFETY_ESCALATION_EMAIL=safety@your-domain.com

# Notifications
RESEND_API_KEY=re_...
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_...

# Parent Notifications
PARENT_ALERT_FROM_EMAIL=alerts@Onda-app.com
WEEKLY_SUMMARY_FROM_EMAIL=summaries@Onda-app.com
EMERGENCY_CONTACT_PHONE=+1234567890

# Security & Rate Limiting
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000
RATE_LIMIT_REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=32-byte-encryption-key-here

# Analytics & Monitoring
VERCEL_ANALYTICS_ID=...
SENTRY_DSN=https://...
LOG_LEVEL=info # debug|info|warn|error

# Feature Flags
ENABLE_VOICE_INPUT=true
ENABLE_PARENT_DASHBOARD=true
ENABLE_WHISPER_MODE=true
ENABLE_HUMAN_MODERATION=true

# COPPA/GDPR Compliance
PRIVACY_POLICY_VERSION=1.0
TERMS_OF_SERVICE_VERSION=1.0
DEFAULT_DATA_RETENTION_DAYS=90
```

### Production Environment Variables

```bash
# Production overrides
NODE_ENV=production
VERCEL_ENV=production
LOG_LEVEL=warn

# Production database
DATABASE_URL=${NEON_DATABASE_URL}

# Security hardening
NEXTAUTH_URL=https://your-production-domain.com
CSRF_SECRET=production-csrf-secret
SESSION_SECRET=production-session-secret

# Monitoring
SENTRY_DSN=${PRODUCTION_SENTRY_DSN}
DATADOG_API_KEY=${PRODUCTION_DATADOG_KEY}

# Safety redundancy
BACKUP_MODERATION_EMAIL=safety-backup@your-domain.com
EMERGENCY_ESCALATION_PHONE=+1234567891
```

## Local Development Setup

### Prerequisites Installation

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm (recommended)
npm install -g pnpm

# Install PostgreSQL locally (optional)
sudo apt-get install postgresql postgresql-contrib
```

### Project Setup

```bash
# Clone repository
git clone https://github.com/your-org/Onda-platform.git
cd Onda-platform

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Generate database schema
pnpm db:generate

# Run initial migration
pnpm db:push

# Seed development data
pnpm db:seed

# Start development server
pnpm dev
```

### Database Setup (NeonDB)

```bash
# Create NeonDB project
# Visit https://console.neon.tech/

# Set up connection string
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Run migrations
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate

# Seed initial data
pnpm prisma db seed
```

### Safety System Testing

```bash
# Run safety system validation
pnpm test:safety

# Test escalation workflows
pnpm test:escalation

# Validate COPPA compliance
pnpm test:compliance

# Test human moderation queue
pnpm test:moderation
```

## Staging Environment

### Vercel Staging Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Link project to Vercel
vercel link

# Set environment variables
vercel env add DATABASE_URL
vercel env add CLERK_SECRET_KEY
vercel env add OPENAI_API_KEY
# ... continue for all environment variables

# Deploy to staging
vercel --env=preview
```

### Staging-Specific Configuration

```bash
# Staging environment variables
VERCEL_ENV=preview
NEXT_PUBLIC_APP_ENV=staging
LOG_LEVEL=debug

# Use staging external services
CLERK_PUBLISHABLE_KEY=pk_test_staging...
DATABASE_URL=postgresql://staging-db...
CARTESIA_API_KEY=staging_voice_key...

# Staging safety settings
SAFETY_TEST_MODE=true
MODERATION_QUEUE_PRIORITY=low
PARENT_NOTIFICATIONS_ENABLED=false
```

## Web-First Deployment Strategy

### Why Web-First Wins

1. **Immediate Launch**: Deploy today, not after 2-4 week app review
2. **Instant Updates**: Push safety fixes immediately when threats emerge
3. **100% Revenue**: No 30% App Store commission on subscriptions
4. **Global Reach**: SEO benefits and direct web traffic
5. **Universal Access**: Works on every device with a browser

### Web Deployment Process

```bash
# 1. Build for production
pnpm build

# 2. Test production build locally
pnpm start

# 3. Deploy to Vercel
vercel --prod

# 4. Set up custom domain
# In Vercel dashboard, add your domain
```

### PWA Deployment Checklist

- [ ] Generate all icon sizes (72x72 to 512x512)
- [ ] Create apple-touch-icon for iOS
- [ ] Add manifest.json to public folder
- [ ] Implement service worker for offline
- [ ] Test install experience on iOS/Android
- [ ] Add meta tags for mobile web app
- [ ] Optimize Critical Rendering Path
- [ ] Enable HTTPS (required for PWA)
- [ ] Test offline functionality
- [ ] Implement update notifications

### Marketing the Web Advantage

**Parent-Facing Benefits**:

- "No app downloads or updates required"
- "Instantly updated when new safety threats emerge"
- "Works on all your family's devices"
- "Takes up zero storage space"
- "Try it instantly without commitment"

## Production Deployment

### Vercel Production Configuration

```bash
# Production build command
BUILD_COMMAND="pnpm build"

# Output directory
OUTPUT_DIRECTORY=".next"

# Install command
INSTALL_COMMAND="pnpm install --frozen-lockfile"

# Root directory
ROOT_DIRECTORY="."

# Node.js version
NODE_VERSION="18.x"
```

### Production Environment Setup

```typescript
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    },
    "app/api/safety/**/*.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://your-domain.com"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/admin",
      "destination": "/admin/login",
      "permanent": false
    }
  ]
}
```

### Production Safety Configuration

```bash
# Production safety requirements
SAFETY_LAYER_REDUNDANCY=true
HUMAN_MODERATION_REQUIRED=true
ESCALATION_TIMEOUT_SECONDS=60
MAX_CHILD_SESSION_MINUTES=30

# Production monitoring
SAFETY_ALERT_WEBHOOK=https://monitoring.your-domain.com/webhooks/safety
UPTIME_MONITORING_URL=https://uptime.your-domain.com
ERROR_REPORTING_ENABLED=true

# COPPA/GDPR production settings
PRIVACY_AUDIT_ENABLED=true
DATA_EXPORT_ENABLED=true
PARENTAL_CONSENT_REQUIRED=true
```

## Database Migration Strategy

### Migration Commands

```bash
# Create new migration
pnpm prisma migrate dev --name add_safety_events

# Deploy migrations to production
pnpm prisma migrate deploy

# Reset database (development only)
pnpm prisma migrate reset

# Check migration status
pnpm prisma migrate status
```

### Production Migration Process

```bash
# Pre-deployment checks
1. Backup production database
2. Test migration on staging
3. Verify data integrity
4. Check rollback procedure

# Deployment process
pnpm prisma migrate deploy
pnpm prisma generate
pnpm build
vercel --prod

# Post-deployment verification
1. Run health checks
2. Verify safety system functionality
3. Test parent notification system
4. Validate data retention compliance
```

## Monitoring & Health Checks

### Health Check Endpoints

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = await Promise.all([
    checkDatabase(),
    checkAIProviders(),
    checkSafetySystem(),
    checkNotificationService(),
    checkVoiceService(),
  ]);

  return Response.json({
    status: checks.every(check => check.healthy) ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  });
}
```

### Monitoring Configuration

```yaml
# monitoring.yml
services:
  - name: 'Database Connection'
    endpoint: '/api/health/database'
    interval: 30s
    timeout: 10s

  - name: 'AI Safety System'
    endpoint: '/api/health/safety'
    interval: 60s
    timeout: 15s
    critical: true

  - name: 'Parent Notifications'
    endpoint: '/api/health/notifications'
    interval: 300s
    timeout: 30s

alerts:
  - name: 'Safety System Down'
    condition: 'safety_system_healthy == false'
    severity: 'critical'
    notification: 'immediate'

  - name: 'High Error Rate'
    condition: 'error_rate > 5%'
    severity: 'warning'
    notification: 'email'
```

### Performance Monitoring

```bash
# Key metrics to monitor
- API response times (target: <2s for chat, <10s for safety)
- Database query performance
- Safety system accuracy rate
- Parent notification delivery rate
- Child session completion rate
- Error rates by endpoint

# Alerting thresholds
- Safety system failure: Immediate alert
- Response time >5s: Warning alert
- Error rate >1%: Investigation alert
- Database connection issues: Critical alert
```

## Backup & Recovery

### Database Backup Strategy

```bash
# Automated daily backups
0 2 * * * pg_dump $DATABASE_URL > /backups/Onda-$(date +%Y%m%d).sql

# Weekly full backup with retention
0 3 * * 0 pg_dump --clean --create $DATABASE_URL | gzip > /backups/weekly/Onda-$(date +%Y%m%d).sql.gz

# Backup verification
# Test restore to staging environment weekly
```

### Disaster Recovery Plan

```markdown
## Recovery Time Objectives (RTO)

- Critical safety systems: 5 minutes
- Chat functionality: 15 minutes
- Parent dashboard: 30 minutes
- Full system: 60 minutes

## Recovery Point Objectives (RPO)

- Safety events: 0 minutes (no data loss acceptable)
- Conversations: 5 minutes
- User preferences: 15 minutes

## Recovery Procedures

1. Assess scope of outage
2. Activate incident response team
3. Implement temporary safety measures
4. Restore from most recent backup
5. Verify safety system functionality
6. Resume normal operations
7. Post-incident review
```

## Security Hardening

### Production Security Checklist

```markdown
- [ ] HTTPS enforced with HSTS headers
- [ ] API rate limiting configured
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (Prisma ORM)
- [ ] XSS protection headers
- [ ] CSRF protection enabled
- [ ] Secrets rotation schedule
- [ ] Security headers (CSP, X-Frame-Options)
- [ ] Database encryption at rest
- [ ] Audit logging enabled
- [ ] Vulnerability scanning automated
- [ ] Dependency security monitoring
- [ ] COPPA/GDPR compliance validation
```

### Environment-Specific Security

```bash
# Development
ENABLE_DEBUG_LOGS=true
DISABLE_RATE_LIMITING=true
MOCK_EXTERNAL_SERVICES=true

# Staging
ENABLE_DEBUG_LOGS=true
DISABLE_RATE_LIMITING=false
MOCK_EXTERNAL_SERVICES=false
SAFETY_TESTING_MODE=true

# Production
ENABLE_DEBUG_LOGS=false
DISABLE_RATE_LIMITING=false
MOCK_EXTERNAL_SERVICES=false
SAFETY_TESTING_MODE=false
STRICT_SECURITY_HEADERS=true
```
