# API Routes - Lumo Platform

## Core Endpoints

### Auth

- `POST /api/auth/pin/verify` - Child PIN access to sub-profile
- `POST /api/auth/parent/login` - Parent Clerk authentication
- `POST /api/auth/child/create` - Parent creates child sub-profile
- `PUT /api/auth/child/{id}` - Parent updates child profile settings

### Chat

- `POST /api/chat/message` - Send message, get AI response
- `GET /api/chat/history` - Conversation history

### Safety

- `POST /api/safety/escalate` - Trigger safety escalation
- `GET /api/safety/moderate/{id}` - Moderation review

### Parent

- `GET /api/parent/dashboard` - Child overview
- `GET /api/parent/alerts` - Safety notifications

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

### Parent Child Profile Creation

```typescript
// app/api/auth/child/create/route.ts
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

### Chat Message Handler

```typescript
// app/api/chat/message/route.ts
import { validateSafety } from '@/lib/safety';
import { generateAIResponse } from '@/lib/ai';

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

## Error Codes

- `INVALID_PIN` (401) - Authentication failed
- `SAFETY_VIOLATION` (403) - Content blocked
- `RATE_LIMITED` (429) - Too many requests
- `SERVICE_UNAVAILABLE` (503) - AI service down
