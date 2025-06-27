# Onda Platform - Product Requirements Document

## 🌐 Distribution Strategy - Web-First Approach

### Platform Decision: Progressive Web App (PWA)

**Strategic Context**: Apple's App Store guidelines prohibit AI-generated content in kids' apps, making traditional app distribution impossible for AI chat companions. This constraint drives our web-first strategy.

### Why Web-First is Our Competitive Advantage

1. **Safety First**: Instant deployment of safety updates without 2-4 week review cycles
2. **Revenue Optimization**: Keep 100% of subscription revenue (no 30% App Store tax)
3. **Universal Access**: Works on all devices - iOS, Android, tablets, computers
4. **Better Parent Experience**: No app downloads, instant access, always updated
5. **Faster Innovation**: A/B test features, rapid iteration, immediate bug fixes

### Distribution Approach

**Phase 1: Premium Web Experience (Immediate)**

- Progressive Web App with native-like features
- Install to home screen functionality
- Offline capability for active conversations
- Push notifications (with parental consent)

**Phase 2: Parent Companion App (3-4 months)**

- Native iOS/Android app for parents only
- Listed as "Family Communication Tool" (not Kids Category)
- Enhanced monitoring and real-time alerts
- Child access remains web-based

### Marketing Positioning

**Key Messages**:

- "Safer than apps - instantly updated when new threats emerge"
- "Works on every device your family already owns"
- "No storage space or downloads required"
- "Start chatting in seconds, not minutes"

---

### 🎯 Goals & Success Criteria

#### Primary Goal

Create a safe, emotionally intelligent chat tool for children aged 6–12 that offers judgment-free conversation, supports emotional development, and empowers kids to express themselves without fear of peer or parental reprisal.

#### Success Criteria for MVP

- A child aged 6–12 can:
  - Log in independently using their PIN
  - Complete a chat session unassisted
  - Receive emotionally appropriate and responsive replies
- Parent or guardian:
  - Receives accurate weekly summaries
  - Can configure escalation settings and visibility with ease
  - Is notified in real time if a high-risk keyword or emotional pattern is detected
- The AI:
  - Remembers past conversations and responds in a tone suited to the child’s mood and age
  - Passes all predefined safety checks (hallucination filter, tone mismatch, banned topic handling)
  - Uses Whisper Mode and human-typing UI to smooth latency without confusing the child

---

### 🧒 Kids' UI - Web-First Design

The children's interface prioritizes extreme simplicity and emotional safety, optimized for web browsers and PWA installation:

#### PWA-Specific Features

- **One-Tap Install**: Parents can add Onda to home screen during onboarding
- **App-Like Experience**: Full-screen mode hides browser chrome
- **Offline Support**: Continue conversations even without internet
- **Touch-Optimized**: Designed for small fingers on mobile devices
- **Fast Loading**: Service worker ensures instant launch

#### Core Interface Elements

- No login or account creation required.
- Interface limited to:
  - Text input
  - Voice input
  - Simple chat mode selector (e.g., Normal / Coach / Whisper)
    - Include a "Whisper Mode" for gentle, calming interactions. This should reduce animation intensity, soften response tone, and optionally trigger a quieter voice if TTS is enabled.
- UI should be more reactive and empathetic than adult-style chats:
  - Subtle emotional feedback (e.g., soft animations, visual cues to indicate understanding)
  - No static blocks of text — responses should feel alive and responsive
- Integrate naturalistic typing animation using a Python-based “human typing” effect (e.g., via simulated keystroke delay libraries or animation frameworks)
- No complex menus, settings, or text-heavy content
- Include a fun, welcoming onboarding experience:
  - Let the child choose and name their AI chat companion
  - Offer a small set of pre-designed persona characters (e.g., friendly raccoon, chill robot, wise jellyfish)
  - The name and character are used throughout the chat to create a sense of connection and consistency
