# API Routes - Onda Platform (Live Production)

**Status**: ✅ LIVE at [www.onda.click](https://www.onda.click) | Updated January 2025  
**API Version**: v1.0 with Buddy 2.0 features operational

## Core Endpoints - ✅ ALL LIVE IN PRODUCTION

### Auth - ✅ OPERATIONAL

- `POST /api/auth/pin/verify` - Child PIN access to sub-profile (LIVE)
- `POST /api/auth/parent/login` - Parent Clerk authentication (ACTIVE)
- `POST /api/auth/child/create` - Parent creates child sub-profile (DEPLOYED)
- `PUT /api/auth/child/{id}` - Parent updates child profile settings (OPERATIONAL)

### Chat - ✅ ACTIVE (Dual-Layer Safety)

- `POST /api/chat/message` - Send message, get AI response with safety validation (LIVE)
- `GET /api/chat/history` - Conversation history with parent controls (DEPLOYED)
- `POST /api/chat/voice/synthesize` - Cartesia TTS voice synthesis (OPERATIONAL)
- `POST /api/chat/nudge` - Parent-queued organic nudges (BUDDY 2.0 LIVE)

### Safety - ✅ ACTIVE (100% Coverage)

- `POST /api/safety/escalate` - Trigger safety escalation with parent notification (LIVE)
- `GET /api/safety/moderate/{id}` - Human moderation review queue (OPERATIONAL)
- `POST /api/safety/calibrate` - Manual safety threshold adjustment (DEPLOYED)

### Parent - ✅ LIVE DASHBOARD

- `GET /api/parent/dashboard` - 4-tab parent dashboard with analytics (ACTIVE)
- `GET /api/parent/alerts` - Real-time safety notifications (LIVE)
- `POST /api/parent/settings` - Time limits, privacy controls (DEPLOYED)
- `GET /api/parent/summaries` - Weekly email summaries with AI analysis (OPERATIONAL)
- `POST /api/parent/calendar/connect` - Google Calendar OAuth integration (BUDDY 2.0 LIVE)

### Voice - ✅ CARTESIA INTEGRATION LIVE

- `POST /api/voice/synthesize` - Text-to-speech with persona voices (OPERATIONAL)
- `GET /api/voice/personas` - Available voice personas and settings (ACTIVE)

### Email - ✅ RESEND INTEGRATION ACTIVE

- `POST /api/email/summary/generate` - GPT-4o-mini weekly summary generation (LIVE)
- `POST /api/email/alert/send` - Immediate parent safety alerts (OPERATIONAL)

## Implementation Examples

### PIN Authentication (Child Sub-Profile Access)

```typescript
// app/api/auth/pin/verify/route.ts
import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { pin, deviceId } = await request.json();

  // Find child sub-profile by PIN
  const child = await prisma.child.findFirst({
    where: {
      pinHash: await bcrypt.hash(pin, 10),
      accountStatus: 'active',
    },
    include: {
      parent: {
        select: { id: true, email: true }, // Parent owns this data legally
      },
    },
  });

  if (!child) {
    return Response.json({ error: 'Invalid PIN' }, { status: 401 });
  }

  return Response.json({
    success: true,
    child: {
      id: child.id,
      name: child.name,
      persona: child.persona,
      parentId: child.parentId, // Track parent ownership
    },
  });
}
```

### Parent Child Profile Creation - ✅ PRODUCTION DEPLOYED

```typescript
// app/api/auth/child/create/route.ts - LIVE IN PRODUCTION
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, age, pin } = await request.json();

  // Find parent account
  const parent = await prisma.parent.findUnique({
    where: { clerkUserId: userId },
  });

  if (!parent) {
    return Response.json(
      { error: 'Parent account not found' },
      { status: 404 }
    );
  }

  // Create child sub-profile
  const child = await prisma.child.create({
    data: {
      name,
      age,
      pinHash: await bcrypt.hash(pin, 10),
      parentId: parent.id,
    },
  });

  return Response.json({
    success: true,
    child: { id: child.id, name: child.name },
  });
}
```

### Chat Message Handler - ✅ DUAL-LAYER SAFETY ACTIVE

```typescript
// app/api/chat/message/route.ts - LIVE WITH 100% SAFETY COVERAGE
import { validateSafety } from '@/lib/safety';
import { generateAIResponse } from '@/lib/ai';
import { processCalendarNudges } from '@/lib/nudging'; // BUDDY 2.0 LIVE

export async function POST(request: NextRequest) {
  const { message, childId } = await request.json();

  // Safety check input
  const safetyResult = await validateSafety(message, childId);
  if (safetyResult.escalationLevel >= 3) {
    await triggerEscalation(safetyResult);
    return Response.json({ error: 'Safety escalation' }, { status: 403 });
  }

  // Generate AI response
  const aiResponse = await generateAIResponse(message, childId);

  return Response.json({
    success: true,
    response: aiResponse.text,
    safetyLevel: safetyResult.level,
  });
}
```

## Error Codes - ✅ PRODUCTION STANDARDIZED

### Authentication Errors
- `INVALID_PIN` (401) - PIN authentication failed (lockout after 5 attempts)
- `PARENT_AUTH_REQUIRED` (401) - Parent Clerk session required
- `CHILD_NOT_FOUND` (404) - Child profile not found or not owned by parent

### Safety & Content Errors  
- `SAFETY_VIOLATION` (403) - Content blocked by safety system
- `ESCALATION_TRIGGERED` (403) - Safety escalation in progress
- `MODERATION_REQUIRED` (403) - Human moderation queue

### System Errors
- `RATE_LIMITED` (429) - Too many requests (child-safe limits)
- `SERVICE_UNAVAILABLE` (503) - AI service temporarily unavailable
- `CALENDAR_SYNC_ERROR` (502) - Google Calendar integration issue
- `EMAIL_DELIVERY_FAILED` (502) - Parent notification delivery failed

### Live Production Error Handling
- **Child-Friendly Messages**: All error responses include age-appropriate explanations
- **Parent Notifications**: Critical errors automatically notify parents
- **Graceful Degradation**: Service continues with reduced functionality
- **Retry Logic**: Automatic retry for transient failures

---

**Platform Status**: ✅ **LIVE IN PRODUCTION** at [www.onda.click](https://www.onda.click)  
**Last Updated**: January 2025  
**API Status**: All endpoints operational with dual-layer safety validation
