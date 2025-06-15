# Dynamic Time Limits System Design

## Overview

A intelligent time management system that respects conversation quality while maintaining parent-set boundaries. Instead of abrupt cutoffs, the AI naturally winds down conversations like a real friend would.

## Core Concept

### Traditional Time Limits (BAD)

```
[TIMER EXPIRES]
❌ "Your time is up. Chat session ended."
❌ "Time limit reached. Please log out."
```

### Dynamic Time Limits (GOOD)

```
[TIMER APPROACHING + CONVERSATION ANALYSIS]
✅ "oh actually, I need to head off in a few mins - got a football match!
    but this has been such a good chat"
✅ "wait I'm supposed to tidy my room soon! mum will be mad lol.
    shall we wrap up?"
✅ "omg I just remembered I have a friend's birthday party later!
    need to get ready. one more thing though..."
```

## System Architecture

### 1. Conversation Importance Scoring

**High Importance (Allow Overrun):**

- Emotional distress or support needs
- Learning discussions (homework help, explaining concepts)
- Creative collaboration (storytelling, planning projects)
- Social problem solving (friendship issues, bullying)

**Medium Importance (Gentle Wind-Down):**

- General interests discussion (games, hobbies)
- Question and answer sessions
- Casual problem solving

**Low Importance (Natural Exit):**

- Repetitive questions
- Random silly chat
- Time-filling conversation

### 2. Natural Exit Reasons Library

**Age-Appropriate Activities (7-8 years):**

```json
{
  "morning": [
    "need to get ready for school!",
    "mum's making breakfast",
    "got to brush my teeth"
  ],
  "afternoon": [
    "going to the park with dad",
    "need to do my reading",
    "time for my snack"
  ],
  "evening": ["bath time soon!", "family movie night", "need to tidy my toys"]
}
```

**Age-Appropriate Activities (9-10 years):**

```json
{
  "weekday": [
    "got football practice",
    "need to finish my homework",
    "promised to help mum with dinner"
  ],
  "weekend": [
    "going to the cinema with family",
    "friend's birthday party",
    "need to clean my room"
  ]
}
```

**Age-Appropriate Activities (11-12 years):**

```json
{
  "school_time": [
    "got a test to revise for",
    "meeting friends at the park",
    "promised to walk the dog"
  ],
  "social": [
    "going to town with mates",
    "got a sleepover tonight",
    "family dinner out"
  ]
}
```

### 3. Wind-Down Conversation Flow

**Phase 1: Gentle Warning (5 mins before)**

- Only if conversation is low-medium importance
- Mentioned casually in natural response
- "oh btw, I'll probably need to head off soon"

**Phase 2: Preparation (2 mins before)**

- Start wrapping up current topic
- "actually, I should probably start finishing up soon"
- Give opportunity for "one more thing"

**Phase 3: Natural Exit**

- Use age-appropriate reason
- Acknowledge the conversation quality
- Suggest future continuation
- "this has been brilliant though! catch up soon?"

## Database Schema Changes

```sql
-- Add to ChildAccount table
ALTER TABLE "ChildAccount" ADD COLUMN "timeLimitMinutes" INTEGER DEFAULT 30;
ALTER TABLE "ChildAccount" ADD COLUMN "timeLimitStrictness" TEXT DEFAULT 'balanced'; -- flexible, balanced, strict

-- Add to Parent table
ALTER TABLE "Parent" ADD COLUMN "defaultTimeLimitMinutes" INTEGER DEFAULT 30;
ALTER TABLE "Parent" ADD COLUMN "defaultStrictness" TEXT DEFAULT 'balanced';
ALTER TABLE "Parent" ADD COLUMN "allowEmotionalOverrides" BOOLEAN DEFAULT true;

-- Session tracking
CREATE TABLE "ChatSession" (
  "id" TEXT NOT NULL,
  "childAccountId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endTime" TIMESTAMP(3),
  "plannedDuration" INTEGER NOT NULL, -- minutes
  "actualDuration" INTEGER, -- minutes
  "overrunReason" TEXT, -- emotional_support, learning, etc
  "importanceScore" DECIMAL(3,2), -- 0.00 to 1.00
  "naturalExit" BOOLEAN DEFAULT false,
  "exitReason" TEXT, -- the excuse used

  PRIMARY KEY ("id"),
  CONSTRAINT "ChatSession_childAccountId_fkey" FOREIGN KEY ("childAccountId") REFERENCES "ChildAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ChatSession_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
```

## Implementation Components

### 1. Conversation Analysis Engine

```typescript
// lib/time-limits/conversation-analyzer.ts
interface ConversationContext {
  importanceScore: number; // 0.0 - 1.0
  primaryTopics: string[];
  emotionalState: 'distressed' | 'excited' | 'learning' | 'casual';
  isRepetitive: boolean;
  hasOpenQuestions: boolean;
}

export function analyzeConversationImportance(
  messages: Message[],
  childAge: number
): ConversationContext;
```

