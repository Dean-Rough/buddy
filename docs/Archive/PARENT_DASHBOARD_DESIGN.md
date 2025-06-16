# Parent Dashboard - Complete Design & Implementation Plan

## Overview

The parent dashboard is the **mission control center** for child safety, compliance, and family digital wellness. This is where COPPA compliance, parental control, and family trust converge.

## Core Sections

### 1. 🏠 **Dashboard Home**

**Quick Overview & Critical Alerts**

```tsx
// Today's Summary Card
- Chat time today: 23 mins (7 mins remaining)
- Safety alerts: 0 active
- Last session: 2 hours ago
- Mood detected: excited (talking about Minecraft)

// Urgent Notifications (if any)
- 🚨 Safety alert requires review
- ⏰ Time limit exceeded - intervention needed
- 📧 Weekly summary ready
```

### 2. ⏱️ **Time Management**

**Dynamic Chat Limits & Screen Time Controls**

**Daily Time Limits:**

```
┌─────────────────────────────────────────┐
│ Daily Chat Time: [====    ] 30 minutes │
│ Range: 15 mins ────────────── 120 mins  │
│                                         │
│ Strictness Level:                       │
│ ○ Flexible    ● Balanced    ○ Strict   │
│                                         │
│ Smart Overrides:                        │
│ ☑ Allow extra time for emotional support│
│ ☑ Extend learning discussions           │
│ ☐ Override for creative projects        │
│                                         │
│ Current Usage Today:                    │
│ Regular chat: 18 mins                   │
│ Emotional support: +7 mins (allowed)    │
│ Learning discussion: +3 mins (allowed)  │
│                                         │
│ Next Reset: Tomorrow 6:00 AM            │
└─────────────────────────────────────────┘
```

**Time Limit Schedule:**

```
Monday-Friday (School Days):     30 minutes
Saturday-Sunday (Weekends):      45 minutes
School Holidays:                 60 minutes

Quiet Hours: 9:00 PM - 7:00 AM (no chat allowed)
```

### 3. 🔔 **Alerts & Notifications**

**Multi-Channel Safety Communication**

**Alert Channels:**

```
Primary Email:    dean@example.com [Change]
Mobile Number:    +44 7XXX XXXXXX [Change]
Partner Email:    sarah@example.com [Add]

Alert Types:
┌──────────────────────────────────────────────┐
│ CRITICAL (Immediate - SMS + Email + Push):   │
│ ☑ Self-harm indicators                      │
│ ☑ Abuse/danger mentions                     │
│ ☑ Severe emotional distress                 │
│                                             │
│ HIGH (Within 10 mins - Email + Push):       │
│ ☑ Inappropriate content attempts            │
│ ☑ Personal information sharing              │
│ ☑ Concerning behavioral patterns            │
│                                             │
│ MEDIUM (Within 2 hours - Email):            │
│ ☑ Time limit exceeded significantly         │
│ ☑ Repetitive safety boundary testing        │
│ ☑ Learning opportunities identified         │
│                                             │
│ LOW (Daily Summary):                        │
│ ☑ General conversation topics               │
│ ☑ Mood and engagement patterns              │
│ ☑ Educational discussions                   │
└──────────────────────────────────────────────┘
```

**Push Notification Settings:**

```
Device Notifications:
☑ Enable push notifications
☑ Override Do Not Disturb for critical alerts
☑ Show preview for safety alerts
☐ Show preview for general updates

Notification Sounds:
Critical:   🔊 Urgent Alert    [Test Sound]
High:       🔊 Safety Notice  [Test Sound]
Medium:     🔊 Gentle Chime   [Test Sound]
```

### 4. 📧 **Reports & Summaries**

**Automated Insights & Communications**

**Weekly Summary Settings:**

```
Summary Schedule:
● Every Sunday at 8:00 PM
○ Every Friday at 6:00 PM
○ Bi-weekly (every other Sunday)

Content Included:
☑ Total chat time and patterns
☑ Topics discussed and interests
☑ Emotional state observations
☑ Learning moments and curiosity
☑ Safety events (if any)
☑ Developmental insights
☐ Suggested conversation starters
☐ Educational resource recommendations

Delivery Method:
☑ Email to primary address
☑ Also send to partner
☐ SMS summary for critical points
```

**Sample Weekly Summary:**

