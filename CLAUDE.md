# CLAUDE.md - Onda AI Child Safety Platform

see /Users/deannewton/Documents/Buddy/.claude/settings.json

_Safe AI chat companion for children aged 6-12. CRITICAL: All development must prioritize child safety and legal compliance._

## Project Context & Mission

Onda provides AI companionship for children with strict safety, privacy, and compliance requirements. Every feature, every line of code, every decision must pass through the lens of child protection.

## Tech Stack

- **Frontend**: Next.js 14.2.29, React, TailwindCSS, TypeScript
- **Backend**: Next.js API routes with dual-layer safety validation
- **Database**: NeonDB (PostgreSQL) with Prisma ORM
- **Auth**: Clerk (two-tier: parent accounts + child sub-profiles)
- **Testing**: Vitest (unit), Playwright (E2E), custom safety validation
- **AI**: OpenAI/Anthropic via proxy with dual-layer safety architecture
- **Voice**: Cartesia TTS (planned)
- **Deployment**: Vercel with strict environment controls

## Critical Development Commands

```bash
# Development & Build
npm run dev          # Dev server (port 4288, auto-kills existing)
npm run build        # Production build
npm run lint         # ESLint (must pass before commits)
npm run type-check   # TypeScript validation (must pass)
npm run format       # Prettier formatting

# Testing (MANDATORY)
npm run test         # Vitest unit tests
npm run test:ui      # Vitest UI interface
npm run test:safety  # Safety validation tests (CRITICAL)
npm run test:e2e     # Playwright E2E tests

# Database (Handle with Care)
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to DB (staging only)
npm run db:migrate   # Create migrations (production)
npm run db:seed      # Seed with test data
npm run db:studio    # Open Prisma Studio
```

## COMPLIANCE REQUIREMENTS (Non-Negotiable)

### Legal Framework

- **COPPA**: All child data legally owned by parent accounts
- **GDPR Article 8**: Special protection for children under 16
- **Data Retention**: 90-day maximum, parent-controlled deletion
- **Data Minimization**: No location, device, or biometric collection
- **Encryption**: All data encrypted at rest and in transit
- **Audit Logging**: Complete activity logs for compliance

### Safety-Critical Architecture

#### Dual-Layer AI Safety System

Every message flows through this architecture:

```
Child Input → Safety Monitor → Primary Agent → Safety Monitor → Response
```

**Layer 1**: Primary chat agent (`lib/ai/client.ts`)
**Layer 2**: Real-time safety monitor (`lib/ai/safety.ts`)

#### Two-Tier Authentication Architecture

- **Parent Accounts**: Full Clerk authentication (email/password)
- **Child Sub-Profiles**: PIN-based access (4-digit), stored as sub-accounts
- **Legal Structure**: Child data belongs to parent account (COPPA compliant)

### Safety Severity Levels

- **Level 0**: Safe content - allow normally
- **Level 1**: Monitor - log for pattern analysis
- **Level 2**: Warn - gentle redirection + parent notification
- **Level 3**: Escalate - block conversation + immediate parent alert

## Development Workflow (Safety-First)

### Phase 1: Safety Impact Assessment

Before any feature development:

1. **Privacy Impact Assessment**: What child data is involved?
2. **Age Appropriateness Review**: Suitable for 6-12 year olds?
3. **Parental Control Integration**: Can parents manage this feature?
4. **Compliance Check**: COPPA/GDPR implications?

### Phase 2: Safety-Driven TDD

1. **Safety Tests First**: Write safety validation tests before feature tests
2. **Edge Case Safety**: Test with inappropriate inputs, age boundaries
3. **Escalation Testing**: Verify parent notification workflows
4. **Audit Trail Testing**: Ensure all actions are logged

### Phase 3: Implementation with Safety Gates

1. **No Shortcuts**: Every safety check must be implemented
2. **Real Integrations**: No mocking safety systems
3. **Error Boundaries**: Graceful failure modes for children
4. **Age-Appropriate UX**: Language and design for target age groups

### Phase 4: Compliance Validation

1. **Safety Test Suite**: `npm run test:safety` must pass 100%
2. **Security Scanning**: Automated PII detection validation
3. **Parent Experience Testing**: Verify all parental controls work
4. **Documentation**: Update compliance docs and safety procedures

## File Structure Patterns

### API Routes (`/app/api/`) - Security Critical

