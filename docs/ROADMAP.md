# AI Agent Build Tasks - Buddy Platform

## Foundation (Week 1-2)

### 🔧 Project Setup
```bash
# Task: Initialize Next.js project with TypeScript
mkdir buddy && cd buddy
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

### 🔐 Authentication Foundation
```bash
# Task: Configure Clerk for Next.js 14
# File: middleware.ts
# Content: Protect /parent routes, allow /pin and /chat

# Task: Create Clerk webhook handler
# File: app/api/webhooks/clerk/route.ts
# Content: Sync parent accounts to database

# Task: Build PIN authentication service
# File: lib/auth.ts
# Functions: verifyPin(), createChildSession(), validateSession()
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

# Task: Create PIN entry component
# File: components/auth/PinEntry.tsx
# Features: 4-digit input, visual feedback, attempt limiting
# Validation: bcrypt hash comparison, rate limiting
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

### 📊 Parent Interface
```bash
# Task: Create parent dashboard overview
# File: app/(parent)/dashboard/page.tsx
# Data: Child activity summaries, recent alerts, mood trends
# Components: ActivityCard, AlertCenter, MoodChart

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