```
🌟 Emma's Week with Onda (Dec 4-10, 2024)

📊 OVERVIEW
Total chat time: 3h 24m (within healthy limits)
Sessions: 12 conversations
Average session: 17 minutes
Longest session: 34 minutes (discussing space!)

😊 EMOTIONAL WELLBEING
Overall mood: Positive and curious
Notable moments:
- Excited about school science project
- Briefly sad about losing toy, worked through it well
- Showing increased confidence in expressing feelings

🎯 INTERESTS & LEARNING
Top topics: Space exploration, friendship dynamics, creative writing
Learning moments: Asked great questions about planets,
                 worked through a friendship conflict with peer
Safety: No concerning content detected

🔍 PARENTAL INSIGHTS
- Emma is developing strong emotional vocabulary
- Shows healthy curiosity about science topics
- May benefit from books about space exploration
- Consider discussing friendship skills at dinner

📞 NEXT WEEK
Suggested conversation starters:
"What was the coolest thing Onda taught you about space?"
"How did talking to Onda help with your friend situation?"
```

### 5. 👧 **Child Profile Management**

**Individual Settings & Preferences**

```
Child: Emma Thompson
Age: 9 years old (Year 4)
PIN: •••• [Change PIN]

AI Persona: Ocean Jellyfish (Luna) [Change]
- Calm and wise
- Loves marine biology
- Speaks gently and thoughtfully

Chat Preferences:
☑ Writing sounds enabled
☑ Typing animations
● Normal speed  ○ Slow  ○ Fast

Memory Settings:
☑ Remember interests and preferences
☑ Remember emotional context between sessions
☐ Share positive moments with family
☑ Maintain conversation history (90 days)

Safety Customization:
☑ Standard safety filtering
☐ Extra strict mode (highly sensitive)
☐ Learning mode (more educational content)

Emergency Contacts:
Primary: Dean Newton (Dad) - 07XXX XXXXXX
Secondary: Sarah Newton (Mum) - 07XXX XXXXXX
School: Greenfield Primary - 01XXX XXXXXX
```

### 6. 🔒 **Privacy & Data Management**

**COPPA Compliance & Data Rights**

**Data Access & Control:**

```
Data Ownership: All chat data belongs to your parental account
Data Location: UK servers (GDPR compliant)
Retention Period: 90 days (auto-delete unless flagged)

Your Data Rights:
[Export All Data]  [Delete Child Profile]  [Download Report]

Data Sharing:
☐ Anonymous research participation (optional)
☐ Share positive interactions with partner account
☑ Emergency sharing with emergency contacts only

Conversation Visibility:
● Summary only (emotional state, topics, safety events)
○ Detailed reports (conversation excerpts for learning)
○ Full transcripts (complete conversation history)
○ Emergency only (transcripts available only for safety events)

Third-Party Integrations:
☐ Google Family Link
☐ Screen Time (iOS)
☐ Digital Wellbeing (Android)
```

### 7. 📱 **Family Settings**

**Multi-Child & Partner Management**

```
Family Structure:
Parent Account: Dean Newton (Primary)
Partner Access: Sarah Newton [Invite Sent] [Resend]

Children in Family:
┌──────────────────────────────────────────┐
│ 👧 Emma (9) - Active                    │
│    Last chat: 2 hours ago              │
│    Today: 23/30 minutes used           │
│    [Manage] [Settings] [Reports]        │
│                                         │
│ 👦 Jack (7) - Profile Created          │
│    Setup: PIN needed                   │
│    Status: Ready to chat               │
│    [Complete Setup] [Settings]          │
│                                         │
│ [+ Add Another Child]                   │
└──────────────────────────────────────────┘

Partner Permissions:
Sarah Newton (sarah@newton.family):
☑ View all child activity reports
☑ Modify time limits and settings
☑ Receive safety alerts
☐ Full administrative access
☐ Add/remove children
```

### 8. ⚙️ **Advanced Settings**

**Technical Configuration & Troubleshooting**

**Developer Mode (Optional):**

```
☐ Enable detailed logging for troubleshooting
☐ Show technical safety scores
☐ Export conversation metadata for analysis
☐ Beta feature access
```

**Performance Settings:**

```
Response Speed: ● Balanced  ○ Fast  ○ Thorough
Safety Sensitivity: ○ High  ● Standard  ○ Relaxed
Voice Features: ☑ Enabled (when available)
```

**Account & Billing:**

```
Plan: Family Pro (2 children included)
Billing: £9.99/month (next bill: Jan 15, 2025)
Usage: 47% of included conversation time

[Upgrade Plan] [Billing History] [Cancel Subscription]
```

## Implementation Priority

### Phase 1 (MVP - Week 1-2)