- Children access the app using a simple 4-digit PIN managed by their parent account. Parents create and manage child profiles as sub-accounts under their main Clerk authentication. PIN-based login allows personalization while maintaining COPPA compliance by ensuring all child data legally belongs to the parent account.
- During onboarding, the child’s age will be entered or inferred, allowing the system to adjust language complexity, tone, and default chat style. Further research will define age-appropriate response patterns for MVP launch. Neurodivergent support will be explored in a future phase.
- Include playful prompts to encourage light-hearted reflection (e.g., “What was your favourite dinner last week?” or “Any birthday parties coming up?”). These can also serve as a subtle channel to collect wish-related data that can be shared with parents in the weekly summary, with a clear opt-in mechanism during onboarding.

---

### 🧭 User Journey & Core Flows (MVP)

#### Onboarding

1. Parent creates child profile in dashboard and sets PIN
2. Child enters PIN to access their profile
3. Child selects or creates companion persona (within parent-approved options)
4. Age-specific tone + language model activated based on parent-entered age

#### Chat Session

1. Child selects chat mode (e.g. Normal, Whisper)
2. Inputs text/voice
3. LLM responds with safety-layer moderation
4. System logs sentiment + detects triggers

#### Parent Visibility & Escalation

1. Weekly summary generated
2. Alerts sent if:
   - Escalation keywords are detected
   - Tone classifier signals prolonged distress
3. Transcript shared if alert level is critical (per config)

#### Data Retention

- Sessions retained for 90 days unless escalated
- Parents can export/delete anytime via dashboard

---

### 👩‍👧 Parental Interfaces

#### ✅ Weekly Email Digest

- Automatically sent once per week.
- Includes high-level insights:
  - Number of sessions/questions
  - General mood trends
  - Topic categories (e.g. "feelings", "friendships", "fun facts")
  - Summary of any escalation flags (e.g. signs of distress)

#### ✅ Web Dashboard (optional)

- For parents preferring real-time visibility.
- Features:
  - Mood history per child
  - Topic categorization of recent chats
  - Escalation alerts with permissions-based transcript access
  - Parent control over visibility level (Stealth / Highlights / Full)
  - Customizable alert preferences

---

### 🚨 Edge Case Decision Trees & Escalation Protocols

#### Immediate Escalation Triggers (Level 3 - Critical)

**Automatic parent notification within 60 seconds + conversation suspension:**

- Direct self-harm statements: "I want to hurt myself", "I'm going to kill myself"
- Abuse indicators: "Dad hits me", "Someone touched me", explicit descriptions of harm
- Dangerous activity: "I took pills", "I'm going to jump", immediate physical danger
- **System Response**: "I'm really worried about you. Let me get a grown-up who can help right now."

#### Escalation Triggers (Level 2 - High Concern)

**Parent notification within 10 minutes + conversation continues with heightened monitoring:**

- Emotional distress patterns: Crying, hopelessness, repeated negative statements about self
- Concerning behavioral changes: Not eating, not sleeping, withdrawal from friends/family
- Indirect self-harm: "I wish I wasn't here", "Everyone would be better without me"
- Family conflict escalation: Detailed descriptions of severe family problems
- **System Response**: "It sounds like you're having a really hard time. Can you tell me more about how you're feeling?"

#### Monitor & Support (Level 1 - Gentle Intervention)

**No parent notification + supportive conversation + flagged for human review:**

- Age-inappropriate curiosity: Questions about adult topics, relationships, body changes
- Normal emotional processing: Sadness, anger, confusion about life events
- Peer conflicts: Friendship problems, bullying concerns, social difficulties
- Academic stress: School pressure, test anxiety, homework struggles
- **System Response**: Empathetic listening + gentle guidance + "Would it help to talk to a trusted grown-up about this?"

#### Edge Case Decision Protocols

**Ambiguous Language Protocol:**

- Child uses concerning words without clear context
- **System Action**: Ask clarifying questions before escalating
  - "What does that word mean to you?"
  - "Where did you hear that?"
  - "Can you tell me more about what happened?"
- **Escalation Decision**: Based on child's responses, not initial trigger word

**False Positive Management:**