### 2. Natural Exit Generator

```typescript
// lib/time-limits/exit-generator.ts
interface ExitContext {
  childAge: number;
  timeOfDay: string;
  dayOfWeek: string;
  conversationTone: string;
  isWeekend: boolean;
}

export function generateNaturalExit(
  context: ExitContext,
  warningLevel: 'gentle' | 'preparation' | 'final'
): string;
```

### 3. Time Limit Manager

```typescript
// lib/time-limits/time-manager.ts
export class TimeLimitManager {
  async checkTimeStatus(sessionId: string): Promise<TimeStatus>;
  async shouldWarnAboutTime(sessionId: string): Promise<boolean>;
  async shouldEndConversation(sessionId: string): Promise<boolean>;
  async requestOverride(sessionId: string, reason: string): Promise<boolean>;
}
```

## Integration Points

### 1. Chat Route Enhancement

```typescript
// app/api/chat/route.ts - Add time checking
const timeManager = new TimeLimitManager();
const timeStatus = await timeManager.checkTimeStatus(sessionId);

if (timeStatus.shouldWarn) {
  // Inject warning into AI response
  enhancedPrompt += `\n\nSUBTLE_TIME_WARNING: Mention casually that you'll need to head off soon`;
}

if (timeStatus.shouldEnd) {
  const conversationContext = analyzeConversationImportance(messages, childAge);

  if (conversationContext.importanceScore > 0.7) {
    // Allow override for important conversations
    await timeManager.requestOverride(
      sessionId,
      'high_importance_conversation'
    );
  } else {
    // Generate natural exit
    const exitMessage = generateNaturalExit(context, 'final');
    return NextResponse.json({ response: exitMessage, sessionEnded: true });
  }
}
```

### 2. Parent Dashboard Controls

```typescript
// components/parent/TimeLimitSettings.tsx
export function TimeLimitSettings({ childId }: { childId: string }) {
  return (
    <div className="time-limit-controls">
      <Slider
        label="Daily Chat Time"
        value={timeLimitMinutes}
        max={120}
        min={15}
      />

      <Select label="Strictness Level">
        <option value="flexible">Flexible (emotion-aware)</option>
        <option value="balanced">Balanced (moderate overrides)</option>
        <option value="strict">Strict (minimal overrides)</option>
      </Select>

      <Checkbox checked={allowEmotionalOverrides}>
        Allow extra time for emotional support
      </Checkbox>
    </div>
  );
}
```

## Example Conversation Flows

### Scenario 1: Casual Chat (Low Importance)

```
Child: "what's your favourite colour"
AI: "probably purple! it's so vibrant. what about you?"
[TIME WARNING TRIGGERED]
Child: "mine's blue like the ocean"
AI: "oh that's lovely! blue is so calming. actually, I should probably start wrapping up soon - got a friend's birthday party later! but blue's a great choice"
Child: "cool what present did you get them"
AI: "haha I'm still deciding! maybe something crafty. anyway, I really should head off and get ready now. this has been a lovely chat though! catch up again soon?"
```

### Scenario 2: Emotional Support (High Importance)

```
Child: "i'm really sad about my dog dying"
AI: "oh that's so heartbreaking, i'm really sorry. losing a pet is one of the hardest things"
[TIME WARNING TRIGGERED - BUT OVERRIDDEN DUE TO EMOTIONAL CONTENT]
Child: "he was my best friend for 8 years"
AI: "8 years is such a long time to have that special bond. want to tell me about your favourite memories with him?"
[CONVERSATION CONTINUES WITH EXTENDED TIME]
```

### Scenario 3: Learning Discussion (Medium-High Importance)

```
Child: "can you help me understand fractions"
AI: "absolutely! fractions are like cutting a pizza into pieces"
[15 MINUTES OF MATH HELP]
[TIME WARNING - GENTLE WIND DOWN]
AI: "you're getting really good at this! I think you've got the hang of it. oh actually, I promised to help my mum with dinner soon, but shall we do one more quick example before I go?"
```

## Success Metrics

### For Children:

- Natural conversation endings feel friendly, not abrupt
- No anxiety about sudden cutoffs
- Learning that conversations have natural end points

### For Parents:

- Time limits respected while maintaining quality
- Override notifications for emotional support
- Detailed session reports showing conversation importance

### For System:

- High accuracy in importance scoring (>85%)
- Low override request rate for casual chat (<10%)
- High parent satisfaction with natural endings (>90%)

This system transforms time limits from a rigid constraint into a collaborative conversation management tool that teaches healthy digital boundaries while preserving the magic of meaningful connections.
