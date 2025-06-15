# Onda Authentication Flow Diagram

## Overview

This diagram shows the complete authentication flow for the Onda platform, including all entry points, routing logic, and final destinations.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                LANDING PAGE (/)                                 │
│                                                                                 │
│  Header:                           Hero Section:                               │
│  ┌─────────┐ ┌─────────┐           ┌─────────────┐ ┌───────────────┐           │
│  │ LOGIN   │ │ SIGNUP  │           │ GET STARTED │ │ CHILD SIGN IN │           │
│  │(chat)   │ │(parent) │           │  (parent)   │ │    (chat)     │           │
│  └─────────┘ └─────────┘           └─────────────┘ └───────────────┘           │
│                                                                                 │
│  Other CTAs: "TRY ONDA", "GET STARTED" → (parent)                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           useAuthFlow() ROUTING                                │
│                                                                                 │
│  if (!user && destination === 'parent'):                                       │
│  ├─► redirectToSignUp({ redirectUrl: "/onboarding?type=parent" })              │
│                                                                                 │
│  if (!user && destination === 'chat'):                                         │
│  ├─► router.push('/sign-in')                                                   │
│                                                                                 │
│  if (user && userType === 'parent'):                                           │
│  ├─► router.push('/parent')                                                    │
│                                                                                 │
│  if (user && userType === 'child'):                                            │
│  ├─► router.push('/chat')                                                      │
│                                                                                 │
│  if (user && !userType):                                                       │
│  ├─► router.push('/onboarding/setup')                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│     PARENT SIGNUP FLOW      │ │      CHILD SIGNIN FLOW      │
│                             │ │                             │
│ /onboarding?type=parent     │ │ /sign-in                    │
│          │                  │ │          │                  │
│          ▼                  │ │          ▼                  │
│ ┌─────────────────────────┐ │ │ ┌─────────────────────────┐ │
│ │   Clerk SignUp Form     │ │ │ │   User Type Choice      │ │
│ │ • Email/Password        │ │ │ │ ┌─────────┐ ┌─────────┐ │ │
│ │ • Sets userType:parent  │ │ │ │ │I'M A KID│ │I'M A    │ │ │
│ │ • redirectUrl: /parent  │ │ │ │ │         │ │PARENT   │ │ │
│ └─────────────────────────┘ │ │ │ └─────────┘ └─────────┘ │ │
│          │                  │ │ │     │           │       │ │
│          ▼                  │ │ │     ▼           ▼       │ │
│ ┌─────────────────────────┐ │ │ │ ┌─────────┐ ┌─────────┐ │ │
│ │   PARENT DASHBOARD      │ │ │ │ │ Child   │ │ Clerk   │ │ │
│ │      (/parent)          │ │ │ │ │SignIn   │ │SignIn   │ │ │
│ └─────────────────────────┘ │ │ │ │Username │ │Email/   │ │ │
└─────────────────────────────┘ │ │ │/PIN     │ │Password │ │ │
                                │ │ └─────────┘ └─────────┘ │ │
                                │ │     │           │       │ │
                                │ │     ▼           ▼       │ │
                                │ │ ┌─────────┐ ┌─────────┐ │ │
                                │ │ │  CHAT   │ │ PARENT  │ │ │
                                │ │ │ (/chat) │ │(/parent)│ │ │
                                │ │ └─────────┘ └─────────┘ │ │
                                └─────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MIDDLEWARE LAYER                                  │
│                         (Runs on every route change)                           │
│                                                                                 │
│ Check 1: User authenticated?                                                    │
│ ├─ NO: Allow access to public routes (/, /sign-in, /onboarding)               │
│ │      Block access to protected routes → redirect appropriately               │
│ │                                                                             │
│ └─ YES: Check userType metadata                                               │
│    │                                                                           │
│    ├─ userType = 'parent':                                                     │
│    │  • Accessing / or /sign-in → redirect to /parent                         │
│    │  • Accessing /onboarding → redirect to /parent                           │
│    │  • Allow /parent access                                                   │
│    │                                                                           │
│    ├─ userType = 'child':                                                      │
│    │  • Not accessing /chat → redirect to /chat                               │
│    │  • Allow /chat access                                                     │
│    │                                                                           │
│    └─ No userType (legacy/incomplete):                                         │
│       • Allow /onboarding/setup access                                         │
│       • /sign-in → redirect to /onboarding/setup                              │
│       • Root path (/) → allow (can complete onboarding)                       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            EDGE CASE HANDLING                                  │
│                                                                                 │
│ /onboarding/setup (User Type Selection):                                       │
│ ├─ "I'M A PARENT" → sets userType:parent → redirect to /parent                │
│ └─ "I'M A KID" → sets userType:child → redirect to /chat                      │
│                                                                                 │
│ AuthGuard Component (on protected pages):                                      │
│ ├─ No user → redirect to /                                                     │
│ ├─ No userType → redirect to /onboarding/setup                                │
│ ├─ Wrong userType → redirect to appropriate page                               │
│ └─ Correct userType → render protected content                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FINAL DESTINATIONS                                │
│                                                                                 │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│ │  PARENT DASHBOARD│  │    CHAT APP     │  │  USER SETUP     │                │
│ │    (/parent)    │  │    (/chat)      │  │(/onboarding/    │                │
│ │                 │  │                 │  │    setup)       │                │
│ │ • Child account │  │ • AI chat       │  │ • Choose user   │                │
│ │   management    │  │ • Safety        │  │   type (edge    │                │
│ │ • Safety alerts │  │   monitoring    │  │   case only)    │                │
│ │ • Settings      │  │ • Voice input   │  │                 │                │
│ │ • Data download │  │ • Personas      │  │                 │                │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Key Features

### 🎯 **Simplified Entry Points**

- **Primary CTA buttons** → Parent signup flow
- **Child Sign In** → Child authentication flow
- **Header Login** → Flexible sign-in (user chooses type)

### 🔄 **Smart Routing**

- **useAuthFlow()** determines destination based on user intent
- **Middleware** enforces proper routing based on authentication status
- **AuthGuard** protects individual pages with type-specific access

### 🛡️ **Safety & Compliance**

- **Parent metadata** set automatically during signup
- **COPPA compliant** child account creation
- **Dual authentication** (PIN for children, email/password for parents)

### 🔧 **Error Recovery**

- **Missing userType** → Guided setup flow
- **Wrong user type** → Automatic redirection
- **Unauthenticated access** → Appropriate sign-in flow

## Implementation Notes

1. **All main CTAs** lead to parent signup for business conversion
2. **Child access** is clearly separated but easily accessible
3. **Middleware handles edge cases** automatically
4. **No confusing double user type selection** (previous issue resolved)
5. **Clear separation** between parent and child experiences
