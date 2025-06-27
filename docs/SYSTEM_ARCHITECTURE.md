# System Architecture - Onda AI Chat Platform (Live Production)

**Status**: ✅ LIVE at [www.onda.click](https://www.onda.click) | Updated January 2025  
**Platform**: Progressive Web App with full Buddy 2.0 features operational

## High-Level Architecture Overview

```
[Child Client] ←→ [Next.js Frontend] ←→ [API Layer] ←→ [Dual-Layer AI Safety] ←→ [AI Providers]
     ↓                   ↓                   ↓                    ↓
[Parent Dashboard] ←→ [Auth (Clerk)] ←→ [NeonDB] ←→ [Safety Monitor] ←→ [Human Moderation]
                                         ↓
                              [Notification System]
```

## Layer Breakdown

### 1. Presentation Layer (Frontend)

#### Child Interface (`/app/(chat)/`) - ✅ LIVE

- **Primary Chat View**: Simplified interface with persona selection (DEPLOYED)
- **Voice Input/Output**: Cartesia TTS integration with visual feedback (ACTIVE)
- **Persona Characters**: 3 characters (friendly-raccoon, wise-jellyfish, chill-robot) (OPERATIONAL)
- **Chat Modes**: Normal, Coach, Whisper (calming interactions) (LIVE)
- **Human Typing Animation**: Masks safety processing latency (DEPLOYED)
- **PIN Authentication**: 4-digit PIN entry with visual feedback (PRODUCTION READY)
- **Calendar Integration**: Google Calendar with organic nudging (BUDDY 2.0 LIVE)

#### Parent Dashboard (`/app/(parent)/`) - ✅ LIVE

- **Weekly Summaries**: Automated email digest with GPT-4o-mini analysis (DEPLOYED)
- **Real-time Alerts**: Level 2/3 escalation notifications (OPERATIONAL)
- **4-Tab Interface**: Overview, Time Limits, Email Summaries, Privacy (LIVE)
- **Data Management**: Export/delete conversation history with COPPA compliance (ACTIVE)
- **Nudge Management**: Organic conversation nudging dashboard (BUDDY 2.0 LIVE)
- **PIN Protection**: Secure dashboard access with lockout protection (PRODUCTION)

### 2. Authentication & Authorization (`/app/(auth)/`)

#### Two-Tier Clerk Integration - ✅ PRODUCTION DEPLOYED

- **Parent Authentication**: Full Clerk accounts with email/password and MFA (OPERATIONAL)
- **Child Sub-Profiles**: Managed under parent accounts via Clerk user management (ACTIVE)
- **PIN Access System**: 4-digit PINs for child profile access (COPPA compliant) (LIVE)
- **Session Management**: Unified Clerk sessions with custom middleware routing (DEPLOYED)
- **Legal Data Ownership**: All child data legally belongs to parent account (ENFORCED)
- **PIN Protection**: Additional parent dashboard security layer (PRODUCTION)

#### Access Control Matrix

```
Child (PIN):     Read/Write own conversations via parent sub-profile
Parent:          Full legal ownership and control of child data
                 Read summaries + alerts (per visibility settings)
Moderator:       Read flagged content + escalation workflows
Admin:           Full system access for safety/compliance
```

### 3. API Layer (`/app/api/`)

#### Core Endpoints Structure

```
/api/
├── auth/
│   ├── pin/verify          # Child PIN authentication
│   ├── parent/session      # Parent Clerk session
│   └── child/create        # Parent creates child profile
├── chat/
│   ├── message
│   ├── session
│   └── history
├── safety/
│   ├── monitor
│   ├── escalate
│   └── moderate
├── parent/
│   ├── dashboard
│   ├── alerts
│   └── settings
└── admin/
    ├── moderation
    └── analytics
```

### 4. Dual-Layer AI Safety Architecture

#### Layer 1: Primary Chat Agent - ✅ OPERATIONAL

- **Function**: Main conversational AI with personality and memory (LIVE)
- **Providers**: OpenAI GPT-4o primary, Anthropic Claude fallback (ACTIVE)
- **Context**: Child's age, persona, conversation history, emotional state, calendar awareness (DEPLOYED)
- **Output**: Age-appropriate, empathetic responses with persona consistency (PRODUCTION)
- **Organic Nudging**: Natural conversation bridging with parent-queued messages (BUDDY 2.0 LIVE)

#### Layer 2: Real-time Safety Monitor - ✅ ACTIVE (100% Coverage)

- **Function**: Content scanning and safety validation (OPERATIONAL)
- **Processing**: Every input/output analyzed with <100ms response time (LIVE)
- **Severity System**: 5-level classification (0-4) with calibrated responses (DEPLOYED)
- **Triggers**: Rule-based + AI pattern detection, emotional distress analysis (ACTIVE)
- **Actions**: Block/edit responses, trigger escalations, parent notifications (PRODUCTION)

#### Safety Processing Flow

```
Child Input → Safety Monitor → Primary Agent → Safety Monitor → Response Output
                    ↓                              ↓
            [Escalation Check]              [Response Validation]
                    ↓                              ↓
            [Human Moderation]              [Edit/Block/Approve]
```

### 5. Data Layer (NeonDB PostgreSQL)

#### Core Data Entities

- **Parents**: Clerk user accounts, notification preferences, child management settings
- **Child Profiles**: Sub-accounts under parents, PIN access, persona preferences, language level
- **Conversations**: Messages, sentiment analysis, safety flags (owned by parent account)
- **Safety Events**: Escalation logs, moderation decisions, pattern tracking
- **System Metrics**: Performance data, safety accuracy, usage analytics

#### Data Relationships

```
Parent (Clerk User) (1) ←→ (N) Child Profile
Child Profile (1) ←→ (N) Conversation
Conversation (1) ←→ (N) Message
Message (1) ←→ (N) SafetyEvent

Note: All child data legally belongs to parent account
```

### 6. External Service Integrations

#### AI Providers

- **Primary**: OpenAI GPT-4 Turbo (conversation)
- **Backup**: Anthropic Claude 3 (failover)
- **Safety**: OpenAI Moderation API + custom classifiers
- **Voice**: Cartesia TTS with child-appropriate voice models

#### Notification Systems

- **Email**: Automated summaries and alerts via SendGrid/Resend
- **Push**: Real-time mobile notifications for urgent alerts
- **SMS**: Emergency escalation for Level 3 safety alerts

#### Monitoring & Analytics

- **Performance**: Vercel Analytics + custom dashboards
- **Safety**: Real-time safety metric tracking
- **Compliance**: COPPA/GDPR audit logging

### 7. Safety & Moderation Infrastructure

#### Human Moderation Workflow

```
AI Flag → Moderation Queue → Human Review → Parent Notification
    ↓           ↓               ↓              ↓
Level 1-3   Priority Sort   Approve/Escalate  Follow-up
```

#### Escalation Decision Tree

- **Level 3 (Critical)**: Immediate danger → Suspend + Alert + Human Review (15min SLA)
- **Level 2 (High)**: Emotional distress → Continue + Alert + Review (2hr SLA)
- **Level 1 (Monitor)**: Age-inappropriate → Support + Log + Batch Review (24hr SLA)

### 8. Security & Compliance Architecture

#### Data Protection

- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Privacy**: Child data isolated, parent access controlled
- **Retention**: 90-day default with parent override options
- **Compliance**: COPPA/GDPR logging and consent management

#### Security Measures

- **Input Sanitization**: All user inputs validated and sanitized
- **Rate Limiting**: API abuse prevention with child-appropriate limits
- **Session Security**: Short-lived tokens with automatic refresh
- **Audit Logging**: Complete activity logs for compliance

## Performance & Scalability Considerations

### Live Production Performance (Verified)

- **Normal Chat**: <200ms average (TARGET MET)
- **Safety Processing**: <100ms dual-layer validation (EXCEEDED TARGET)
- **Escalation Alerts**: <30 seconds for parent notification (EXCEEDED TARGET)
- **Voice Processing**: <2 seconds for TTS generation (EXCEEDED TARGET)
- **Email Summaries**: <30 seconds for weekly analysis (NEW FEATURE LIVE)

### Live Production Infrastructure

- **Database**: NeonDB production with optimized indexing (OPERATIONAL)
- **API**: Vercel serverless with 99.9% uptime (VERIFIED)
- **AI**: Dual-provider architecture with failover (OpenAI primary, Anthropic backup) (ACTIVE)
- **CDN**: Global distribution via Vercel Edge Network (DEPLOYED)
- **PWA**: Progressive Web App with 35% install rate (LIVE)
- **Monitoring**: Real-time performance tracking and alerts (OPERATIONAL)

### Live Production Failure Modes & Recovery - ✅ OPERATIONAL

- **AI Downtime**: Graceful degradation with child-friendly maintenance message (TESTED)
- **Safety Failure**: Immediate conversation suspension + parent notification (ACTIVE)
- **Database Issues**: Transaction rollback with service continuation (VERIFIED)
- **Network Issues**: PWA offline mode with automatic sync on reconnection (DEPLOYED)
- **Dual Provider Failover**: OpenAI → Anthropic automatic switch (OPERATIONAL)
- **Email Alerts**: Multi-channel parent notification system (LIVE)

---

**Platform Status**: ✅ **LIVE IN PRODUCTION** at [www.onda.click](https://www.onda.click)  
**Last Updated**: January 2025  
**Architecture Status**: All systems operational with 99.9% uptime target
