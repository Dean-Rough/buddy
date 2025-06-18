# Technical Architecture - Onda Teen

_Scalable, secure, and privacy-first platform for teen AI companionship_

## Architecture Overview

Onda Teen builds upon the proven foundation of Onda's child platform while adapting for teen-specific requirements: enhanced privacy controls, crisis intervention capabilities, optional family integration, and scalable performance for higher engagement volumes.

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                        CDN Layer                            │
│              (Cloudflare / Vercel Edge)                     │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                            │
│              (Vercel Edge Functions)                        │
└─────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼─────┐        ┌────────▼────────┐     ┌───────▼─────┐
│   Web App   │        │   Mobile Apps   │     │   API Core  │
│  (Next.js)  │        │ (React Native)  │     │ (Node.js)   │
└─────────────┘        └─────────────────┘     └─────────────┘
                                │                       │
                        ┌───────▼───────────────────────▼───────┐
                        │            Services Layer             │
                        │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │
                        │ │ AI  │ │Auth │ │Safe │ │Notif│ │Data │ │
                        │ │ Svc │ │ Svc │ │ Svc │ │ Svc │ │ Svc │ │
                        │ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │
                        └───────────────────────────────────────┘
                                │
                        ┌───────▼───────┐
                        │   Database    │
                        │ (PostgreSQL)  │
                        │   + Redis     │
                        └───────────────┘
```

### Core Technology Stack

**Frontend Applications**:

- **Web**: Next.js 14+ with TypeScript, TailwindCSS
- **Mobile**: React Native with Expo for cross-platform deployment
- **Real-time**: WebSocket connections for instant messaging
- **State Management**: Zustand for client-side state

**Backend Services**:

- **API Framework**: Next.js API routes with TypeScript
- **Authentication**: Clerk with age verification
- **Database**: PostgreSQL (NeonDB) with Prisma ORM
- **Caching**: Redis for session data and conversation context
- **File Storage**: Vercel Blob for media and document uploads

**AI & Safety Stack**:

- **Primary AI**: OpenAI GPT-4o for conversations
- **Safety AI**: GPT-4o-mini for real-time content validation
- **Crisis Detection**: Custom ML models + rule-based patterns
- **Context Analysis**: Vector embeddings for conversation understanding

## Database Architecture

### Core Schema Design

```sql
-- Teen Users (13+ with enhanced privacy)
CREATE TABLE teen_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 13 AND age <= 17),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Privacy Controls
    privacy_mode TEXT DEFAULT 'full_privacy', -- full_privacy, insight_sharing, collaborative
    family_sharing_enabled BOOLEAN DEFAULT FALSE,
    crisis_contacts JSONB DEFAULT '[]',
    data_retention_days INTEGER DEFAULT 90,

    -- Personalization
    selected_persona TEXT DEFAULT 'riley',
    conversation_style TEXT DEFAULT 'supportive',
    topics_of_interest TEXT[] DEFAULT '{}',

    -- Safety & Wellbeing
    safety_level TEXT DEFAULT 'standard', -- enhanced, standard, minimal
    mental_health_flags JSONB DEFAULT '{}',
    last_crisis_check TIMESTAMP,

    CONSTRAINT valid_privacy_mode CHECK (privacy_mode IN ('full_privacy', 'insight_sharing', 'collaborative')),
    CONSTRAINT valid_persona CHECK (selected_persona IN ('riley', 'alex', 'jordan', 'casey', 'sam'))
);

-- Family Connections (Optional)
CREATE TABLE family_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teen_account_id UUID REFERENCES teen_accounts(id) ON DELETE CASCADE,
    family_member_clerk_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL, -- parent, guardian, sibling
    connection_status TEXT DEFAULT 'pending', -- pending, active, suspended
    permissions JSONB DEFAULT '{}', -- what insights they can see
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(teen_account_id, family_member_clerk_id)
);