- `auth/` - Authentication (PIN verification, child creation)
- `chat/` - Message handling with mandatory safety validation
- `children/` - Child profile management (COPPA compliant)
- `safety/` - Safety monitoring and parent notifications

### Components (`/components/`) - Child-Safe Design

- `auth/` - PIN entry, parent onboarding
- `chat/` - Chat interface with typing animations (masks safety processing)
- `ui/` - Brutal design system (age-appropriate)
- `layout/` - Child-safe navigation

### Libraries (`/lib/`) - Safety Infrastructure

- `ai/` - Dual-layer safety system and AI integration
- `auth.ts` - Authentication utilities
- `prisma.ts` - Database client with child data protection
- `safety/` - Safety validation, content filtering, escalation

## Database Schema (Migration Phase)

### Legacy Models (PIN-based system)

- `Child`, `Conversation`, `Message`

### New Models (Clerk-based system)

- `ChildAccount`, `NewConversation`, `NewMessage`

### Shared Models (Cross-system)

- `Parent`, `SafetyEvent`, `ParentNotification`

**CRITICAL**: Never modify child data without proper parent authentication.

## Child UX Design Principles

### Age-Appropriate Design (6-12 years)

- **Vocabulary Adaptation**: Adjust by age groups (6-8, 9-11, 12+)
- **Emotional Safety**: Error boundaries with comforting messages
- **Visual Feedback**: Typing animations mask safety processing delays
- **Persona System**: Child selects AI companion character
- **Whisper Mode**: Calming interactions for distressed children

### Safety-First Interactions

- **No Personal Questions**: AI should not ask for personal information
- **Positive Reinforcement**: Focus on encouraging, supportive responses
- **Redirect Inappropriate Topics**: Gentle subject changes, not harsh rejections
- **Parent Notifications**: Transparent communication about concerning patterns

## Security Implementation Requirements

### Message Validation Flow (Mandatory)

1. **Input Sanitization**: All messages validated before processing
2. **Rule-Based Checks**: Pattern matching for immediate safety issues
3. **AI Safety Validation**: Context-aware safety analysis
4. **Escalation Logic**: Severity-based parent notification
5. **Response Generation**: Age-appropriate safety responses

### Data Protection Standards

- **PII Detection**: Automated scanning for personal information
- **Content Filtering**: Real-time inappropriate content blocking
- **Audit Logging**: Complete conversation history for compliance
- **Parent Dashboard**: Transparent activity reporting
- **Emergency Escalation**: Direct parent contact for serious concerns

## Restricted Operations (DO NOT)

- ❌ Direct database queries on child profiles without parent auth
- ❌ Storing conversations longer than 90 days
- ❌ Collecting any location or device data
- ❌ Allowing anonymous child interactions
- ❌ Implementing features without safety tests
- ❌ Deploying without parent notification systems

## Testing Strategy (Child Safety Critical)

### Safety Test Requirements

```bash
npm run test:safety  # Must pass 100% before any deployment
```

**Test Coverage Requirements:**

- **100% for safety features**: No exceptions
- **90% for general features**: Standard requirement
- **Edge Case Testing**: Inappropriate inputs, age boundaries
- **Escalation Testing**: Parent notification workflows

### Child Safety Test Scenarios

- Inappropriate language input
- Personal information sharing attempts
- Emotional distress detection
- Age boundary violations
- Parent notification triggers
- Emergency escalation procedures

## Compliance Checklist (Before Any Deployment)

- [ ] All child data operations have parent consent verification
- [ ] Safety monitoring is active for all interactions
- [ ] PII detection and masking is functioning
- [ ] Parent notification systems are working
- [ ] Data retention limits are enforced (90 days)
- [ ] Audit logging captures all required events
- [ ] Age-appropriate design validated across age groups
- [ ] Emergency escalation procedures tested

## Emergency Procedures

If safety concerns arise during development:

1. **Stop Feature Development**: Do not proceed without safety review
2. **Document the Concern**: Record details in safety log
3. **Escalate Immediately**: Contact project lead and safety officer
4. **Implement Additional Safeguards**: Err on side of over-protection
5. **Re-test Thoroughly**: Validate all safety systems before continuing

_Remember: We're building a safe space for children. When in doubt, choose the most protective option._

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.

---

## DEVELOPMENT HANDOVER (Current Status)

### 🎯 Current Implementation Status

**COMPLETED (December 2024)**

