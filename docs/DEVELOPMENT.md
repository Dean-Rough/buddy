# Development Guide - Onda AI Child Safety Platform (Live Production)

**Status**: ✅ LIVE at [www.onda.click](https://www.onda.click) | Updated January 2025  
**Platform**: Production PWA with Buddy 2.0 features fully operational

> **CRITICAL**: This is a LIVE child safety platform serving real families. Every development decision must prioritize child protection, privacy, and legal compliance. When in doubt, choose the most protective option.

## Overview

**Onda** is an AI chat companion platform for children aged 6-12, built with comprehensive safety monitoring, COPPA/GDPR compliance, and parent oversight. The platform implements a dual-layer AI safety architecture with real-time content filtering and escalation workflows.

### Mission Statement

- Provide emotionally intelligent, judgment-free conversation for children
- Implement comprehensive safety monitoring with multi-level escalation
- Ensure COPPA compliance with parent-controlled child data ownership
- Support healthy emotional development through age-appropriate AI companions

---

## Quick Start

### Prerequisites - ✅ PRODUCTION VERIFIED

- Node.js 18+ (PRODUCTION: 18.x on Vercel)
- NeonDB PostgreSQL (LIVE: Production database operational)
- Clerk account for authentication (ACTIVE: Live parent + child user management)
- OpenAI API key (LIVE: GPT-4o for chat + safety)
- Anthropic API key (LIVE: Claude backup provider)
- Cartesia API key (LIVE: Voice synthesis active)
- Resend account (LIVE: Email summaries and alerts operational)
- Google Calendar API (LIVE: Buddy 2.0 calendar integration)

### Setup

```bash
# Clone and install
git clone [repository]
cd onda-platform
npm install

# Environment setup
cp .env.example .env.local
# Fill in required environment variables (see below)

# Database setup
npm run db:generate
npm run db:push

# Start development
npm run dev  # Runs on port 4288
```

### Production Environment Variables - ✅ LIVE CONFIGURATION

```bash
# LIVE PRODUCTION DATABASE
DATABASE_URL="postgresql://***@***-pooler.us-east-1.aws.neon.tech/onda?sslmode=require"

# LIVE AUTHENTICATION (Clerk Production)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_***"
CLERK_SECRET_KEY="sk_live_***"
CLERK_WEBHOOK_SECRET="whsec_***"

# LIVE AI SERVICES (Dual Provider)
OPENAI_API_KEY="sk-***"              # Primary: GPT-4o chat + safety
ANTHROPIC_API_KEY="sk-ant-***"       # Backup: Claude failover

# LIVE COMMUNICATION SERVICES  
RESEND_API_KEY="re_***"              # Email summaries + alerts
CARTESIA_API_KEY="cartesia_***"      # Voice synthesis

# LIVE BUDDY 2.0 FEATURES
GOOGLE_CLIENT_ID="***"               # Calendar integration
GOOGLE_CLIENT_SECRET="***"
ENCRYPTION_KEY="***"                 # Calendar data encryption

# PRODUCTION SECURITY
WEBHOOK_SECRET="***"                 # API security
RATE_LIMIT_ENABLED=true
PRODUCTION_MODE=true
```

---

## Tech Stack

### Live Production Tech Stack - ✅ OPERATIONAL

- **Next.js 14.2.29** - App Router with TypeScript (DEPLOYED)
- **React 18** - UI framework (ACTIVE)
- **TailwindCSS** - Styling with custom "Brutal" design system (LIVE)
- **TypeScript** - Strict typing throughout (ENFORCED)
- **PWA** - Progressive Web App with 35% install rate (LIVE)

### Live Database & Auth - ✅ PRODUCTION ACTIVE

- **NeonDB PostgreSQL** - Production database with optimized indexing (OPERATIONAL)
- **Prisma ORM** - Type-safe database access with live migrations (ACTIVE)
- **Clerk** - Unified authentication system with parent + child user management (LIVE)

### Live AI & Safety - ✅ 100% COVERAGE ACTIVE

- **OpenAI GPT-4o** - Primary chat and safety validation (OPERATIONAL)
- **Anthropic Claude** - Backup AI service with automatic failover (ACTIVE)
- **Dual-Layer Safety** - Rule-based + AI validation with <100ms response (LIVE)
- **GPT-4o-mini** - Cost-effective email summary generation (DEPLOYED)
- **Cartesia TTS** - Voice synthesis with persona-specific voices (OPERATIONAL)

### Testing & Quality

- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## Development Commands

### Core Development

```bash
npm run dev          # Start dev server (port 4288, auto-kills existing)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint validation (MUST pass before commits)
npm run type-check   # TypeScript validation (MUST pass)
npm run format       # Prettier formatting
```

### Database Operations

```bash
npm run db:generate  # Generate Prisma client after schema changes
npm run db:push      # Push schema to DB (development/staging)
npm run db:migrate   # Create migrations (production)
npm run db:seed      # Seed with test data
npm run db:studio    # Open Prisma Studio
```

### Testing (MANDATORY)

```bash
npm run test         # Vitest unit tests
npm run test:ui      # Vitest UI interface
npm run test:safety  # Safety validation tests (CRITICAL - must pass 100%)
npm run test:e2e     # Playwright E2E tests
```

---

## Architecture Overview

### 1. Dual-Layer AI Safety System

Every message flows through this critical architecture:

```
Child Input → Safety Monitor → Primary Agent → Safety Monitor → Response
```

**Layer 1: Primary Chat Agent** (`lib/ai/client.ts`)

- GPT-4o for main conversations
- Age-appropriate language adaptation (6-8, 9-11, 12+)
- Persona-based responses (friendly-raccoon, wise-jellyfish, chill-robot)
- Memory and context awareness
- Whisper Mode for distressed children

**Layer 2: Real-time Safety Monitor** (`lib/ai/safety.ts`)

- GPT-4o-mini for fast safety validation
- Rule-based pattern detection for immediate threats
- 4-level severity system (0-3)
- Automatic parent notification and escalation
- Content blocking with child-friendly redirections

### 2. Authentication Architecture

**Two-Tier Clerk System** (COPPA Compliant):

- **Parent Accounts**: Full Clerk authentication (email/password/MFA)
- **Child Sub-Profiles**: Managed under parent accounts
- **Legal Structure**: All child data legally owned by parent account
- **Session Management**: Clerk sessions with custom middleware routing

### 3. Database Schema

Key models in our Prisma schema:

```prisma
// Parent accounts (Clerk users)
model Parent {
  clerkUserId         String @unique
  email               String @unique
  childAccounts       ChildAccount[]
  notifications       ParentNotification[]
  emailNotifications  Boolean @default(true)
  dataRetentionDays   Int @default(90)
}

// Child sub-profiles under parent accounts
model ChildAccount {
  clerkUserId         String @unique
  parentClerkUserId   String
  username            String @unique
  name                String
  age                 Int
  persona             String @default("friendly-raccoon")
  conversations       Conversation[]
  safetyEvents        SafetyEvent[]
  accountStatus       String @default("active")
}

// Safety events requiring attention
model SafetyEvent {
  severityLevel       Int              // 1-3
  triggerContent      String
  aiReasoning         String?
  parentNotifiedAt    DateTime?
  status              String           // active, resolved
  childAccount        ChildAccount     @relation(...)
}
```

---

## Development Workflow

### Safety-First Development Process

**CRITICAL**: Before implementing ANY feature, follow this workflow:

#### Phase 1: Production Safety Impact Assessment - ✅ LIVE ENFORCEMENT

1. **Privacy Impact Assessment**: What child data is involved? (COPPA enforced)
2. **Age Appropriateness Review**: Suitable for 6-12 year olds? (Live validation)
3. **Parental Control Integration**: Can parents manage this feature? (Dashboard active)
4. **Compliance Check**: COPPA/GDPR implications? (Production compliant)
5. **Live Impact Assessment**: How does this affect production families? (NEW)

#### Phase 2: Safety-Driven TDD

1. **Safety Tests First**: Write safety validation tests before feature tests
2. **Edge Case Safety**: Test with inappropriate inputs, age boundaries
3. **Escalation Testing**: Verify parent notification workflows
4. **Audit Trail Testing**: Ensure all actions are logged

#### Phase 3: Implementation with Safety Gates

1. **No Shortcuts**: Every safety check must be implemented
2. **Real Integrations**: No mocking safety systems
3. **Error Boundaries**: Graceful failure modes for children
4. **Age-Appropriate UX**: Language and design for target age groups

#### Phase 4: Compliance Validation

1. **Safety Test Suite**: `npm run test:safety` must pass 100%
2. **Security Scanning**: Automated PII detection validation
3. **Parent Experience Testing**: Verify all parental controls work
4. **Documentation**: Update compliance docs and safety procedures

### Code Review Checklist

Before any PR approval, verify:

- [ ] Safety tests pass 100%
- [ ] No PII collection or storage
- [ ] Age-appropriate language and UX
- [ ] Parent notification workflows tested
- [ ] Error handling provides child-friendly messages
- [ ] Audit logging for compliance
- [ ] TypeScript strict mode compliance
- [ ] ESLint and Prettier formatting

---

## File Structure & Conventions

### Project Structure

```
app/
├── api/           # API routes with mandatory safety validation
│   ├── auth/      # Authentication (parent/child)
│   ├── chat/      # Main chat interface
│   ├── safety/    # Safety alerts and escalation
│   └── parent/    # Parent dashboard APIs
├── chat/          # Child chat interface
├── parent/        # Parent dashboard
├── onboarding/    # Account setup flows
└── moderation/    # Human moderation interface

components/
├── auth/          # Authentication components
├── chat/          # Chat interface with safety animations
├── parent/        # Parent dashboard components
└── ui/            # Reusable UI (Brutal design system)

lib/
├── ai/            # AI client and safety systems
├── auth.ts        # Authentication utilities
├── prisma.ts      # Database client
├── notifications.ts # Email alerts (Resend)
└── memory.ts      # Child memory and personalization

docs/
├── PRD.md         # Product requirements
├── API_ROUTES.md  # API documentation
├── COMPLIANCE.md  # Legal and safety requirements
└── RECOVERY_ROADMAP.md # Critical issue tracking
```

### Naming Conventions

- **Components**: PascalCase (e.g., `BrutalChatInterface.tsx`)
- **Files**: kebab-case (e.g., `safety-validation.test.ts`)
- **API Routes**: RESTful paths (e.g., `/api/safety/alerts/[alertId]/resolve`)
- **Database Fields**: snake_case (e.g., `parent_clerk_user_id`)
- **Environment Variables**: SCREAMING_SNAKE_CASE (e.g., `OPENAI_API_KEY`)

---

## Safety System Details

### Safety Severity Levels

Our safety system uses a 4-level classification:

- **Level 0**: Safe content - allow normally
- **Level 1**: Monitor - log for pattern analysis
- **Level 2**: Warn - gentle redirection + parent notification
- **Level 3**: Escalate - block conversation + immediate parent alert

### Content Processing Flow

```typescript
// Every message goes through this flow
const safetyResult = await validateMessageSafety(message, {
  childAccountId,
  childAge,
  conversationId,
  recentMessages,
});

if (safetyResult.severity >= 3) {
  // Immediate escalation
  await escalateToParent(message, safetyResult, context);
  return getSafetyResponse(safetyResult, childAge);
}

if (safetyResult.severity >= 2) {
  // Log and notify
  await logSafetyEvent(message, safetyResult, context);
}

// Continue with normal AI response
const aiResponse = await generateChatResponse(message, context);
```

### Parent Notification System

Real-time email alerts via Resend for:

- **Immediate Alerts**: Level 3 safety escalations
- **Daily Summaries**: Level 2 warnings and patterns
- **Weekly Reports**: Activity summaries and recommendations

---

## Testing Strategy

### Live Production Safety Testing - ✅ CRITICAL (100% Coverage)

Safety tests are **MANDATORY** for live production and must achieve 100% pass rate:

```bash
npm run test:safety          # PRODUCTION: Must pass before any deployment
npm run test:safety:live     # PRODUCTION: Test against live safety API
npm run test:escalation      # PRODUCTION: Parent notification workflows
```

Test scenarios include:

- Inappropriate language detection
- Personal information sharing attempts
- Emotional distress pattern recognition
- Age boundary violations
- Emergency escalation procedures
- Parent notification delivery

### Test Configuration

**Vitest** (`vitest.config.ts`):

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
    },
  },
});
```

**Playwright** (`playwright.config.ts`):

- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile device simulation
- Authentication state management
- Safety workflow validation

### E2E Test Scenarios

Critical user flows that must be tested:

1. Parent account creation and child setup
2. Child login and conversation flow
3. Safety escalation and parent notification
4. Parent dashboard and alert management
5. Memory and personalization features

---

## Design System

### Brutal UI Theme

Our custom "Brutal" design system emphasizes:

- **High contrast** for accessibility
- **Bold, chunky fonts** (Rokano, Avotica)
- **Bright, friendly colors** (yellow, pink, blue, green)
- **Heavy shadows** and borders for tactile feel
- **Age-appropriate** visual language

### Color Palette

```css
:root {
  --brutal-black: #000000;
  --brutal-white: #ffffff;
  --brutal-yellow: #ffe500;
  --brutal-pink: #ff69b4;
  --brutal-blue: #00bfff;
  --brutal-green: #32cd32;
}
```

### Typography

```css
.font-rokano {
  font-family: 'Rokano', 'Impact', 'Arial Black', sans-serif;
}
.font-avotica {
  font-family: 'Avotica', 'Helvetica Neue', 'Arial', sans-serif;
}
```

### Age-Appropriate Design Principles

- **6-8 years**: Simple words, large buttons, high excitement
- **9-11 years**: Casual language, compound UI, balanced energy
- **12+ years**: Full complexity, abstract concepts, respectful autonomy
- **Universal**: Encouraging, positive, supportive interactions

---

## Deployment & Operations

### Vercel Configuration

Deploy settings:

- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Install Command**: `npm install`
- **Environment Variables**: Set all required keys

### Performance Targets

- **Chat Response**: <2 seconds end-to-end
- **Safety Processing**: <5 seconds (masked with animations)
- **Parent Alerts**: <60 seconds delivery time
- **System Uptime**: 99.5% during child waking hours (6am-10pm)

### Monitoring & Alerts

Critical metrics to monitor:

- Safety system response times
- Parent notification delivery rates
- Database query performance
- API error rates and types
- Child session durations and engagement

---

## Compliance & Legal

### COPPA Requirements

- **Parental Consent**: Required for all child accounts
- **Data Minimization**: Only collect essential information
- **Parent Access**: Full data export and deletion rights
- **Retention Limits**: 90-day default with parent control
- **Third-Party Disclosure**: Prohibited without consent

### GDPR Article 8 (Children)

- **Special Protection**: Enhanced privacy for under-16s
- **Lawful Basis**: Parental consent required
- **Data Portability**: Export in machine-readable format
- **Right to Erasure**: Complete data deletion capability
- **Privacy by Design**: Built-in protection mechanisms

### Data Protection Implementation

- **Encryption**: All data encrypted at rest and in transit
- **Access Controls**: Role-based permissions (parent/child/moderator)
- **Audit Logging**: Complete activity trail for compliance
- **Data Retention**: Automated deletion after retention period
- **Anonymization**: Remove identifying information from analytics

---

## Troubleshooting

### Common Development Issues

**1. Safety Tests Failing**

```bash
# Check if API keys are set correctly
npm run test:safety -- --reporter=verbose