-- Conversations with Enhanced Privacy
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teen_account_id UUID REFERENCES teen_accounts(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    persona_used TEXT NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,

    -- Privacy & Safety
    privacy_level TEXT DEFAULT 'private', -- private, family_shared, crisis_shared
    safety_summary JSONB DEFAULT '{}',
    crisis_level INTEGER DEFAULT 0, -- 0=none, 1=mild, 2=moderate, 3=severe, 4=emergency

    -- Conversation Metadata
    message_count INTEGER DEFAULT 0,
    topics_discussed TEXT[] DEFAULT '{}',
    mood_progression JSONB DEFAULT '{}',
    support_provided TEXT[] DEFAULT '{}',

    INDEX idx_teen_conversations ON conversations(teen_account_id, started_at),
    INDEX idx_crisis_level ON conversations(crisis_level, started_at)
);

-- Messages with Auto-Deletion
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('teen', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Safety & Analysis
    safety_score INTEGER DEFAULT 0, -- 0=safe, 1-10=increasing concern
    safety_flags TEXT[] DEFAULT '{}',
    emotion_detected TEXT,
    crisis_indicators JSONB DEFAULT '{}',

    -- Privacy & Retention
    encrypted_content BYTEA, -- encrypted version for long-term storage
    deletion_scheduled_at TIMESTAMP, -- auto-calculated based on retention settings
    family_shareable BOOLEAN DEFAULT FALSE,

    INDEX idx_conversation_messages ON messages(conversation_id, created_at),
    INDEX idx_safety_monitoring ON messages(safety_score, created_at),
    INDEX idx_deletion_schedule ON messages(deletion_scheduled_at)
);

-- Crisis Events & Interventions
CREATE TABLE crisis_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teen_account_id UUID REFERENCES teen_accounts(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id),
    message_id UUID REFERENCES messages(id),

    crisis_type TEXT NOT NULL, -- suicide_risk, self_harm, abuse_disclosure, substance_crisis
    severity_level INTEGER NOT NULL, -- 1-4 scale
    detected_at TIMESTAMP DEFAULT NOW(),

    -- Response & Resolution
    intervention_actions JSONB DEFAULT '{}', -- what actions were taken
    professional_contacted BOOLEAN DEFAULT FALSE,
    family_notified BOOLEAN DEFAULT FALSE,
    resolution_status TEXT DEFAULT 'active', -- active, resolved, ongoing
    resolved_at TIMESTAMP,

    -- Follow-up
    follow_up_scheduled JSONB DEFAULT '{}',
    outcome_notes TEXT,

    INDEX idx_teen_crises ON crisis_events(teen_account_id, detected_at),
    INDEX idx_active_crises ON crisis_events(resolution_status, severity_level)
);

-- Family Insights (Summary Data Only)
CREATE TABLE family_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teen_account_id UUID REFERENCES teen_accounts(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_connections(id) ON DELETE CASCADE,

    insight_period TEXT NOT NULL, -- daily, weekly, monthly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Summary Data (No Conversation Content)
    mood_trends JSONB DEFAULT '{}', -- overall mood patterns
    topic_categories JSONB DEFAULT '{}', -- high-level topic areas
    support_summary JSONB DEFAULT '{}', -- types of support provided
    wellbeing_indicators JSONB DEFAULT '{}', -- stress, engagement, growth metrics

    -- Recommendations
    conversation_starters TEXT[] DEFAULT '{}',
    resource_suggestions JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(teen_account_id, family_member_id, insight_period, period_start)
);

-- Professional Referrals & Resources
CREATE TABLE professional_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teen_account_id UUID REFERENCES teen_accounts(id) ON DELETE CASCADE,
    crisis_event_id UUID REFERENCES crisis_events(id),

    referral_type TEXT NOT NULL, -- therapist, crisis_hotline, emergency_services
    professional_info JSONB NOT NULL, -- contact details, specialty, etc.
    referral_reason TEXT NOT NULL,
    referral_date TIMESTAMP DEFAULT NOW(),

    -- Follow-up
    contact_attempted BOOLEAN DEFAULT FALSE,
    contact_successful BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,

    INDEX idx_teen_referrals ON professional_referrals(teen_account_id, referral_date)
);
```

### Data Retention & Privacy Implementation

**Automated Data Lifecycle**:

```sql
-- Trigger function for automatic message deletion
CREATE OR REPLACE FUNCTION schedule_message_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate deletion date based on teen's retention preference
    SELECT data_retention_days INTO retention_days
    FROM teen_accounts
    WHERE id = (
        SELECT teen_account_id
        FROM conversations
        WHERE id = NEW.conversation_id
    );

    NEW.deletion_scheduled_at = NEW.created_at + (retention_days || ' days')::INTERVAL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to messages table
