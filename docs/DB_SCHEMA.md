# Database Schema - Buddy Platform

## Prisma Schema Reference
Complete schema available in `/prisma/schema.prisma`

## Quick Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with test data
npx prisma db seed
```

## Core Models

### Key Relationships
```
Parent 1:N Child 1:N Conversation 1:N Message
Parent 1:N ParentNotification
Child 1:N SafetyEvent 1:N Message
Child 1:N ChildMemory
SafetyEvent N:1 Moderator
```

### Essential Queries
```typescript
// Get child with parent
const child = await prisma.child.findUnique({
  where: { id: childId },
  include: { parent: true }
});

// Get conversations with messages
const conversations = await prisma.conversation.findMany({
  where: { childId },
  include: { messages: true },
  orderBy: { startedAt: 'desc' }
});

// Create safety event with escalation
const safetyEvent = await prisma.safetyEvent.create({
  data: {
    eventType: 'escalation',
    severityLevel: 3,
    childId,
    triggerContent: message,
    aiReasoning: analysis
  }
});
```

### Data Operations
```typescript
// PIN authentication
const child = await prisma.child.findFirst({
  where: { 
    pinHash: await bcrypt.hash(pin, 10),
    accountStatus: 'active'
  }
});

// Log conversation with safety analysis
await prisma.conversation.create({
  data: {
    childId,
    messages: {
      create: [
        { content: userMessage, role: 'child' },
        { 
          content: aiResponse, 
          role: 'assistant',
          safetyScore: 0.95,
          safetyFlags: []
        }
      ]
    }
  }
});

// Store child memory
await prisma.childMemory.upsert({
  where: { 
    childId_memoryType_key: {
      childId,
      memoryType: 'preference',
      key: 'favorite_color'
    }
  },
  update: { value: 'blue', lastReferenced: new Date() },
  create: { childId, memoryType: 'preference', key: 'favorite_color', value: 'blue' }
});
```

## COPPA/GDPR Utilities
```typescript
// Data export for child (GDPR compliance)
async function exportChildData(childId: string) {
  return await prisma.child.findUnique({
    where: { id: childId },
    include: {
      conversations: {
        include: { messages: true }
      },
      memories: true,
      safetyEvents: true
    }
  });
}

// Complete data deletion (right to erasure)
async function deleteChildData(childId: string) {
  await prisma.$transaction([
    prisma.childMemory.deleteMany({ where: { childId } }),
    prisma.safetyEvent.deleteMany({ where: { childId } }),
    prisma.message.deleteMany({ 
      where: { conversation: { childId } }
    }),
    prisma.conversation.deleteMany({ where: { childId } }),
    prisma.child.delete({ where: { id: childId } })
  ]);
}