# Database Schema - Onda Platform

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
Parent (Clerk User) 1:N Child Profile 1:N Conversation 1:N Message
Parent 1:N ParentNotification
Child Profile 1:N SafetyEvent 1:N Message
Child Profile 1:N ChildMemory
SafetyEvent N:1 Moderator

Note: Child profiles are sub-accounts, not independent Clerk users (COPPA compliance)
```

### Essential Queries

```typescript
// Get child with parent
const child = await prisma.child.findUnique({
  where: { id: childId },
  include: { parent: true },
});

// Get conversations with messages
const conversations = await prisma.conversation.findMany({
  where: { childId },
  include: { messages: true },
  orderBy: { startedAt: 'desc' },
});

// Create safety event with escalation
const safetyEvent = await prisma.safetyEvent.create({
  data: {
    eventType: 'escalation',
    severityLevel: 3,
    childId,
    triggerContent: message,
    aiReasoning: analysis,
  },
});
```

### Data Operations

```typescript
// PIN authentication (validates child sub-profile)
const child = await prisma.child.findFirst({
  where: {
    pinHash: await bcrypt.hash(pin, 10),
    accountStatus: 'active',
  },
  include: { parent: true }, // Include parent for legal data ownership
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
          safetyFlags: [],
        },
      ],
    },
  },
});

// Store child memory
await prisma.childMemory.upsert({
  where: {
    childId_memoryType_key: {
      childId,
      memoryType: 'preference',
      key: 'favorite_color',
    },
  },
  update: { value: 'blue', lastReferenced: new Date() },
  create: {
    childId,
    memoryType: 'preference',
    key: 'favorite_color',
    value: 'blue',
  },
});
```

## COPPA/GDPR Utilities

### Two-Tier Authentication Compliance

The two-tier system ensures COPPA compliance by making parents the legal owners of all child data. Child profiles are sub-accounts that cannot exist independently of parent Clerk accounts.

```typescript
// Data export for child (GDPR compliance - parent-initiated only)
async function exportChildData(childId: string, parentId: string) {
  // Verify parent owns child profile
  return await prisma.child.findUnique({
    where: { id: childId, parentId },
    include: {
      parent: true, // Include parent info for legal compliance
      conversations: {
        include: { messages: true },
      },
      memories: true,
      safetyEvents: true,
    },
  });
}

// Complete data deletion (right to erasure - parent-initiated only)
async function deleteChildData(childId: string, parentId: string) {
  // Verify parent owns child profile before deletion
  const child = await prisma.child.findUnique({
    where: { id: childId, parentId },
  });

  if (!child) throw new Error('Child profile not found or not owned by parent');

  await prisma.$transaction([
    prisma.childMemory.deleteMany({ where: { childId } }),
    prisma.safetyEvent.deleteMany({ where: { childId } }),
    prisma.message.deleteMany({
      where: { conversation: { childId } },
    }),
    prisma.conversation.deleteMany({ where: { childId } }),
    prisma.child.delete({ where: { id: childId } }),
  ]);
}
```
