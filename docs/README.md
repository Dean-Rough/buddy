# Onda - Child AI Chat Platform (Web-First PWA)

## 🌐 Platform Strategy - Progressive Web App

**Why Web-First?** Apple's App Store prohibits AI-generated content in kids' apps. This constraint becomes our advantage:

- **🚀 Instant Updates**: Deploy safety improvements in minutes, not weeks
- **💰 100% Revenue**: No 30% App Store commission
- **🌍 Universal Access**: Works on every device with a browser
- **📱 App-Like Experience**: PWA technology provides native feel
- **🔒 Better Safety**: Real-time updates when threats emerge

**Access from any device** - No downloads required!

## Tech Stack

- **Frontend**: Next.js 14 + React 18 + TailwindCSS + TypeScript
- **Database**: NeonDB (PostgreSQL) + Prisma ORM
- **Auth**: Clerk (Parent accounts + child sub-profiles with PIN access)
- **AI**: OpenAI GPT-4/Anthropic Claude via proxy + safety layer
- **Voice**: Cartesia TTS
- **Deploy**: Vercel
- **Notifications**: Resend email + webhooks

## Core Dependencies

```json
{
  "next": "14.0.0",
  "react": "18.2.0",
  "typescript": "5.2.0",
  "tailwindcss": "3.3.0",
  "@clerk/nextjs": "4.27.0",
  "prisma": "5.6.0",
  "@prisma/client": "5.6.0",
  "openai": "4.20.0",
  "@anthropic-ai/sdk": "0.9.0",
  "resend": "2.0.0"
}
```

## Setup

### Install

```bash
git clone <repo>
cd Onda
npm install
cp .env.example .env.local
```

### Environment (.env.local)

```bash
# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
DATABASE_URL=postgresql://user:pass@host:5432/Onda

# AI
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Voice
CARTESIA_API_KEY=cartesia_...

# Email
RESEND_API_KEY=re_...

# Safety
SAFETY_WEBHOOK_SECRET=whsec_...
```

### Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed test data
npm run test         # Run tests
npm run test:safety  # Safety validation tests
npm run lint         # ESLint + Prettier
npm run type-check   # TypeScript validation
```

### PWA Setup (NEW)

```bash
# 1. Create PWA manifest
cp public/manifest.example.json public/manifest.json

# 2. Generate app icons
npm run generate-icons  # Creates all required sizes

# 3. Test PWA features
npm run lighthouse     # Run Lighthouse audit

# 4. Test on mobile
npm run ngrok         # Expose local dev to mobile
```

### Mobile Web Testing

```bash
# iOS Testing
- Open in Safari
- Tap Share > Add to Home Screen
- Test offline functionality

# Android Testing
- Open in Chrome
- Tap Menu > Add to Home Screen
- Test install experience
```

## File Structure

```
Onda/
├── app/
│   ├── (auth)/
│   │   ├── pin/page.tsx           # Child PIN access to sub-profile
│   │   └── parent/page.tsx        # Parent Clerk authentication
│   ├── (chat)/
│   │   ├── page.tsx               # Main chat interface
│   │   └── whisper/page.tsx       # Whisper mode
│   ├── (parent)/
│   │   ├── dashboard/page.tsx     # Parent overview
│   │   └── alerts/page.tsx        # Safety alerts
│   └── api/
│       ├── auth/
│       │   └── pin/route.ts       # PIN verification
│       ├── chat/
│       │   └── message/route.ts   # Chat endpoint
│       ├── safety/
│       │   └── escalate/route.ts  # Safety escalation
│       └── parent/
│           └── alerts/route.ts    # Parent notifications
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx
│   │   ├── MessageBubble.tsx
│   │   └── PersonaSelector.tsx
│   ├── auth/
│   │   └── PinEntry.tsx
│   └── ui/                        # Reusable components
├── lib/
│   ├── db.ts                      # Prisma client
│   ├── ai.ts                      # AI service layer
│   ├── safety.ts                  # Safety validation
│   └── auth.ts                    # Auth utilities
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── types/
│   ├── auth.ts
│   ├── chat.ts
│   └── safety.ts
└── tests/
    ├── safety/                    # Safety system tests
    └── e2e/                       # End-to-end tests
```

## Safety Rules

- Dual-layer AI validation on all child interactions
- 95%+ safety accuracy required (see tests/safety/)
- Level 3 alerts trigger immediate parent notification
- Zero tolerance for safety system bypasses
- All child-facing code requires error boundaries