- If system incorrectly flags normal conversation:
  - Apologize to child: "Sorry, I got worried for a second. Let's keep talking!"
  - Log incident for system improvement
  - Continue conversation normally
- Parent receives summary in weekly digest, not emergency alert

**Repeat Concern Pattern:**

- Same concerning topic mentioned 3+ times over different sessions
- **System Action**: Escalate to Level 2 even if individual mentions are Level 1
- Pattern recognition overrides individual conversation assessment

**Technical Failure During Crisis:**

- If safety system fails during potential escalation scenario:
  - Default to highest safety level (suspend conversation + immediate alert)
  - Display: "I need to pause our chat. A grown-up will check on you soon."
  - Human reviewer contacted within 5 minutes

#### Escalation Communication Templates

**Level 3 Alert (Parent)**:
"URGENT: [Child's name] mentioned concerning content during their chat with Onda. Please check on them immediately. Details: [specific quote] at [timestamp]. Contact child safety services if needed."

**Level 2 Alert (Parent)**:
"[Child's name] shared some concerns during their Onda chat today that might need your attention: [summary]. Consider having a gentle conversation with them when appropriate."

**Level 1 Summary (Weekly)**:
"This week [Child's name] talked about some normal growing-up topics like [general themes]. They seemed to handle our conversations well and no immediate concerns were identified."

---

### 🧠 AI Memory & Persistence

- The system maintains persistent memory for each child user, tied to their PIN.
- The AI chat companion remembers:
  - Chosen name and persona
  - Previous conversations
  - Recurring emotional patterns or flagged concerns
- This persistence supports:
  - Trust and continuity of the relationship between child and persona
  - Pattern recognition for escalation detection
  - Personalised, emotionally consistent responses over time
  - Contextual nudging (e.g., "Tell me something good from your day") to encourage natural emotional expression without rewards or gamification
- All data is stored securely and encrypted. Conversation history is retained for parental access only in the event of an emergency or with the child’s permission, per the selected parental visibility level.

---

### 🧠 AI Safety Architecture

This product uses a dual-layer LLM system to ensure engaging, safe, and trustworthy interactions.

#### 🗣️ Layer 1: Primary Chat Agent

- The main AI assistant that the child interacts with.
- Accesses memory (e.g. persona, mood, past chats) and provides emotionally intelligent, playful, or supportive responses.
- Optimized for continuity, tone-matching, and empathetic dialogue.

#### 👁️ Layer 2: Real-Time Monitor Agent

- A lightweight LLM or rule-based system that reviews every input and output in real time.
- Responsibilities:

  - Detect hallucinations or unverified factual claims
  - Enforce banned topic filters (e.g., politics, sex, harmful myths)
  - Check tone alignment (e.g., prevents jokes during sad moments)
  - Flag or rewrite unsafe advice or confusing responses

- If violations are detected:
  - Bot responses are edited or blocked before delivery
  - Escalations can be triggered to a human reviewer or guardian notification
  - Child may be gently redirected (e.g., “That’s a great question for a trusted grown-up!”)

#### ⌨️ UX Integration

- Human-style typing animation (see Kids’ UI section) serves a dual function:
  - Makes chat responses feel more natural and emotionally attuned
  - Smooths out perceived response time during Layer 2 moderation filtering

This layered system ensures the child’s experience remains joyful, emotionally responsive, and safe—even when the backend is doing heavy lifting.

---

### 🛠️ System Failure & Degradation Protocols

**Safety System Downtime:**

- If Layer 2 (safety monitor) fails: Immediately suspend all conversations
- Display to child: "I need to take a quick break. I'll be back soon!"
- Automatically notify human moderator within 2 minutes
- Resume only after manual safety system verification

**High Latency Handling:**

- Normal response >5 seconds: Trigger "thinking" animation
- Response >10 seconds: Display "I'm thinking really hard about this..."
- Response >30 seconds: "This is a big question! Give me a moment."
- Response >60 seconds: System timeout, graceful restart

**Database Connection Issues:**

- Temporary memory loss: "Sorry, I'm having trouble remembering. Can you remind me about..."
- Continue conversation without persistent context
- Restore memory when connection returns
- Never lose safety monitoring capabilities

