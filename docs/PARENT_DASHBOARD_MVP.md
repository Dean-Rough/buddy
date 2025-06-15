# Parent Dashboard MVP - Core Implementation

## Two-Phase Approach

### 🎯 **Phase 1: Core Functionality (2-3 weeks)**

Focus on essential parental controls and COPPA compliance basics.

### 🚀 **Phase 2: Smart Features (Future)**

Advanced analytics, AI insights, multi-child support, integrations.

---

## Phase 1: Core Features Only

### 1. 🔐 **PIN Protection System**

**Additional security layer separate from Clerk auth**

**First-Time Setup Flow:**

```
Parent logs in via Clerk → Redirects to dashboard → No PIN set → PIN Setup

┌─────────────────────────────────────────┐
│          Welcome to Your Dashboard      │
│                                         │
│   For extra security, please set a     │
│   4-digit PIN to access your parent    │
│   dashboard and child settings.        │
│                                         │
│   This PIN is separate from your       │
│   account password.                     │
│                                         │
│   Enter 4-digit PIN: [●][●][●][●]      │
│   Confirm PIN:        [●][●][●][●]      │
│                                         │
│   □ I understand this PIN protects     │
│     my child's safety settings         │
│                                         │
│        [Set PIN & Continue]             │
└─────────────────────────────────────────┘
```

**Ongoing PIN Entry:**

```
┌─────────────────────────────────────────┐
│           Parent Dashboard Access       │
│                                         │
│   Enter your 4-digit PIN to access     │
│   Emma's safety settings and reports   │
│                                         │
│        PIN: [●][●][●][●]               │
│                                         │
│       [Access Dashboard]                │
│                                         │
│       Forgot PIN? [Reset via Email]    │
└─────────────────────────────────────────┘
```

**PIN Management:**

```
┌─────────────────────────────────────────┐
│            Change Dashboard PIN         │
│                                         │
│   Current PIN:  [●][●][●][●]           │
│   New PIN:      [●][●][●][●]           │
│   Confirm:      [●][●][●][●]           │
│                                         │
│   [Update PIN]   [Cancel]               │
│                                         │
│   Note: Changing your PIN will log you │
│   out and require re-entry.            │
└─────────────────────────────────────────┘
```

### 2. 🏠 **Dashboard Home (Simplified)**

**Quick overview without advanced analytics**

```tsx
┌─────────────────────────────────────────┐
│              Emma's Overview            │
│                                         │
│  Today's Chat Time: 23 mins            │
│  Daily Limit: 30 mins (7 remaining)    │
│                                         │
│  Last Session: 2 hours ago             │
│  Status: ✅ All good                   │
│                                         │
│  Safety Alerts: 0 active               │
│                                         │
│  [View Time Settings]                   │
│  [Check Safety Settings]                │
│  [View Reports]                         │
└─────────────────────────────────────────┘
```

### 3. ⏱️ **Time Management (Core)**

**Simple daily limits without smart overrides**

```
Daily Chat Time Limit
┌─────────────────────────────────────────┐
│  Minutes per day: [====    ] 30 mins   │
│  Range: 15 ────────────────── 120      │
│                                         │
│  Schedule:                              │
│  Weekdays:    30 minutes               │
│  Weekends:    45 minutes               │
│                                         │
│  Quiet Hours (No Chat):                │
│  From: 9:00 PM  To: 7:00 AM           │
│                                         │
│  When limit reached:                    │
│  ● End conversation naturally          │
│  ○ Hard stop with notification         │
│                                         │
│  [Save Settings]                        │
└─────────────────────────────────────────┘
```

### 4. 🔔 **Basic Alerts (Email Only)**

**Essential safety notifications without SMS/push complexity**

```
Safety Alerts
┌─────────────────────────────────────────┐
│  Email Address: dean@example.com        │
│  [Change Email]                         │
│                                         │
│  Alert Types:                           │
│  ☑ Critical safety concerns             │
│  ☑ Inappropriate content attempts       │
│  ☑ Time limit significantly exceeded    │
│  ☑ Weekly summary reports               │
│                                         │
│  Alert Timing:                          │
│  Critical: Immediately                  │
│  Other: Within 30 minutes               │
│                                         │
│  [Test Email Alert]                     │
│  [Save Settings]                        │
└─────────────────────────────────────────┘
```

### 5. 👧 **Child Settings (Single Child)**

**Basic profile management**

```
Emma's Settings
┌─────────────────────────────────────────┐
│  Name: Emma Thompson                    │
│  Age: 9 years old                      │
│  Chat PIN: •••• [Change PIN]           │
│                                         │
│  AI Personality:                        │
│  ● Friendly Raccoon  ○ Ocean Jellyfish │
│  ○ Tech Robot       ○ Creative Fox     │
│                                         │
│  Chat Features:                         │
│  ☑ Writing sounds                       │
│  ☑ Typing animations                    │
│  ☑ Remember our conversations           │
│                                         │
│  Safety Level:                          │
│  ● Standard filtering                   │
│  ○ Extra strict mode                    │
│                                         │
│  [Save Changes]                         │
└─────────────────────────────────────────┘
```

