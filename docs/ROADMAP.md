# AI Agent Build Tasks - Lumo Platform

## 🚀 NEW FEATURE: Dynamic Time Limits (Priority Addition)

### 🕐 Intelligent Chat Duration Management

**Goal**: Parent-controlled time limits that feel natural and conversational

**Smart Detection System**:

- **Conversation Analysis**: Detect emotional discussions, learning moments, or important topics
- **Context-Aware Decisions**: Allow meaningful conversations to continue, wind down casual chat
- **Natural Transitions**: AI gives human-like reasons to end ("I need to tidy my room", "got football practice")

**Parent Controls**:

- Set daily/session time limits in parent dashboard
- Choose strictness level: flexible, balanced, or strict
- Emergency override for emotional support scenarios

**Implementation Plan**:

1. Add time limit fields to parent settings in database
2. Create conversation importance scoring system
3. Build natural conversation ending prompt library
4. Integrate with existing chat flow for seamless transitions

**Benefits**:

- Healthy screen time boundaries without abrupt cutoffs
- Maintains trust and engagement with children
- Gives parents control while preserving conversation quality
- Teaches natural conversation closure patterns

---

## 🏛️ PARENT DASHBOARD (High Priority)

### 📱 Comprehensive Parental Control Center

**Goal**: COPPA-compliant parent dashboard with time limits, safety alerts, and family management

**Core Features**:

- **Time Management**: Dynamic chat limits with smart overrides for emotional/educational content
- **Multi-Channel Alerts**: Email, SMS, push notifications for safety events
- **Weekly Summaries**: Automated insights about child's digital wellbeing
- **Privacy Controls**: Data export, deletion, conversation visibility settings
- **Family Management**: Multi-child support, partner access permissions

**Safety Integration**:

- Real-time safety alert delivery (< 60 seconds for critical)
- Customizable alert thresholds and notification preferences
- Emergency override capabilities for crisis situations
- Complete audit trail for compliance and family trust

**Implementation Phases**:

1. **MVP Dashboard** (Week 1): Basic time limits, email alerts, single child
2. **Enhanced Controls** (Week 2): SMS/push notifications, weekly summaries
3. **Family Features** (Week 3): Multi-child management, partner access

**Benefits**:

- Full COPPA compliance through transparent parental control
- Builds family trust with clear oversight and communication
- Provides parents peace of mind while maintaining child autonomy
- Creates healthy digital boundaries without abrupt technology cutoffs

---

## Foundation (Week 1-2)

### 🔧 Project Setup

```bash
# Task: Initialize Next.js project with TypeScript
mkdir lumo && cd lumo
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false
npm install @clerk/nextjs prisma @prisma/client openai @anthropic-ai/sdk resend zod zustand

# Task: Configure TypeScript strict mode
# File: tsconfig.json
# Add: "strict": true, "noUncheckedIndexedAccess": true

# Task: Set up Prisma
npx prisma init
# Copy schema.prisma from docs/
npx prisma generate
```

### 📊 Database Setup

```bash
# Task: Create NeonDB project and get connection string
# Add DATABASE_URL to .env.local

# Task: Push schema to database
npx prisma db push

# Task: Create seed file
# File: prisma/seed.ts
# Content: Basic personas, test children, sample conversations
npx prisma db seed
```

### 🔐 ✅ Unified Clerk Authentication System **COMPLETE**

```bash
# ✅ IMPLEMENTED: Unified Clerk architecture (December 2024)
# Status: Production-ready, replaces dual authentication system

# ✅ Components implemented:
# - components/auth/ChildSignIn.tsx: Username/PIN login via Clerk
# - components/auth/ParentOnboarding.tsx: 4-step account creation wizard
# - app/onboarding/page.tsx: Parent registration flow
# - app/sign-in/page.tsx: Parent Clerk authentication
# - app/onboarding/success/page.tsx: Setup completion page

# ✅ API endpoints:
# - app/api/auth/create-child/route.ts: Creates child Clerk accounts

# ✅ Database schema:
# - New ChildAccount model with Clerk user IDs
# - Updated Parent model with dashboard PIN support
# - Migration to unified Clerk-based architecture

# ✅ Security features:
# - COPPA-compliant parent-controlled child account creation
# - Proper Clerk session management (no localStorage tokens)
# - Username/PIN authentication for children
# - Parent dashboard PIN protection
```

