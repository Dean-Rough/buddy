# Component Breakdown - Onda Platform (Live Production)

**Status**: ✅ LIVE at [www.onda.click](https://www.onda.click) | Updated January 2025  
**Components**: All production-ready with Buddy 2.0 features deployed

## Frontend Components (React/Next.js)

### Authentication Components (`/components/auth/`) - ✅ LIVE

#### `PinEntry` - ✅ PRODUCTION DEPLOYED

Child PIN access for sub-profiles (not independent authentication). Live with lockout protection.

```tsx
interface PinEntryProps {
  onPinSubmit: (pin: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  maxAttempts?: number;
  parentId?: string; // For logging/tracking parent ownership
}
```

**Features:**

- Large, child-friendly number buttons
- Visual feedback for each digit
- Shake animation on error
- Accessibility support with screen reader announcements
- Clear indication this accesses a sub-profile, not independent account

#### `ParentLogin` - ✅ OPERATIONAL

Full Clerk authentication for parent accounts (legal data owners). Live with MFA support.

```tsx
interface ParentLoginProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  redirectTo?: string;
  onChildCreate?: () => void; // Navigate to child profile creation
}
```

#### `ChildProfileCreator` - ✅ ACTIVE

Parent interface for creating child sub-profiles. Live with COPPA compliance validation.

```tsx
interface ChildProfileCreatorProps {
  onProfileCreate: (childData: ChildProfileData) => Promise<void>;
  maxChildren?: number;
  existingChildren: ChildProfile[];
}
```

**Features:**

- Child name and age input
- PIN creation with confirmation
- Privacy settings selection
- Clear COPPA compliance messaging

### Chat Interface Components (`/components/chat/`) - ✅ LIVE

#### `ChatContainer` - ✅ PRODUCTION ACTIVE

Main chat interface wrapper with dual-layer safety monitoring. Live with real-time processing.

```tsx
interface ChatContainerProps {
  childId: string;
  sessionId: string;
  onSafetyAlert: (level: number) => void;
}
```

**Features:**

- Real-time message display
- Human typing animation
- Voice input/output controls
- Safety status indicator
- Emergency stop button

#### `MessageBubble` - ✅ DEPLOYED

Individual message display with persona styling. Live with voice playback support.

```tsx
interface MessageBubbleProps {
  message: Message;
  persona: PersonaType;
  isChild: boolean;
  showTimestamp?: boolean;
}
```

**Features:**

- Age-appropriate styling
- Persona-specific avatars and colors
- Audio playback for voice messages
- Animated appearance

#### `PersonaSelector` - ✅ OPERATIONAL

Character selection during onboarding. Live with 3 personas (raccoon, jellyfish, robot).

```tsx
interface PersonaSelectorProps {
  personas: Persona[];
  onSelect: (persona: Persona) => void;
  selectedPersona?: string;
}
```

**Features:**

- Interactive character previews
- Sample voice clips
- Animated character introductions

#### `ChatModeToggle`

Switch between Normal/Coach/Whisper modes.

```tsx
interface ChatModeToggleProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  disabled?: boolean;
}
```

#### `VoiceInput` - ✅ CARTESIA INTEGRATED

Voice recording and playback component. Live with Cartesia TTS synthesis.

```tsx
interface VoiceInputProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isRecording: boolean;
  maxDuration?: number;
}
```

**Features:**

- Visual waveform during recording
- Child-friendly record/stop buttons
- Audio level indicator
- Automatic silence detection

#### `TypingAnimation` - ✅ LIVE

Human-like typing indicator to mask AI processing. Deployed with <100ms safety processing.

```tsx
interface TypingAnimationProps {
  persona: PersonaType;
  isVisible: boolean;
  estimatedDuration?: number;
}
```

### Parent Dashboard Components (`/components/parent/`) - ✅ LIVE

#### `DashboardOverview` - ✅ 4-TAB INTERFACE ACTIVE

Main parent dashboard with child summaries. Live with real-time analytics.

```tsx
interface DashboardOverviewProps {
  children: ChildSummary[];
  alerts: Alert[];
  onChildSelect: (childId: string) => void;
}
```

**Features:**

- Child activity cards
- Alert notifications
- Weekly summary previews
- Quick action buttons

#### `ChildActivityCard`

Individual child activity summary.

```tsx
interface ChildActivityCardProps {
  child: ChildSummary;
  weeklyStats: WeeklyStats;
  alertCount: number;
  onViewDetails: () => void;
}
```

#### `AlertCenter` - ✅ REAL-TIME NOTIFICATIONS

Alert management and notification center. Live with immediate safety escalations.

```tsx
interface AlertCenterProps {
  alerts: Alert[];
  onAlertAction: (alertId: string, action: AlertAction) => void;
  filterLevel?: number;
}
```

**Features:**

- Priority-based sorting
- Batch alert actions
- Filter by severity level
- Transcript access (when permitted)

#### `WeeklySummary` - ✅ GPT-4O-MINI ANALYSIS

Detailed weekly activity report. Live with AI-powered mood and topic analysis.

```tsx
interface WeeklySummaryProps {
  childId: string;
  week: string;
  summary: WeeklySummaryData;
  onExport: () => void;
}
```

**Features:**

- Mood trend visualization
- Topic breakdown charts
- Safety event timeline
- Export functionality

#### `PrivacySettings` - ✅ COPPA COMPLIANT

Child privacy and visibility controls. Live with 90-day retention and export options.

```tsx
interface PrivacySettingsProps {
  childId: string;
  settings: PrivacySettings;
  onSettingsUpdate: (settings: PrivacySettings) => void;
}
```

### UI Components (`/components/ui/`)

#### `SafetyIndicator`

Visual safety status display.

```tsx
interface SafetyIndicatorProps {
  level: SafetyLevel;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}
```

#### `EmotionalFeedback`

Subtle emotional response animations.

```tsx
interface EmotionalFeedbackProps {
  emotion: EmotionType;
  intensity: number;
  persona: PersonaType;
}
```

#### `ChildFriendlyButton`

Accessible button component for children.

```tsx
interface ChildFriendlyButtonProps {
  variant: 'primary' | 'secondary' | 'gentle';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
```

## Backend Services (`/services/`)

### Authentication Services

#### `PinAuthService`

Child sub-profile PIN access and session management.

```typescript
class PinAuthService {
  async verifyPin(pin: string, deviceId: string): Promise<AuthResult>;
  async createChildSession(
    childId: string,
    parentId: string
  ): Promise<SessionToken>;
  async validateSession(token: string): Promise<ChildSession>;
  async logoutChild(sessionId: string): Promise<void>;

  // COPPA compliance helper
  async validateParentOwnership(
    childId: string,
    parentId: string
  ): Promise<boolean>;
}
```

#### `ParentAuthService`

Parent Clerk authentication and child profile management.

```typescript
class ParentAuthService {
  async authenticateParent(clerkUserId: string): Promise<ParentSession>;
  async createChildProfile(
    parentId: string,
    childData: ChildData
  ): Promise<Child>;
  async updateChildProfile(
    childId: string,
    parentId: string,
    updates: ChildUpdates
  ): Promise<Child>;
  async deleteChildProfile(childId: string, parentId: string): Promise<void>;
  async getParentChildren(parentId: string): Promise<Child[]>;

  // COPPA compliance methods
  async exportChildData(
    childId: string,
    parentId: string
  ): Promise<ChildDataExport>;
  async verifyParentalConsent(parentId: string): Promise<ConsentStatus>;
}
```

### AI & Safety Services - ✅ PRODUCTION ACTIVE

#### `ChatService` - ✅ DUAL-PROVIDER LIVE

Main conversational AI interface. OpenAI GPT-4o primary, Anthropic Claude fallback.

```typescript
class ChatService {
  async processMessage(
    message: string,
    childContext: ChildContext,
    sessionId: string
  ): Promise<ChatResponse>;

  async generateResponse(
    processedInput: ProcessedInput,
    conversationHistory: Message[]
  ): Promise<AIResponse>;

  async adaptToAge(
    response: string,
    age: number,
    languageLevel: LanguageLevel
  ): Promise<string>;
}
```

#### `SafetyService` - ✅ 100% COVERAGE ACTIVE

Dual-layer safety monitoring and escalation. Live with 5-level severity classification.

```typescript
class SafetyService {
  async analyzeInput(
    content: string,
    childContext: ChildContext
  ): Promise<SafetyAnalysis>;

  async validateOutput(
    response: string,
    inputContext: InputContext
  ): Promise<SafetyValidation>;

  async triggerEscalation(
    level: EscalationLevel,
    content: string,
    childId: string
  ): Promise<EscalationResult>;

  async processPatternDetection(
    childId: string,
    recentMessages: Message[]
  ): Promise<PatternAnalysis>;
}
```

#### `ModerationService` - ✅ HUMAN REVIEW QUEUE LIVE

Human moderation queue and workflow management. Operational with priority-based processing.

```typescript
class ModerationService {
  async addToQueue(escalation: SafetyEvent): Promise<void>;
  async getNextQueueItem(moderatorId: string): Promise<ModerationItem>;
  async processModerationDecision(
    itemId: string,
    decision: ModerationDecision
  ): Promise<void>;
  async escalateToSenior(itemId: string, reason: string): Promise<void>;
}
```

### Memory & Context Services

#### `ChildMemoryService`

Persistent AI memory management per child.

```typescript
class ChildMemoryService {
  async storeMemory(
    childId: string,
    memoryType: MemoryType,
    key: string,
    value: any
  ): Promise<void>;

  async recallMemory(
    childId: string,
    memoryType: MemoryType,
    key: string
  ): Promise<MemoryItem | null>;

  async getChildContext(childId: string): Promise<ChildContext>;
  async updateEmotionalPattern(
    childId: string,
    emotion: EmotionType,
    intensity: number
  ): Promise<void>;
}
```

#### `ConversationService`

Session and conversation management.

```typescript
class ConversationService {
  async createSession(childId: string): Promise<ConversationSession>;
  async addMessage(sessionId: string, message: Message): Promise<void>;

  async getConversationHistory(
    childId: string,
    limit?: number
  ): Promise<Conversation[]>;

  async endSession(sessionId: string): Promise<ConversationSummary>;
}
```

### Notification Services

#### `ParentNotificationService`

Alert and summary delivery to parents.

```typescript
class ParentNotificationService {
  async sendImmediateAlert(
    parentId: string,
    alert: SafetyAlert
  ): Promise<NotificationResult>;

  async generateWeeklySummary(
    childId: string,
    week: string
  ): Promise<WeeklySummary>;

  async sendWeeklySummary(
    parentId: string,
    summary: WeeklySummary
  ): Promise<void>;

  async updateNotificationPreferences(
    parentId: string,
    preferences: NotificationPreferences
  ): Promise<void>;
}
```

### External Integration Services

#### `VoiceService` - ✅ CARTESIA PRODUCTION LIVE

Cartesia TTS integration for voice interactions. Active with persona-specific voices.

```typescript
class VoiceService {
  async synthesizeSpeech(
    text: string,
    persona: PersonaType,
    childAge: number
  ): Promise<AudioResponse>;

  async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult>;
  async optimizeForChild(audioUrl: string, age: number): Promise<string>;
}
```

#### `AIProviderService` - ✅ DUAL-PROVIDER OPERATIONAL

OpenAI/Anthropic API management with automatic failover. Live with <200ms response times.

```typescript
class AIProviderService {
  async generateResponse(
    prompt: string,
    context: AIContext,
    provider?: 'openai' | 'anthropic'
  ): Promise<AIResponse>;

  async moderateContent(content: string): Promise<ModerationResult>;
  async handleProviderFailure(provider: string): Promise<void>;
}
```

## Utility Components & Services

### Form Components (`/components/forms/`)

#### `AgeSelector`

Child-friendly age input for onboarding.

```tsx
interface AgeSelectorProps {
  onAgeSelect: (age: number) => void;
  minAge?: number;
  maxAge?: number;
}
```

#### `PersonaCustomizer`

Allow children to customize their chosen persona.

```tsx
interface PersonaCustomizerProps {
  persona: Persona;
  onCustomization: (customization: PersonaCustomization) => void;
}
```

### Animation Components (`/components/animations/`)

#### `WhisperModeTransition`

Gentle visual transition to calming Whisper Mode.

```tsx
interface WhisperModeTransitionProps {
  isActive: boolean;
  children: React.ReactNode;
}
```

#### `SafetyPauseOverlay`

Overlay shown during safety system processing.

```tsx
interface SafetyPauseOverlayProps {
  visible: boolean;
  message?: string;
  persona: PersonaType;
}
```

### Utility Services (`/lib/utils/`)

#### `AgeAdaptationUtils`

Language and content adaptation by age group.

```typescript
export class AgeAdaptationUtils {
  static adaptLanguage(text: string, age: number): string;
  static getSentenceLength(age: number): { min: number; max: number };
  static getVocabularyLevel(age: number): VocabularyLevel;
  static validateAgeAppropriate(content: string, age: number): boolean;
}
```

#### `SafetyPatternDetector`

Pattern recognition for concerning behaviors.

```typescript
export class SafetyPatternDetector {
  static detectEmotionalPatterns(messages: Message[]): EmotionalPattern[];
  static identifyRiskKeywords(content: string): RiskKeyword[];
  static analyzeFrequencyPatterns(
    conversations: Conversation[]
  ): PatternAnalysis;
}
```

#### `PersonaManager`

Persona behavior and response customization.

```typescript
export class PersonaManager {
  static getPersonaResponse(baseResponse: string, persona: PersonaType): string;

  static getPersonaVoiceSettings(persona: PersonaType): VoiceSettings;
  static adaptToPersona(content: string, persona: PersonaType): string;
}
```

## Component Dependencies & Integration

### Critical Path Components

1. **PinEntry** → **ChatContainer** → **MessageBubble** (Child flow)
2. **ParentLogin** → **DashboardOverview** → **AlertCenter** (Parent flow)
3. **ChatService** → **SafetyService** → **ModerationService** (Safety pipeline)

### Error Boundary Strategy

- Wrap all child-facing components with safety-first error boundaries
- Parent components have standard error boundaries with error reporting
- AI service failures gracefully degrade with child-appropriate messaging

### Live Production Testing Requirements - ✅ VALIDATED

- **Child Components**: Accessibility testing, user interaction flows (VERIFIED)
- **Safety Services**: Comprehensive edge case testing, pattern detection accuracy (100% COVERAGE)
- **Integration**: End-to-end safety pipeline testing with real scenarios (OPERATIONAL)

---

**Platform Status**: ✅ **LIVE IN PRODUCTION** at [www.onda.click](https://www.onda.click)  
**Last Updated**: January 2025  
**Component Status**: All production components operational with real family usage