### 6. 📊 **Simple Reports**

**Basic weekly summaries without advanced analytics**

```
This Week's Summary
┌─────────────────────────────────────────┐
│  Dec 4-10, 2024                        │
│                                         │
│  Total Chat Time: 3h 24m               │
│  Sessions: 12 conversations            │
│  Average: 17 minutes per session       │
│                                         │
│  Safety Status: ✅ All conversations   │
│                    were appropriate    │
│                                         │
│  Popular Topics:                        │
│  • Space and planets                   │
│  • Creative writing                    │
│  • School projects                     │
│                                         │
│  Emotional Tone: Mostly positive       │
│  and curious                           │
│                                         │
│  [Download Full Report]                 │
│  [Email Report Settings]               │
└─────────────────────────────────────────┘
```

### 7. 🔒 **Basic Privacy Controls**

**Essential data management for COPPA compliance**

```
Data & Privacy
┌─────────────────────────────────────────┐
│  Data Ownership:                        │
│  All of Emma's chat data belongs to     │
│  your parental account.                 │
│                                         │
│  Data Retention: 90 days               │
│  Auto-delete: ☑ Enabled                │
│                                         │
│  Your Rights:                           │
│  [Export All Data]                      │
│  [Delete All Conversations]            │
│  [Delete Child Profile]                 │
│                                         │
│  Conversation Access:                   │
│  ● Summary reports only                 │
│  ○ Include conversation excerpts        │
│  ○ Full conversation history            │
│                                         │
│  [Save Privacy Settings]               │
└─────────────────────────────────────────┘
```

---

## Technical Implementation

### Database Schema (Simplified)

```sql
-- Parent PIN protection
CREATE TABLE "ParentDashboardAccess" (
  "id" TEXT NOT NULL,
  "parentClerkUserId" TEXT NOT NULL UNIQUE,
  "pinHash" TEXT NOT NULL,
  "pinSetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAccessAt" TIMESTAMP(3),
  "failedAttempts" INTEGER DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),

  PRIMARY KEY ("id"),
  CONSTRAINT "ParentDashboardAccess_parentClerkUserId_fkey"
    FOREIGN KEY ("parentClerkUserId") REFERENCES "Parent" ("clerkUserId")
);

-- Simple parent settings
CREATE TABLE "ParentSettings" (
  "id" TEXT NOT NULL,
  "parentClerkUserId" TEXT NOT NULL UNIQUE,
  "alertEmail" TEXT NOT NULL,
  "timeLimitMinutes" INTEGER DEFAULT 30,
  "weekendTimeLimitMinutes" INTEGER DEFAULT 45,
  "quietHoursStart" TIME DEFAULT '21:00',
  "quietHoursEnd" TIME DEFAULT '07:00',
  "naturalEnding" BOOLEAN DEFAULT true,
  "weeklyEmailReports" BOOLEAN DEFAULT true,
  "conversationAccess" TEXT DEFAULT 'summary_only',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  PRIMARY KEY ("id"),
  CONSTRAINT "ParentSettings_parentClerkUserId_fkey"
    FOREIGN KEY ("parentClerkUserId") REFERENCES "Parent" ("clerkUserId")
);

-- Simple usage tracking
CREATE TABLE "DailyUsage" (
  "id" TEXT NOT NULL,
  "childAccountId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "minutesUsed" INTEGER DEFAULT 0,
  "sessionsCount" INTEGER DEFAULT 0,
  "limitExceeded" BOOLEAN DEFAULT false,

  PRIMARY KEY ("id"),
  UNIQUE("childAccountId", "date"),
  CONSTRAINT "DailyUsage_childAccountId_fkey"
    FOREIGN KEY ("childAccountId") REFERENCES "ChildAccount" ("id")
);
```

### Component Structure

```
components/parent/
├── auth/
│   ├── PinSetup.tsx
│   ├── PinEntry.tsx
│   └── PinChange.tsx
├── dashboard/
│   ├── DashboardHome.tsx
│   ├── QuickStats.tsx
│   └── SafetyStatus.tsx
├── settings/
│   ├── TimeSettings.tsx
│   ├── AlertSettings.tsx
│   ├── ChildSettings.tsx
│   └── PrivacySettings.tsx
└── reports/
    ├── WeeklySummary.tsx
    └── UsageChart.tsx
```

### Implementation Priority

**Week 1:**

1. PIN protection system
2. Dashboard home page
3. Basic time settings

**Week 2:**

1. Email alerts
2. Child settings management
3. Simple reports

**Week 3:**

1. Privacy controls
2. Data export/delete
3. Polish and testing

This MVP approach focuses on **essential parental control** without overwhelming complexity, while maintaining full COPPA compliance and family safety.