## Core Chat System (Week 3-4)

### 💬 Chat Infrastructure

```bash
# Task: Create chat message API endpoint
# File: app/api/chat/message/route.ts
# Input: { message: string, childId: string, sessionId: string }
# Output: { response: string, audioUrl?: string, safetyLevel: number }

# Task: Build AI service layer
# File: lib/ai.ts
# Functions: generateResponse(), adaptToAge(), validateSafety()
# Integrations: OpenAI GPT-4, Anthropic Claude with fallback

# Task: Implement dual-layer safety system
# File: lib/safety.ts
# Functions: analyzeInput(), validateOutput(), triggerEscalation()
# Rules: Level 1-3 escalation, keyword detection, pattern analysis
```

### 🎭 Persona System

```bash
# Task: Create persona manager
# File: lib/personas.ts
# Personas: friendly-raccoon, wise-jellyfish, chill-robot
# Functions: getPersonaResponse(), getVoiceSettings(), adaptToPersona()

# Task: Build persona selector component
# File: components/chat/PersonaSelector.tsx
# Props: onSelect, selectedPersona
# Features: Character previews, sample interactions
```

### 🎯 Chat Interface

```bash
# Task: Create main chat container
# File: components/chat/ChatContainer.tsx
# Features: Message display, input handling, safety monitoring
# State: Zustand store for conversation state

# Task: Build message bubble component
# File: components/chat/MessageBubble.tsx
# Props: message, persona, isChild, showTimestamp
# Features: Persona styling, audio playback, animations

# ✅ IMPLEMENTED: Authentication components complete
# - components/auth/ChildSignIn.tsx: Username/PIN with Clerk integration
# - Proper validation, error handling, and security measures
```

## Safety & Moderation (Week 5-6)

### 🚨 Safety Escalation

```bash
# Task: Build escalation API endpoint
# File: app/api/safety/escalate/route.ts
# Input: { level: 1|2|3, content: string, childId: string }
# Actions: Parent notification, moderator alert, conversation suspension

# Task: Create safety event logging
# File: lib/safety-logger.ts
# Functions: logEvent(), updateEscalation(), notifyModerator()
# Storage: PostgreSQL safety_events table

# Task: Implement parent notification system
# File: lib/notifications.ts
# Channels: Email (Resend), SMS, push notifications
# Templates: Level-specific alerts, weekly summaries
```

### 👥 Human Moderation

```bash
# Task: Create moderation queue API
# File: app/api/moderation/queue/route.ts
# Features: Priority sorting, claim assignment, decision recording

# Task: Build moderator dashboard
# File: app/(moderation)/queue/page.tsx
# Features: Event review, decision making, escalation
# Auth: Separate moderator authentication system
```

## Parent Dashboard (Week 7-8)

### 🔐 Post-Auth Parent Dashboard Access **NEXT PRIORITY**

```bash
# Task: Implement post-authentication parent dashboard access
# File: app/parent/page.tsx (already created, needs enhancement)
# Auth Strategy: PIN or OAuth-protected access from any logged-in session
#
# Features:
# - PIN verification for sensitive operations (delete data, account settings)
# - OAuth verification option for enhanced security
# - Child account management and oversight
# - Safety alerts and moderation controls
# - Conversation history access with privacy controls
#
# Components to create/enhance:
# - components/parent/PinVerification.tsx: PIN entry with attempts limiting
# - components/parent/DashboardAccess.tsx: Auth choice (PIN vs OAuth)
# - app/api/parent/verify-access/route.ts: Dual verification endpoint
#
# Security requirements:
# - Rate limiting on PIN attempts
# - Session management for dashboard access
# - Audit logging for all parent actions
# - COPPA compliance for child data access
```

### 📊 Parent Interface

```bash
# Task: Create parent dashboard overview
# File: app/(parent)/dashboard/page.tsx
# Data: Child profile management, activity summaries, recent alerts, mood trends
# Components: ChildProfileCreator, ActivityCard, AlertCenter, MoodChart

# Task: Build alert management system
# File: app/(parent)/alerts/page.tsx
# Features: Alert filtering, batch actions, transcript access
# Permissions: Visibility level controls

# Task: Implement weekly summary generation
# File: lib/summary-generator.ts
# Content: Session counts, mood analysis, topic breakdown
# Delivery: Automated email via Resend
```