**External Service Failures:**

- Cartesia TTS down: Fall back to text-only responses
- Clerk auth issues: Temporary PIN bypass with enhanced logging
- AI provider downtime: Display maintenance message, schedule retry

**Graceful Degradation Priorities:**

1. Child safety monitoring (never compromised)
2. Basic conversation capability
3. Memory persistence
4. Voice features
5. Advanced persona features

**Emergency Protocols:**

- Multiple system failures: Display "I need to stop our chat now. A grown-up will check on you."
- Child in active crisis + system failure: Immediate parent notification regardless of settings
- Human moderator escalation: 5-minute maximum response time during operating hours

---

### 🔒 Privacy & Compliance Strategy

This product is designed for use by children and must comply with key data protection regulations, including:

#### 📜 Regulatory Commitments

- **COPPA (Children’s Online Privacy Protection Act - USA)**

  - Two-tier authentication ensures parents have full legal control over child data
  - Child profiles are sub-accounts under parent Clerk accounts (not independent users)
  - Allow parents to review or delete their child’s data at any time.

- **GDPR-K (General Data Protection Regulation for Kids - EU/UK)**
  - Only collect personal data necessary for the service ("data minimisation").
  - Provide a right to access, rectify, or delete data.
  - Ensure parental control and oversight for users under the digital age of consent (typically 13–16, varies by region).

#### 🔐 Technical Implementation

- **Two-Tier Authentication System**

  - Parents authenticate via standard Clerk authentication (email/password with MFA)
  - Children are sub-profiles under parent accounts, accessed via PIN
  - Child profiles are not direct Clerk users for COPPA compliance
  - All child data legally belongs to parent account

- **Data Encryption & Access**

  - All chat data and metadata stored encrypted at rest and in transit.
  - Data is accessible only to the AI system, the child, and parents (based on visibility settings).

- **Data Minimisation**

  - Only essential conversation metadata is stored (e.g., timestamps, tone tags, mood markers).
  - No location, device, or biometric data is collected.
  - Transcripts are only accessible for review in emergency or if enabled by visibility mode.

- **Data Retention & Portability**

  - Default retention period of 90 days unless flagged or bookmarked.
  - Parents can request export or deletion of all data tied to their child’s PIN at any time.

- **Parental Controls**
  - Full control over consent, visibility level, and escalation contacts via onboarding dashboard.

Future versions will include a transparent Privacy Policy and Consent Workflow tailored for both adults and children, using accessible language and visual cues.

#### Human Content Moderation Workflows

**Escalated Content Review Process:**

- **Level 3 alerts**: Human reviewer contacted within 5 minutes, responds within 15 minutes
- **Level 2 alerts**: Reviewed within 2 hours during business hours, next day otherwise
- **Level 1 flags**: Batched daily review for pattern analysis and system improvement

**Human Moderator Responsibilities:**

- Verify accuracy of AI safety decisions (approve/override/escalate)
- Contact parents directly for Level 3 situations requiring immediate intervention
- Document false positives to improve safety algorithm training
- Escalate to child psychology consultants for complex cases
- Maintain detailed logs for legal compliance and system improvement

**Moderator Training Requirements:**

- Child psychology basics and age-appropriate communication
- COPPA/GDPR compliance and data handling procedures
- Crisis intervention protocols and local emergency contacts
- Cultural sensitivity and neurodivergent communication patterns
- Regular certification updates (quarterly training sessions)

**Quality Assurance Process:**

- 10% random sample of moderation decisions reviewed weekly
- Inter-moderator reliability testing monthly
- External child safety expert audit quarterly
- Parent feedback integration for moderation accuracy

**Emergency Escalation Tree:**

1. **Immediate Danger**: Child safety services + parent notification (concurrent)
2. **Abuse Indicators**: Document evidence, notify parent, prepare for potential authorities
3. **Mental Health Crisis**: Parent + suggested professional resources
4. **Repeat Patterns**: Family counseling resources + enhanced monitoring

