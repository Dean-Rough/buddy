# System Architecture - Onda AI Chat Platform

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

#### Child Interface (`/app/(chat)/`)

- **Primary Chat View**: Simplified interface with persona selection
- **Voice Input/Output**: Cartesia TTS integration with visual feedback
- **Persona Characters**: 3-5 pre-designed characters (raccoon, robot, jellyfish)
- **Chat Modes**: Normal, Coach, Whisper (calming interactions)
- **Human Typing Animation**: Masks safety processing latency
- **PIN Authentication**: 4-digit PIN entry with visual feedback

#### Parent Dashboard (`/app/(parent)/`)

- **Weekly Summaries**: Automated email digest with mood trends
- **Real-time Alerts**: Level 2/3 escalation notifications
- **Visibility Controls**: Stealth/Highlights/Full access modes
- **Data Management**: Export/delete conversation history
- **Escalation Settings**: Configure alert recipients and thresholds

### 2. Authentication & Authorization (`/app/(auth)/`)

#### Two-Tier Clerk Integration

- **Parent Authentication**: Full Clerk accounts with email/password and MFA
- **Child Sub-Profiles**: Managed under parent accounts, not independent Clerk users
- **PIN Access System**: 4-digit PINs for child profile access (COPPA compliant)
- **Session Management**: Secure session handling with parent-controlled privacy boundaries
- **Legal Data Ownership**: All child data legally belongs to parent account

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

#### Layer 1: Primary Chat Agent

- **Function**: Main conversational AI with personality and memory
- **Providers**: OpenAI GPT-4 or Anthropic Claude via proxy
- **Context**: Child's age, persona, conversation history, emotional state
- **Output**: Age-appropriate, empathetic responses with persona consistency

#### Layer 2: Real-time Safety Monitor

- **Function**: Content scanning and safety validation
- **Processing**: Every input/output analyzed before delivery
- **Triggers**: Keyword detection, emotional distress patterns, inappropriate content
- **Actions**: Block/edit responses, trigger escalations, log incidents

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

### Response Time Targets

- **Normal Chat**: <2 seconds end-to-end
- **Safety Processing**: <5 seconds with animation coverage
- **Escalation Alerts**: <60 seconds for parent notification
- **Voice Processing**: <3 seconds for TTS generation

### Scaling Strategy

- **Database**: NeonDB autoscaling with read replicas
- **API**: Vercel serverless with automatic scaling
- **AI**: Multiple provider endpoints for load distribution
- **Static Assets**: CDN distribution for global performance

### Failure Modes & Recovery

- **AI Downtime**: Graceful degradation with maintenance message
- **Safety Failure**: Immediate conversation suspension + human alert
- **Database Issues**: Temporary memory loss with service continuation
- **Network Issues**: Offline mode with sync on reconnection
