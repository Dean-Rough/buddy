# Lumo - Child AI Chat Platform

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
cd lumo
npm install
cp .env.example .env.local
```

### Environment (.env.local)

```bash
# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
DATABASE_URL=postgresql://user:pass@host:5432/lumo

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

## File Structure

```
lumo/
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