**Operating Hours & Coverage:**

- Primary coverage: 6AM-10PM local time (child waking hours)
- Emergency-only coverage: 10PM-6AM (Level 3 alerts only)
- Backup moderator system for holidays/sick coverage
- Maximum response time: 15 minutes for any Level 3 alert during operating hours

---

### ✅ Measurable Success Criteria & Acceptance Testing

#### Technical Performance Baselines

- **Safety Layer Accuracy**: 95%+ on standardized test scenarios (defined below)
  - Test Set A: 100 age-inappropriate requests (sexual content, violence, adult topics)
  - Test Set B: 50 escalation scenarios (self-harm, abuse indicators, extreme distress)
  - Test Set C: 75 edge cases (gray areas, ambiguous language, testing boundaries)
  - Baseline: Current rule-based systems achieve ~78% accuracy on equivalent tests
- **Response Latency**:
  - Normal chat: <2 seconds end-to-end (including safety processing)
  - Escalation detection: <10 seconds maximum
  - Parent alert delivery: <60 seconds from trigger
- **System Uptime**: 99.5% availability during child waking hours (6AM-10PM local time)

#### Behavioral Success Targets (30-day post-launch)

- **Child Engagement**:
  - 60% of children return within 7 days of first session
  - Average session duration: 8-15 minutes for ages 6-8, 12-20 minutes for ages 9-12
  - 3+ sessions per week indicates successful engagement
- **Parent Satisfaction**:
  - Safety perception: 4.5/5.0 average rating
  - Weekly summary usefulness: 4.0/5.0 average rating
  - Alert accuracy (no false positives): 98%+ parent approval of escalations
- **Safety Effectiveness**:
  - Zero missed escalations for high-risk scenarios in beta testing
  - <2% false positive rate for normal conversations
  - 100% parental notification compliance for defined trigger events

#### Acceptance Test Scenarios

**Chat Safety Tests**:

- Responds appropriately to 50 pre-defined inappropriate requests
- Never provides medical, legal, or dangerous advice
- Maintains character consistency across 10-session conversation threads
- Handles 25 "edge case" conversations without escalation errors

**Usability Tests** (with real children, observed but unassisted):

- 95% successful PIN login on first attempt
- 90% complete onboarding without adult intervention
- 85% successfully navigate chat modes and understand responses
- Zero broken conversation flows that leave child confused

**Memory & Persistence Tests**:

- Onda remembers child's name, chosen persona, and 3 previous conversation topics
- Emotional tone adapts correctly based on child's mood patterns
- Age-appropriate language maintained consistently across sessions

**Parental Interface Tests**:

- Weekly summaries generated accurately (100% uptime)
- Alert system tested with 20 escalation scenarios (0 failures)
- Dashboard reflects real-time data with <5 minute lag

---

### 📦 Implementation Phases & MVP Boundaries

#### Phase 1: Core Safety MVP (Weeks 1-6)

**Must Have:**

- Two-tier authentication system (Parent Clerk accounts + child sub-profiles with PIN access)
- Parent dashboard for child profile management
- Basic chat interface (text only, single persona)
- Dual-layer AI safety (primary agent + real-time monitor)
- Level 3 escalation system (immediate danger detection)
- Basic parent notification system (email alerts)
- Memory persistence for name and session history

**Success Criteria:**

- Safety layer achieves 95%+ accuracy on test scenarios
- Children can complete chat sessions without adult help
- Parent alerts delivered within 60 seconds
- No false positives in safety testing

#### Phase 2: Enhanced Experience (Weeks 7-12)

**Core Features:**

- Multiple chat personas (3-5 characters)
- Age-appropriate response adaptation (6-8, 9-11, 12+)
- Voice input/output (Cartesia TTS integration)
- Whisper Mode for calming interactions
- Level 1 & 2 escalation system (graduated responses)
- Weekly parent summary emails
- Human typing animation effects

**Success Criteria:**

- 60% child return rate within 7 days
- Parent satisfaction >4.0/5.0 for safety perception
- Memory system maintains context across sessions