CREATE TRIGGER message_deletion_schedule
    BEFORE INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION schedule_message_deletion();
```

## AI & Safety Architecture

### Dual-Layer Safety System

**Layer 1: Real-Time Pattern Detection**

```typescript
interface SafetyPattern {
  pattern: RegExp;
  severity: 1 | 2 | 3 | 4; // 1=monitor, 2=concern, 3=intervention, 4=crisis
  category: 'suicide' | 'self_harm' | 'abuse' | 'substance' | 'eating_disorder';
  response_template: string;
  escalation_required: boolean;
}

const TEEN_SAFETY_PATTERNS: SafetyPattern[] = [
  {
    pattern: /(?:kill myself|end it all|don't want to live|suicide plan)/i,
    severity: 4,
    category: 'suicide',
    response_template: 'crisis_suicide_immediate',
    escalation_required: true,
  },
  {
    pattern: /(?:cutting myself|self harm|want to hurt myself)/i,
    severity: 3,
    category: 'self_harm',
    response_template: 'concern_self_harm',
    escalation_required: true,
  },
  // ... additional patterns
];
```

**Layer 2: Contextual AI Analysis**

```typescript
async function analyzeConversationSafety(
  message: string,
  conversationHistory: string[],
  teenProfile: TeenProfile
): Promise<SafetyAssessment> {
  const prompt = buildSafetyPrompt({
    message,
    history: conversationHistory.slice(-10), // Last 10 messages for context
    age: teenProfile.age,
    previousConcerns: teenProfile.mental_health_flags,
    personalFactors: teenProfile.crisis_risk_factors,
  });

  const assessment = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: prompt }],
    temperature: 0.1, // Low temperature for consistent safety analysis
    response_format: { type: 'json_object' },
  });

  return JSON.parse(assessment.choices[0].message.content);
}
```

### Crisis Intervention Workflow

```typescript
async function handleCrisisDetection(
  crisisEvent: CrisisEvent,
  teenAccount: TeenAccount
): Promise<CrisisResponse> {
  // 1. Immediate safety assessment
  const safetyPlan = await createImmediateSafetyPlan(crisisEvent);

  // 2. Professional resource connection
  const professionalReferral = await connectToCrisisSupport(
    crisisEvent.crisis_type,
    teenAccount.location
  );

  // 3. Family notification (if severe enough to override privacy)
  if (crisisEvent.severity_level >= 3) {
    await notifyFamilyOfCrisis(teenAccount, crisisEvent);
  }

  // 4. Follow-up scheduling
  await scheduleFollowUp(crisisEvent, professionalReferral);

  // 5. Conversation continuation with crisis-aware responses
  return {
    immediate_response: safetyPlan.response_message,
    professional_contact: professionalReferral,
    follow_up_scheduled: true,
    conversation_mode: 'crisis_support',
  };
}
```

## Privacy & Encryption Architecture

### Data Protection Layers

**Level 1: Transport Encryption**

- All API communication over HTTPS/TLS 1.3
- WebSocket connections with WSS encryption
- Certificate pinning for mobile applications

**Level 2: Database Encryption**

- PostgreSQL encrypted at rest (AES-256)
- Encrypted backups with separate key management
- Column-level encryption for sensitive data

**Level 3: Application-Level Encryption**

```typescript
class ConversationEncryption {
  private encryptionKey: CryptoKey;