# Common fix: ensure RESEND_API_KEY is set or tests run in test mode
```

**2. Database Connection Issues**

```bash
# Regenerate Prisma client
npm run db:generate

# Check database URL format
echo $DATABASE_URL
```

**3. Build Errors**

```bash
# Type check first
npm run type-check

# Clear Next.js cache
rm -rf .next && npm run build
```

**4. Port 4288 Already in Use**

```bash
# Development server auto-kills existing processes
npm run dev

# Manual cleanup if needed
lsof -ti:4288 | xargs kill -9
```

### Performance Debugging

**Slow Chat Responses**:

- Check OpenAI API latency
- Verify safety validation performance
- Monitor database query times
- Review memory system efficiency

**Parent Alert Delays**:

- Verify Resend API status
- Check email queue processing
- Validate notification logic
- Monitor database write performance

---

## Contributing

### Pull Request Process

1. **Safety Review**: All PRs must pass safety validation
2. **Code Review**: At least one reviewer familiar with child safety
3. **Testing**: 100% safety test coverage required
4. **Documentation**: Update relevant docs for feature changes
5. **Compliance**: Verify COPPA/GDPR implications

### Development Priorities

**LIVE PRODUCTION STATUS** (January 2025):

1. ✅ **Parent Dashboard**: 4-tab interface with PIN protection (LIVE)
2. ✅ **Safety System**: Dual-layer validation with 100% coverage (OPERATIONAL)
3. ✅ **Voice Integration**: Cartesia TTS with persona voices (ACTIVE)
4. ✅ **Email Summaries**: GPT-4o-mini weekly analysis (DEPLOYED)
5. ✅ **Buddy 2.0**: Calendar integration with organic nudging (LIVE)

**ACTIVE DEVELOPMENT** (2025 Roadmap):

- Enhanced persona personalities and emotional intelligence
- Multi-child family support with sibling interaction insights
- Advanced analytics and learning opportunity recommendations
- Clinical validation pathway for Onda 3.0
- Healthcare integration preparation

---

## Emergency Procedures

### Safety Concern Escalation

If any safety concerns arise during development:

1. **STOP**: Halt feature development immediately
2. **Document**: Record details in safety incident log
3. **Escalate**: Contact project lead and designated safety officer
4. **Implement Safeguards**: Add additional protection measures
5. **Re-test**: Validate all safety systems before continuing

### Data Incident Response

For any potential data exposure:

1. **Immediate Containment**: Secure affected systems
2. **Assessment**: Determine scope of potential exposure
3. **Notification**: Alert parents within 72 hours if required
4. **Remediation**: Implement fixes and additional safeguards
5. **Documentation**: Complete incident report for compliance

---

**Remember: We're building a safe space for children. When in doubt, always choose the most protective option.**

---

_Last updated: January 2025_  
_Platform Status: LIVE IN PRODUCTION at www.onda.click_  
_Version: Buddy 2.0 with calendar integration and organic nudging_