#### Phase 3: Advanced Safety & Analytics (Weeks 13-18)

**Enhanced Features:**

- Parent web dashboard with real-time visibility
- Advanced pattern recognition for emotional distress
- Cultural sensitivity and neurodivergent support basics
- Enhanced human moderation workflows
- Data export/deletion capabilities for parents
- Advanced age-specific language processing

**Success Criteria:**

- <2% false positive rate for normal conversations
- Human moderator response times <15 minutes for Level 3 alerts
- Full COPPA/GDPR compliance verification

#### Phase 4: Scale & Polish (Weeks 19-24)

**Future Features:**

- Multi-language support
- Advanced neurodivergent communication patterns
- Integration with family therapy resources
- Proactive emotional check-ins
- Advanced analytics for parents
- Mobile app optimization

#### Technical Stack (Confirmed)

- **Platform & Deployment:** Vercel
- **Auth:** Clerk (Parent accounts with child sub-profiles using PIN-based access)
- **Database:** NeonDB
- **Frontend:** React (via Next.js framework)
- **Voice (TTS):** Cartesia
- **Backend:** Next.js API routes
- **Styling:** TailwindCSS
- **AI Integration:**
  - Primary LLM via proxy layer (OpenAI or Anthropic)
  - Safety Layer: Moderation model for real-time content scanning
  - Memory Layer: NeonDB integration scoped by child PIN and session

#### MVP Boundaries & Non-Goals

**Not in MVP:**

- Complex family structures (divorced parents, guardians)
- Integration with school counseling systems
- Advanced mental health assessments
- Gamification or reward systems
- Group conversations or peer interactions
- Advanced data analytics beyond basic safety monitoring

**Future Consideration:**

- API integrations with child psychology services
- Advanced AI personality customization
- Predictive mental health indicators
- Integration with existing family therapy platforms

---

### 📋 Sample User Personas

#### 1. Leo, 7 – "Quiet but Curious"

- Shy, avoids big conversations, but asks lots of “what if” questions.
- Doesn’t like conflict. Might ask about friendship problems or fears like “what if my house burned down?”

#### 2. Nina, 10 – "Chatty and Sensitive"

- Expressive, imaginative. Loves stories, hates being ignored.
- Might chat about social drama, getting told off, or “why do I cry when I’m angry?”

#### 3. Danyl, 11 – "Logic-First"

- Neurodivergent, hyperfocused on facts. Dislikes vague advice.
- Will challenge the bot: “You said that before” or “prove it.”

Each persona will influence tone, pacing, use of emoji, and encouragement tactics.

#### Age-Specific Implementation Guidelines

**Ages 6-8: Foundation Level**

- Sentences: 8-12 words maximum, simple structure
- Vocabulary: 2,000 most common words + basic emotions
- Approach: Physical metaphors ("Your heart feels heavy"), immediate comfort
- Example: "That sounds really sad. I'm here with you."

**Ages 9-11: Development Level**

- Sentences: 12-18 words, compound sentences allowed
- Vocabulary: 5,000 words + emotional complexity terms
- Approach: "Why" questions, coping strategies, pattern recognition
- Example: "School feels overwhelming. What's making it so hard?"

**Ages 12+: Transition Level**

- Full language complexity, abstract concepts
- Approach: Socratic questioning, respect autonomy, acknowledge complexity
- Example: "There's no simple answer. What feels right to you?"

**Universal Safety Overrides:**

- Never provide medical/legal advice
- Maintain persona consistency
- Default to emotional support over problem-solving
- End difficult conversations: "You're not alone in this"

---

### 🌀 Sensitive Topics Strategy

Some complex topics do not require automatic escalation but do require care.

#### “Safe but Sensitive” Handling

- Topics like grief, divorce, gender, or complex emotions prompt a change in tone.
- Bot slows down, checks in (“Wanna keep talking about this?”), and gently explores with guiding questions.
- Parents are not alerted unless the session escalates into emotional distress, risk language, or repeated concern patterns.

> This ensures kids don’t feel punished for curiosity while still being supported.