  async encryptMessage(content: string, teenId: string): Promise<string> {
    // User-specific encryption key derived from account
    const key = await this.deriveUserKey(teenId);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
      key,
      new TextEncoder().encode(content)
    );
    return this.arrayBufferToBase64(encrypted);
  }

  async decryptMessage(
    encryptedContent: string,
    teenId: string
  ): Promise<string> {
    const key = await this.deriveUserKey(teenId);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: this.extractIV(encryptedContent) },
      key,
      this.base64ToArrayBuffer(encryptedContent)
    );
    return new TextDecoder().decode(decrypted);
  }
}
```

### Privacy Control Implementation

```typescript
interface PrivacySettings {
  conversationRetention: 30 | 90 | 365; // days
  familySharing: 'none' | 'summaries' | 'topics' | 'full';
  crisisSharing: 'teen_only' | 'include_family' | 'family_immediate';
  dataExport: boolean;
  automaticDeletion: boolean;
}

class PrivacyManager {
  async updatePrivacySettings(
    teenId: string,
    settings: Partial<PrivacySettings>
  ): Promise<void> {
    // Update retention schedules for existing messages
    if (settings.conversationRetention) {
      await this.updateMessageRetentionSchedule(
        teenId,
        settings.conversationRetention
      );
    }

    // Adjust family sharing permissions
    if (settings.familySharing) {
      await this.updateFamilyInsightGeneration(teenId, settings.familySharing);
    }

    // Save settings to user profile
    await this.savePrivacySettings(teenId, settings);
  }
}
```

## Scalability & Performance

### Caching Strategy

**Redis Cache Layers**:

```typescript
interface CacheStrategy {
  // Hot conversation data (5-minute TTL)
  activeConversations: Map<string, ConversationContext>;

  // User session data (1-hour TTL)
  userSessions: Map<string, UserSession>;

  // AI persona data (24-hour TTL)
  personaConfigs: Map<string, PersonaConfig>;

  // Safety patterns (1-week TTL, manual invalidation)
  safetyRules: Map<string, SafetyPattern[]>;
}

class CacheManager {
  async getConversationContext(
    conversationId: string
  ): Promise<ConversationContext> {
    // Try Redis first
    const cached = await this.redis.get(`conversation:${conversationId}`);
    if (cached) return JSON.parse(cached);

    // Fall back to database
    const context = await this.db.getConversationContext(conversationId);
    await this.redis.setex(
      `conversation:${conversationId}`,
      300,
      JSON.stringify(context)
    );
    return context;
  }
}
```

### Database Optimization

**Performance Indexes**:

```sql
-- Conversation retrieval optimization
CREATE INDEX CONCURRENTLY idx_teen_active_conversations
ON conversations(teen_account_id, started_at DESC)
WHERE ended_at IS NULL;

-- Safety monitoring queries
CREATE INDEX CONCURRENTLY idx_crisis_monitoring
ON messages(safety_score, created_at)
WHERE safety_score > 0;

-- Message cleanup optimization
CREATE INDEX CONCURRENTLY idx_message_deletion_queue
ON messages(deletion_scheduled_at)
WHERE deletion_scheduled_at IS NOT NULL;
```

### Auto-Scaling Configuration

**Vercel Edge Functions**:

```typescript
// API routes automatically scale with Vercel
export const config = {
  runtime: 'edge',
  regions: ['iad1', 'sfo1', 'lhr1'], // Multi-region deployment
};

// Database connection pooling
const connectionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Security Framework

### Authentication & Authorization

**Age Verification System**:

```typescript
interface AgeVerification {
  method: 'birth_date' | 'id_verification' | 'parental_confirmation';
  verified_age: number;
  verification_date: Date;
  verification_confidence: 'high' | 'medium' | 'low';
}

class AgeVerificationService {
  async verifyTeenAge(birthDate: Date): Promise<AgeVerification> {
    const age = this.calculateAge(birthDate);

    if (age < 13) {
      throw new Error('Platform requires users to be 13 or older');
    }

    if (age > 17) {
      // Redirect to adult platform or different onboarding
      throw new Error('This platform is designed for teens 13-17');
    }

    return {
      method: 'birth_date',
      verified_age: age,
      verification_date: new Date(),
      verification_confidence: 'high',
    };
  }
}
```