#### ✅ Core Safety System

- **Dual-layer AI safety architecture** - Fixed critical pattern matching bug in `lib/ai/safety.ts`
- **Dynamic safety responses** - Enhanced with age-appropriate, randomized responses
- **Context analysis system** - Mood detection, topic tracking, engagement analysis
- **Rule-based safety validation** - Pattern matching for immediate threat detection
- **AI safety validation** - LLM-powered contextual safety analysis

#### ✅ Parent Dashboard & Controls (Phase 1)

- **PIN Protection System** - Secure 4-digit PIN with bcrypt hashing and lockout protection
- **Parent Dashboard** - Comprehensive time limits, email summaries, privacy controls
- **Database Schema** - Complete parent dashboard tables (ParentDashboardAccess, ParentSettings, DailyUsage)
- **API Infrastructure** - Settings management, usage tracking, PIN authentication

#### ✅ Authentication & Security

- **Clerk Integration** - Two-tier authentication (parent accounts + child sub-profiles)
- **PIN-based Dashboard Access** - Additional security layer for sensitive parent controls
- **Lockout Protection** - 5 failed attempts = 15 minute lockout with countdown
- **COPPA Compliance** - All child data operations require parent authentication

#### ✅ User Experience

- **Auto-scroll Fix** - Chat messages automatically scroll to new content
- **Typing Animations** - Natural conversation feel while safety processing occurs
- **Age-appropriate Design** - Brutal design system optimized for 6-12 year olds
- **Error Boundaries** - Graceful failure modes with comforting messages

### 🔧 Technical Architecture

#### Database Models (Prisma Schema)

```
Core Models:
- Parent (Clerk user + PIN hash + preferences)
- ChildAccount (unified Clerk-based child accounts)
- Conversation (unified conversation tracking)
- Message (unified message storage with safety scores)
- SafetyEvent (escalation and moderation tracking)

Parent Dashboard:
- ParentDashboardAccess (PIN security and lockout)
- ParentSettings (time limits, email preferences, privacy)
- DailyUsage (activity tracking and analytics)

Knowledge System:
- KnowledgeEntry (vector embeddings for youth culture)
- TrendingTopic (real-time trend monitoring)
- ConversationContext (session memory and context)
```

#### Key File Locations

```
Authentication & Security:
- /lib/parent-auth.ts (PIN hashing and verification)
- /components/parent/auth/ (PIN setup and entry components)
- /app/api/parent/ (dashboard APIs)

Safety System:
- /lib/ai/safety.ts (dual-layer safety validation)
- /lib/ai/context-analyzer.ts (mood and topic detection)
- /config/system-prompts.json (dynamic safety responses)

Parent Dashboard:
- /components/parent/ParentDashboard.tsx (main dashboard)
- /app/parent/page.tsx (PIN-protected parent access)
- /app/api/parent/settings/ (settings management)
- /app/api/parent/usage/ (usage analytics)
```

### 🚀 Next Development Priorities

#### Phase 2: Email Summary System (Immediate)

**Priority: HIGH - Foundation already implemented**

1. **AI Summary Generation**

   - Implement GPT-4o-mini integration for cost-effective analysis (~$0.0003/summary)
   - Create conversation analysis pipeline for mood, topics, safety events
   - Build parent-friendly summary templates

2. **Email Delivery System**

   - Set up email service (SendGrid/Resend recommended)
   - Create HTML email templates with safety-first design
   - Implement scheduling system for weekly/monthly summaries

3. **Summary Analytics**
   - Track engagement trends over time
   - Identify learning opportunities and growth patterns
   - Flag concerning patterns for parent attention

#### Phase 3: Advanced Parent Controls (Medium Priority)

1. **Smart Time Management**

   - Natural conversation ending system (vs hard cutoffs)
   - Context-aware time warnings
   - Adaptive time limits based on engagement quality

2. **Content Control Enhancement**

   - Topic blocking/allowing with granular controls
   - Safety level adjustment (strict/standard/relaxed)
   - Emergency contact integration

3. **Multi-Child Support**
   - Individual settings per child
   - Comparative analytics across children
   - Sibling interaction management

#### Phase 4: Advanced Features (Lower Priority)

1. **Voice Integration (Cartesia TTS)**

   - Voice message support
   - Audio summary generation
   - Whisper mode for emotional support

2. **Enhanced Analytics**
   - Predictive mood analysis
   - Learning opportunity recommendations
   - Social/emotional development tracking

