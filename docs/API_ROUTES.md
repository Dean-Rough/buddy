# API Routes - Buddy Platform

## Core Endpoints

### Auth
- `POST /api/auth/pin/verify` - Child PIN login
- `POST /api/auth/parent/login` - Parent Clerk auth

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

### PIN Authentication
```typescript
// app/api/auth/pin/verify/route.ts
import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { pin, deviceId } = await request.json();
  
  const child = await prisma.child.findFirst({
    where: { pinHash: await bcrypt.hash(pin, 10) },
    include: { parent: true }
  });
  
  if (!child) {
    return Response.json({ error: 'Invalid PIN' }, { status: 401 });
  }
  
  return Response.json({
    success: true,
    child: { id: child.id, name: child.name, persona: child.persona }
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
    safetyLevel: safetyResult.level
  });
}
```

## Error Codes
- `INVALID_PIN` (401) - Authentication failed
- `SAFETY_VIOLATION` (403) - Content blocked
- `RATE_LIMITED` (429) - Too many requests  
- `SERVICE_UNAVAILABLE` (503) - AI service down