## Voice Integration (Week 9-10)

### 🎵 Voice Features

```bash
# Task: Integrate Cartesia TTS
# File: lib/voice.ts
# Functions: synthesizeSpeech(), getPersonaVoice(), optimizeForChild()
# Caching: Audio file storage and retrieval

# Task: Create voice input component
# File: components/chat/VoiceInput.tsx
# Features: Recording, waveform display, speech-to-text
# Validation: Audio quality checks, content filtering

# Task: Add voice settings management
# File: components/chat/VoiceSettings.tsx
# Controls: Volume, speed, voice selection per persona
```

## Advanced Features (Week 11-12)

### 🌙 Whisper Mode

```bash
# Task: Create Whisper Mode interface
# File: app/(chat)/whisper/page.tsx
# Features: Calming colors, reduced animations, gentle prompts
# Triggers: Emotional distress detection, manual activation

# Task: Implement mode transition animations
# File: components/animations/WhisperModeTransition.tsx
# Effects: Smooth color transitions, gentle visual cues
```

### 🧠 Memory System

```bash
# Task: Build child memory service
# File: lib/memory.ts
# Functions: storeMemory(), recallMemory(), updateEmotionalPattern()
# Types: Persona preferences, conversation context, emotional patterns

# Task: Create conversation context manager
# File: lib/conversation-context.ts
# Features: Session continuity, topic tracking, emotional state
```

## Testing & Validation (Week 13-14)

### 🧪 Safety Testing

```bash
# Task: Create safety test suite
# File: tests/safety/escalation.test.ts
# Scenarios: 100 age-inappropriate inputs, self-harm indicators
# Target: 95%+ accuracy, zero false negatives

# Task: Build end-to-end chat tests
# File: tests/e2e/chat-flow.spec.ts
# Flows: PIN login → chat → safety validation → parent notification
# Tools: Playwright for browser automation
```

### 📊 Performance Testing

```bash
# Task: Create load testing suite
# File: tests/performance/load.test.ts
# Targets: <2s response time, <10s safety processing
# Tools: Artillery.js for API load testing

# Task: Implement safety accuracy monitoring
# File: lib/safety-metrics.ts
# Tracking: False positive rate, escalation accuracy
# Alerts: Performance degradation notifications
```

## Production Setup (Week 15-16)

### 🚀 Deployment

```bash
# Task: Configure Vercel deployment
# File: vercel.json
# Settings: Build optimization, function timeouts, environment variables

# Task: Set up production monitoring
# File: lib/monitoring.ts
# Tools: Sentry error tracking, Vercel Analytics
# Alerts: Safety system failures, API errors

# Task: Create health check endpoints
# File: app/api/health/route.ts
# Checks: Database connection, AI services, safety system
# Monitoring: Uptime tracking, performance metrics
```

### 🔒 Security Hardening

```bash
# Task: Implement rate limiting
# File: lib/rate-limit.ts
# Limits: Chat messages, PIN attempts, API calls
# Storage: Redis or memory-based limiting

# Task: Add input validation middleware
# File: lib/validation.ts
# Schemas: Zod validation for all API inputs
# Sanitization: XSS prevention, SQL injection protection
```

## Dependencies & Order

```bash
# Critical Path:
1. Project Setup → Database Setup → Auth Foundation
2. Auth Foundation → Chat Infrastructure → Safety System
3. Safety System → Parent Dashboard → Moderation
4. Chat Infrastructure → Voice Integration → Advanced Features
5. All Core → Testing & Validation → Production Setup

# Parallel Development:
- Voice Integration can develop alongside Advanced Features
- Parent Dashboard can develop alongside Moderation
- Testing can begin once Chat Infrastructure is complete
```

## Validation Checkpoints

```bash
# Week 4: Core chat system functional
- PIN auth working
- Basic chat with safety validation
- Persona responses implemented

# Week 8: Safety system complete
- All escalation levels functional
- Parent notifications working
- Moderation queue operational

# Week 12: Feature complete
- Voice integration working
- Advanced features implemented
- Memory system functional

# Week 16: Production ready
- All tests passing (95%+ safety accuracy)
- Performance targets met (<2s response)
- Security hardening complete
```
