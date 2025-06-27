# Production Operations & Maintenance - Onda Platform

## 🚀 Live Production Status

**Platform URL**: [www.onda.click](https://www.onda.click)  
**Status**: Live and operational (January 2025)  
**Version**: Buddy 2.0 with calendar integration and organic nudging  
**Uptime**: 99.9% target with monitoring alerts

### Current Live Features

- ✅ **Dual-layer AI safety system** with calibrated safety levels (0-4)
- ✅ **Parent dashboard** with PIN protection and 4-tab interface
- ✅ **Email summaries** powered by GPT-4o-mini analysis
- ✅ **Voice integration** via Cartesia TTS with persona-specific voices
- ✅ **Google Calendar integration** with COPPA-compliant privacy filtering
- ✅ **Organic nudging system** for natural conversation bridging
- ✅ **Real-time chat** with typing animations and auto-scroll
- ✅ **Whisper mode** for emotional support scenarios

---

# Live Production Operations Guide

## 🌐 Live Environment Monitoring

### Production Health Checks

The platform is actively monitored with the following endpoints:

#### Critical Health Endpoints

```bash
# Core system health
GET /api/health                    # Overall system status
GET /api/health/database           # Database connectivity
GET /api/health/safety             # Safety system validation
GET /api/health/ai                 # AI service availability
GET /api/health/voice              # Cartesia TTS status
GET /api/health/email              # Email delivery system

# Expected response format
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2025-01-27T10:00:00Z",
  "checks": {
    "database": { "healthy": true, "responseTime": "45ms" },
    "safety": { "healthy": true, "accuracy": "99.8%" },
    "ai_primary": { "healthy": true, "provider": "openai" },
    "voice": { "healthy": true, "latency": "1.2s" }
  }
}
```

#### Performance Monitoring Metrics

```yaml
# Current production targets (verified live)
Response Times:
  - Chat API: <200ms average
  - Safety validation: <100ms
  - Voice synthesis: <2s
  - Email generation: <30s
  - Database queries: <50ms

Availability:
  - Overall uptime: 99.9%
  - Safety system: 100% (zero bypasses)
  - Database: 99.95%
  - AI services: 99.8% (dual provider fallback)

Safety Metrics:
  - Accuracy rate: >99.5%
  - False positive rate: <0.5%
  - Response time: <100ms
  - Escalation success: 100%
```

#### Live Production Alerts

**Critical Alerts (Immediate Response)**:
- Safety system failure or bypass detected
- Database connection loss
- AI service complete outage
- Security incident or data breach

**Warning Alerts (15-minute Response)**:
- Response times >5 seconds sustained
- Error rate >1% for 5 minutes
- Calendar sync failures
- Email delivery failures >10%

**Info Alerts (Monitoring)**:
- AI service degraded performance
- High traffic spikes
- Voice synthesis delays
- Parent notification delays

### Emergency Response Procedures

**Safety System Emergency**:
1. Immediate platform lockdown if safety bypass detected
2. Activate manual content moderation queue
3. Parent notification for all active sessions
4. Incident documentation and root cause analysis

**Service Outage Response**:
1. Activate status page at status.onda.click
2. Route traffic to maintenance page
3. Parent email notifications for extended outages
4. Escalate to development team within 5 minutes

## Live Production Environment

### Current Production Environment Variables

Live production configuration (secrets managed via Vercel):

```bash
# Core Services (Production - All Active)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_*****
CLERK_SECRET_KEY=sk_live_*****
CLERK_WEBHOOK_SECRET=whsec_*****

# Database (NeonDB Production)
DATABASE_URL=postgresql://****@****-pooler.us-east-1.aws.neon.tech/onda?sslmode=require

# AI Services (Dual Provider Active)
OPENAI_API_KEY=sk-*****
ANTHROPIC_API_KEY=sk-ant-*****
AI_PROVIDER_PREFERENCE=openai

# Voice Services (Cartesia - Live)
CARTESIA_API_KEY=cartesia_*****
CARTESIA_VOICE_ID_RACCOON=voice_*****
CARTESIA_VOICE_ID_JELLYFISH=voice_*****
CARTESIA_VOICE_ID_ROBOT=voice_*****

# Buddy 2.0 Features (Calendar Integration)
GOOGLE_CLIENT_ID=*****
GOOGLE_CLIENT_SECRET=*****
GOOGLE_REDIRECT_URI=https://www.onda.click/api/auth/calendar/callback
ENCRYPTION_KEY=*****
ENCRYPTION_SECRET=*****

# Email Services (Resend - Active)
RESEND_API_KEY=re_*****
PARENT_ALERT_FROM_EMAIL=alerts@onda.click
WEEKLY_SUMMARY_FROM_EMAIL=summaries@onda.click

# Production Security
NEXTAUTH_URL=https://www.onda.click
RATE_LIMIT_ENABLED=true
SECURITY_HEADERS_ENABLED=true

# Monitoring (Active)
VERCEL_ANALYTICS_ID=*****
SENTRY_DSN=https://*****
LOG_LEVEL=warn

# Production Feature Flags
ENABLE_VOICE_INPUT=true
ENABLE_PARENT_DASHBOARD=true
ENABLE_WHISPER_MODE=true
ENABLE_ORGANIC_NUDGING=true
ENABLE_CALENDAR_INTEGRATION=true

# COPPA/GDPR Compliance (Active)
PRIVACY_POLICY_VERSION=2.0
TERMS_OF_SERVICE_VERSION=2.0
DEFAULT_DATA_RETENTION_DAYS=90
PARENT_CONSENT_REQUIRED=true
```

### Live Production Configuration Validation

```bash
# Verify all services are operational
npm run production:health-check

# Output should show:
✅ Database: Connected (NeonDB)
✅ Authentication: Clerk live keys active
✅ AI Services: OpenAI + Anthropic operational
✅ Voice: Cartesia TTS responsive
✅ Email: Resend delivery active
✅ Calendar: Google OAuth configured
✅ Safety: Dual-layer validation operational
✅ Monitoring: All health checks passing
```

## Development Environment Setup (Contributors)

### Setting Up Local Development Against Live Production

```bash
# Clone the live production repository
git clone https://github.com/onda-ai/onda-platform.git
cd onda-platform

# Install dependencies
npm install

# Set up development environment variables
cp .env.example .env.local
# Configure with development/staging keys (not production)
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