1. **Dashboard Home** - Basic overview
2. **Time Management** - Simple daily limits
3. **Basic Alerts** - Email notifications only
4. **Child Profile** - Single child management

### Phase 2 (Enhanced - Week 3-4)

1. **Advanced Time Limits** - Dynamic overrides
2. **Multi-Channel Alerts** - SMS + Push notifications
3. **Weekly Summaries** - Automated reports
4. **Privacy Controls** - Data export/delete

### Phase 3 (Full Feature - Week 5-6)

1. **Family Management** - Multiple children
2. **Partner Access** - Shared parental controls
3. **Advanced Analytics** - Detailed insights
4. **Third-Party Integrations** - Screen time apps

## Technical Architecture

### Database Schema Additions

```sql
-- Parent settings table
CREATE TABLE "ParentSettings" (
  "id" TEXT NOT NULL,
  "parentClerkUserId" TEXT NOT NULL,
  "primaryEmail" TEXT NOT NULL,
  "secondaryEmail" TEXT,
  "mobileNumber" TEXT,
  "defaultTimeLimitMinutes" INTEGER DEFAULT 30,
  "defaultStrictness" TEXT DEFAULT 'balanced',
  "allowEmotionalOverrides" BOOLEAN DEFAULT true,
  "allowLearningOverrides" BOOLEAN DEFAULT true,
  "quietHoursStart" TIME DEFAULT '21:00',
  "quietHoursEnd" TIME DEFAULT '07:00',
  "summarySchedule" TEXT DEFAULT 'weekly_sunday',
  "summaryContent" JSONB,
  "pushNotificationsEnabled" BOOLEAN DEFAULT true,
  "emergencyOverrideDND" BOOLEAN DEFAULT true,
  "dataRetentionDays" INTEGER DEFAULT 90,
  "conversationVisibility" TEXT DEFAULT 'summary_only',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  PRIMARY KEY ("id"),
  CONSTRAINT "ParentSettings_parentClerkUserId_fkey"
    FOREIGN KEY ("parentClerkUserId") REFERENCES "Parent" ("clerkUserId")
);

-- Notification preferences
CREATE TABLE "NotificationPreference" (
  "id" TEXT NOT NULL,
  "parentSettingsId" TEXT NOT NULL,
  "alertType" TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
  "emailEnabled" BOOLEAN DEFAULT true,
  "smsEnabled" BOOLEAN DEFAULT false,
  "pushEnabled" BOOLEAN DEFAULT true,
  "deliveryDelay" INTEGER DEFAULT 0, -- minutes

  PRIMARY KEY ("id"),
  CONSTRAINT "NotificationPreference_parentSettingsId_fkey"
    FOREIGN KEY ("parentSettingsId") REFERENCES "ParentSettings" ("id")
);

-- Family structure for multi-child
CREATE TABLE "FamilyMember" (
  "id" TEXT NOT NULL,
  "familyId" TEXT NOT NULL,
  "parentClerkUserId" TEXT NOT NULL,
  "role" TEXT NOT NULL, -- 'primary', 'partner'
  "permissions" JSONB,
  "inviteStatus" TEXT DEFAULT 'active', -- 'pending', 'active', 'suspended'

  PRIMARY KEY ("id"),
  CONSTRAINT "FamilyMember_parentClerkUserId_fkey"
    FOREIGN KEY ("parentClerkUserId") REFERENCES "Parent" ("clerkUserId")
);
```

### Component Architecture

```
components/parent/
├── Dashboard/
│   ├── DashboardHome.tsx
│   ├── ActivitySummary.tsx
│   └── AlertsOverview.tsx
├── TimeManagement/
│   ├── TimeLimitSettings.tsx
│   ├── UsageChart.tsx
│   └── OverrideHistory.tsx
├── Notifications/
│   ├── AlertChannels.tsx
│   ├── NotificationTest.tsx
│   └── PreferenceMatrix.tsx
├── Reports/
│   ├── WeeklySummary.tsx
│   ├── SummaryScheduler.tsx
│   └── ReportHistory.tsx
├── ChildManagement/
│   ├── ChildProfileCard.tsx
│   ├── ChildSettings.tsx
│   └── MultiChildView.tsx
├── Privacy/
│   ├── DataControls.tsx
│   ├── ConversationAccess.tsx
│   └── ExportData.tsx
└── Settings/
    ├── FamilyStructure.tsx
    ├── PartnerInvite.tsx
    └── AccountSettings.tsx
```

This comprehensive parent dashboard ensures COPPA compliance, provides meaningful control, and builds family trust through transparency and appropriate oversight.