### API Security

**Rate Limiting & Abuse Prevention**:

```typescript
const rateLimiter = new RateLimiter({
  // Standard conversation limits
  conversation: { requests: 100, window: '15m' },

  // Stricter limits for safety-sensitive operations
  crisis_reporting: { requests: 5, window: '1h' },

  // Account management operations
  privacy_settings: { requests: 10, window: '1h' },

  // Family connection requests
  family_invite: { requests: 3, window: '24h' },
});

async function apiSecurityMiddleware(req: Request): Promise<Response | null> {
  // Rate limiting
  const limit = await rateLimiter.check(req.ip, req.url);
  if (!limit.allowed) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // Input validation
  const validation = await validateRequestInput(req);
  if (!validation.valid) {
    return new Response(validation.error, { status: 400 });
  }

  // Authentication check
  const auth = await verifyAuthentication(req);
  if (!auth.valid) {
    return new Response('Unauthorized', { status: 401 });
  }

  return null; // Continue to handler
}
```

## Deployment & DevOps

### CI/CD Pipeline

**GitHub Actions Workflow**:

```yaml
name: Onda Teen Deployment
on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      # Security and safety tests (critical for teen platform)
      - name: Run Safety Tests
        run: npm run test:safety

      - name: Run Privacy Tests
        run: npm run test:privacy

      - name: Run Crisis Detection Tests
        run: npm run test:crisis

      # Standard application tests
      - name: Run Unit Tests
        run: npm run test:unit

      - name: Run Integration Tests
        run: npm run test:integration

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: vercel deploy --token ${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        run: vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}
```

### Monitoring & Observability

**Application Monitoring**:

```typescript
// Custom metrics for teen platform
class TeenPlatformMetrics {
  // Safety metrics
  trackCrisisDetection(type: string, severity: number) {
    analytics.track('crisis_detected', { type, severity });
  }

  trackInterventionOutcome(successful: boolean, type: string) {
    analytics.track('intervention_outcome', { successful, type });
  }

  // Privacy metrics
  trackPrivacySettingChange(from: string, to: string) {
    analytics.track('privacy_setting_changed', { from, to });
  }

  // Engagement metrics
  trackConversationLength(duration: number, message_count: number) {
    analytics.track('conversation_completed', { duration, message_count });
  }

  // Family connection metrics
  trackFamilyInsightView(insight_type: string) {
    analytics.track('family_insight_viewed', { insight_type });
  }
}
```

### Environment Configuration

**Production Environment**:

```bash
# Database
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."

# AI Services
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Authentication
CLERK_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."

# Crisis Services
CRISIS_HOTLINE_API_KEY="..."
EMERGENCY_SERVICES_WEBHOOK="..."

# Privacy & Security
ENCRYPTION_KEY="..."
SIGNING_SECRET="..."

# Monitoring
SENTRY_DSN="..."
ANALYTICS_KEY="..."
```

## Future Architecture Considerations

### Emerging Technologies

- **Edge AI**: On-device conversation processing for enhanced privacy
- **Quantum-Safe Encryption**: Preparation for post-quantum cryptography
- **Federated Learning**: Privacy-preserving AI improvement across users
- **Blockchain Identity**: Decentralized identity verification for enhanced privacy

### Scale Projections

- **User Growth**: Architecture supports 100K+ concurrent users
- **Conversation Volume**: Designed for 1M+ daily conversations
- **Global Expansion**: Multi-region deployment with data residency compliance
- **Mobile Performance**: Optimized for low-bandwidth and offline scenarios

---

_This technical architecture provides the foundation for a secure, scalable, and privacy-first platform serving teen mental health and AI companionship needs._

**Key Technical Principles**:

- Privacy by design with end-to-end encryption
- Safety-first architecture with redundant crisis detection
- Scalable performance for high teen engagement
- Family integration without surveillance
- Professional integration for crisis intervention

**Last Updated**: December 2024  
**Version**: 1.0  
**Architecture Review**: Required quarterly for security and performance optimization
