# Technical Architecture - Buddy Platform

## Stack Overview

**Confirmed Implementation**: Next.js 14.2.29 with production-grade safety architecture

### Core Technology Stack

- **Frontend**: Next.js 14.2.29 (App Router), React 18.2.0, TypeScript 5.1.6
- **Backend**: Next.js API Routes with Node.js runtime
- **Database**: NeonDB (PostgreSQL) with Prisma ORM 5.6.0
- **Authentication**: Clerk (@clerk/nextjs 4.27.1) with two-tier architecture
- **Styling**: TailwindCSS with custom Brutal design system
- **AI Services**: OpenAI (4.20.1) + Anthropic SDK (0.9.1)
- **Voice**: Cartesia TTS integration
- **Email**: Resend for transactional emails
- **Testing**: Vitest (unit) + Playwright (E2E)

### Database Architecture

#### Unified Clerk-Based Models

```typescript
// Primary entity relationships
Parent (Clerk user) 1:N ChildAccount (Clerk sub-accounts)
ChildAccount 1:N Conversation 1:N Message
Parent 1:1 ParentSettings (time limits, privacy)
Parent 1:N SafetyEvent (escalation tracking)
Parent 1:N WeeklySummary (automated email summaries)
```

#### Core Tables

- **ChildAccount**: Unified child accounts with Clerk user IDs
- **Conversation/Message**: Chat history with safety metadata
- **SafetyEvent**: Escalation tracking and parent notifications
- **ParentSettings**: Time limits, email preferences, privacy controls
- **WeeklySummary**: Automated email summary generation
- **KnowledgeEntry**: Vector embeddings for UK youth culture

### AI Safety Architecture

#### Dual-Layer Validation System

```typescript
// lib/ai/safety.ts - Production implementation
1. Input Processing → Rule-based patterns → AI validation
2. Response Generation → Output safety check → User delivery
3. Real-time monitoring → Safety event logging → Parent alerts
```

**Safety Levels**:

- **Level 0**: Safe content (allow normally)
- **Level 1**: Monitor (log for patterns)
- **Level 2**: Warn (gentle redirection + parent notification)
- **Level 3**: Escalate (block + immediate parent alert)

#### Context-Aware Safety

- Age-appropriate responses (6-8, 9-11, 12+ groups)
- Conversation history analysis
- Emotional state consideration
- Cultural context understanding (UK youth culture)

### API Architecture

#### Core Endpoints

```typescript
/api/chat/               // Main chat with dual safety validation
/api/parent/             // Dashboard, PIN management, settings
/api/safety/             // Safety alerts and escalation
/api/voice/synthesize    // Cartesia TTS integration
/api/weekly-summaries/   // Email summary generation
/api/children/           // Child account management
```

#### Authentication Flow

```typescript
1. Parent: Standard Clerk auth (email/password)
2. Child: Username/PIN authentication via Clerk
3. Dashboard: Additional PIN protection for sensitive operations
4. Sessions: Proper Clerk session management (no localStorage)
```

### Parent Dashboard Architecture

#### PIN Protection System

```typescript
// components/parent/auth/PinEntry.tsx
- 4-digit PIN with bcrypt hashing
- Lockout protection: 5 attempts = 15 minute lockout
- Session management for dashboard access
- Audit logging for compliance
```

#### Dashboard Tabs

```typescript
1. Overview: Child profiles, activity summaries, recent alerts
2. Time Limits: Daily/weekly limits with natural ending system
3. Email Summaries: Weekly AI-generated insights and delivery
4. Privacy: Data retention, export, visibility controls
```

### Chat Interface Architecture

#### Real-Time Chat System

```typescript
// components/chat/BrutalChatInterface.tsx
- Real-time typing animations (masks safety processing)
- Auto-scroll with conversation continuity
- Voice input/output integration
- Time warning system with gentle transitions
- Whisper mode for emotional support
```

#### Message Processing Flow

```typescript
1. User Input → Safety validation → Context analysis
2. AI Response Generation → Output safety check
3. Voice synthesis (optional) → Message delivery
4. Conversation logging → Parent analytics update
```

### Email Summary System

#### Production-Ready Pipeline

```typescript
// lib/email-summary/ - Complete implementation
1. WeeklyDataCollector: Aggregate conversation data
2. LLMAnalyzer: GPT-4o-mini analysis (~$0.0003/summary)
3. EmailTemplateGenerator: HTML email with insights
4. EmailService: Resend delivery with retry logic
5. Token tracking: Cost monitoring and optimization
```

### Voice Integration

#### Cartesia TTS Implementation

```typescript
// app/api/voice/synthesize/route.ts
- Text cleaning for natural speech
- Persona-based voice selection
- Whisper mode support (calming voice)
- Audio caching (1 hour duration)
- Age-appropriate speech patterns
```

### Testing Architecture

#### Comprehensive Testing Strategy

```typescript
// Safety-first testing approach
1. Unit Tests: Vitest for component and function testing
2. Safety Tests: Adversarial input validation (95%+ accuracy)
3. E2E Tests: Playwright for critical user flows
4. Performance Tests: Response time and load validation
```

### Security Implementation

#### COPPA-Compliant Security

- All child data legally owned by parent accounts
- Encrypted data at rest and in transit
- Complete audit trails for compliance
- PIN-protected access to sensitive operations
- Rate limiting on authentication attempts

#### Data Protection

- Automatic data retention limits (90-day default)
- Parent-controlled data export and deletion
- Granular privacy controls and visibility settings
- Secure session management with Clerk

### Performance Optimization

#### Response Time Targets

- Chat messages: <200ms average response time
- Safety processing: <100ms dual-layer validation
- Voice synthesis: <2 seconds text-to-speech
- Email summaries: <30 seconds generation time

#### Scalability Features

- Database indexing for conversation queries
- Safety pattern caching for common scenarios
- Vector search for knowledge retrieval
- Connection pooling for database efficiency

### Deployment Architecture

#### Vercel Production Setup

```typescript
// vercel.json configuration
- Next.js 14 deployment optimization
- Environment variable management
- Function timeout configuration
- Build performance optimization
```

#### Environment Requirements

```bash
# Core services
DATABASE_URL=                    # NeonDB connection
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Email and voice
RESEND_API_KEY=
CARTESIA_API_KEY=

# Safety and monitoring
WEBHOOK_SECRET=                  # Clerk webhooks
```

### Monitoring & Analytics

#### Real-Time Monitoring

- Safety system performance tracking
- Conversation quality metrics
- Parent engagement analytics
- Cost tracking for AI services
- Error monitoring and alerting

#### Parent Analytics

- Child activity summaries
- Mood and topic trend analysis
- Safety event tracking and resolution
- Usage patterns and engagement metrics

This architecture provides a robust, scalable foundation for the Buddy 2.0 → Onda 3.0 evolution while maintaining child safety as the primary concern.