### 🔒 Critical Security Considerations

#### Current Security Implementations

- **PIN Protection**: bcrypt hashed 4-digit PINs with lockout protection
- **Data Encryption**: All child data encrypted at rest and in transit
- **Access Control**: Strict parent authentication for all child data access
- **Audit Logging**: Complete activity logs for compliance tracking

#### Security Gaps to Address

- **Email Summary Security**: Ensure summarized data doesn't expose sensitive details
- **API Rate Limiting**: Implement rate limiting on parent dashboard APIs
- **Session Management**: PIN session timeout and invalidation
- **Data Export Security**: Secure parent data export with audit trails

### 📊 Performance & Cost Monitoring

#### Current Optimizations

- **GPT-4o-mini**: Cost-effective LLM for email summaries (~$0.0003 per analysis)
- **Vector Search**: Efficient knowledge retrieval system
- **Database Indexing**: Optimized queries for parent dashboard analytics
- **Response Caching**: Safety pattern caching for faster validation

#### Monitoring Required

- **AI API Costs**: Track OpenAI/Anthropic usage and optimize
- **Database Performance**: Monitor query performance for analytics
- **Email Delivery**: Track email success rates and engagement
- **Safety Processing Time**: Ensure sub-second response times

### 🧪 Testing & Quality Assurance

#### Current Test Coverage

- **Safety System**: 100% coverage required for all safety features
- **Authentication**: PIN setup, verification, and lockout testing
- **Parent Dashboard**: Settings management and usage tracking
- **E2E Testing**: Playwright tests for critical user flows

#### Testing Gaps

- **Email Summary Testing**: Mock email delivery and content validation
- **Multi-Child Scenarios**: Testing with multiple child accounts
- **Data Export Testing**: Verify complete and secure data exports
- **Performance Testing**: Load testing for parent dashboard analytics

### 🚨 Known Issues & Technical Debt

#### Immediate Fixes Needed

- **TypeScript Errors**: config/knowledge-system/knowledge-config-setup.ts has syntax errors
- **Environment Variables**: Ensure all required env vars documented
- **Error Handling**: Improve error boundaries in parent dashboard
- **Mobile Responsiveness**: Optimize parent dashboard for mobile devices

#### Technical Debt

- **Legacy Model Migration**: Complete migration from old PIN-based models
- **API Consistency**: Standardize API response formats across endpoints
- **Component Library**: Consolidate brutal design system components
- **Documentation**: Complete API documentation for parent dashboard

### 📱 Deployment Checklist

#### Pre-Deployment Requirements

```bash
# Required Environment Variables
DATABASE_URL=           # NeonDB connection string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
OPENAI_API_KEY=        # For AI safety and summaries
ANTHROPIC_API_KEY=     # Backup AI provider
EMAIL_SERVICE_KEY=     # SendGrid/Resend for summaries
WEBHOOK_SECRET=        # Clerk webhook validation

# Database Migrations
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:push        # Push to production (staging only)

# Quality Gates
npm run lint           # Must pass
npm run type-check     # Must pass (fix knowledge config first)
npm run test:safety    # 100% pass required
npm run test:e2e       # Critical flows tested
```

#### Vercel Deployment Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "nodeVersion": "18.x"
}
```

### 📞 Handover Contact Points

#### Critical Knowledge Areas

1. **Safety System Architecture**: Understanding dual-layer validation flow
2. **Parent Dashboard Security**: PIN protection and data access patterns
3. **Database Schema**: Unified models and migration strategy
4. **COPPA Compliance**: Legal requirements and implementation details
5. **Email Summary System**: Cost-effective AI analysis pipeline

#### Development Environment Setup

```bash
# Clone and setup
git clone [repository]
cd buddy
npm install

# Environment setup
cp .env.example .env.local
# Fill in required environment variables

# Database setup
npm run db:generate
npm run db:push

# Start development
npm run dev
```

#### Emergency Contacts & Escalation

- **Safety Issues**: Immediately halt deployment, document concern
- **COPPA Violations**: Legal review required before proceeding
- **Data Breach**: Follow incident response plan
- **Parent Complaints**: Route through customer support with safety review

---

**Last Updated**: December 2024  
**Status**: Phase 1 Complete - Ready for Email Summary Implementation  
**Next Developer**: Review handover, fix TypeScript errors, implement Phase 2
