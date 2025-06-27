# Database Schema - Onda Platform (Live Production)

**Status**: ✅ LIVE at [www.onda.click](https://www.onda.click) | Updated January 2025  
**Database**: NeonDB PostgreSQL with unified Clerk architecture deployed

## Prisma Schema Reference - ✅ PRODUCTION DEPLOYED

Complete live production schema available in `/prisma/schema.prisma`

## Production Database Setup - ✅ OPERATIONAL

```bash
# Production commands (LIVE DATABASE)
npx prisma generate    # Generate client for production schema
npx prisma migrate deploy  # Deploy migrations to production
npx prisma db seed     # Seed with verified production data

# Development commands
npx prisma db push     # Push schema to development DB
npx prisma studio      # Inspect database (staging only)
```

## Core Models

### Live Production Relationships - ✅ COPPA COMPLIANT

```
Parent (Clerk User) 1:N ChildAccount 1:N Conversation 1:N Message
Parent 1:N ParentNotification 1:N WeeklySummary
ChildAccount 1:N SafetyEvent 1:N ConversationContext
ChildAccount 1:N CalendarConnection (Buddy 2.0)
SafetyEvent N:1 Moderator
Parent 1:N ParentDashboardAccess (PIN protection)

Note: Unified Clerk architecture - all child data legally owned by parent (LIVE)
```

### Essential Queries

```typescript
// LIVE PRODUCTION QUERIES

// Get child account with parent (unified Clerk model)
const child = await prisma.childAccount.findUnique({
  where: { clerkUserId: childClerkUserId },
  include: { 
    parent: true,
    conversations: { orderBy: { startedAt: 'desc' } },
    safetyEvents: { where: { status: 'active' } }
  },
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
// PRODUCTION PIN authentication with lockout protection
const dashboardAccess = await prisma.parentDashboardAccess.findUnique({
  where: { parentClerkUserId },
  include: { parent: { include: { childAccounts: true } } }
});

if (dashboardAccess.failedAttempts >= 5) {
  throw new Error('Dashboard locked - too many failed attempts');
}

const isValidPin = await bcrypt.compare(pin, dashboardAccess.pinHash);

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

## COPPA/GDPR Compliance - ✅ PRODUCTION ENFORCED

### Unified Clerk Architecture (Live)

The live production system ensures COPPA compliance through unified Clerk user management where parents legally own all child data. Child accounts are managed as Clerk users under parent supervision with additional PIN protection for dashboard access.

```typescript
// LIVE PRODUCTION data export (GDPR compliance - parent-initiated only)
async function exportChildData(childClerkUserId: string, parentClerkUserId: string) {
  // Verify parent owns child account in unified Clerk system
  return await prisma.childAccount.findUnique({
    where: { 
      clerkUserId: childClerkUserId,
      parentClerkUserId: parentClerkUserId 
    },
    include: {
      parent: true, // Legal compliance
      conversations: { include: { messages: true } },
      conversationContexts: true,
      safetyEvents: true,
      calendarConnections: true, // Buddy 2.0 data
      weeklySummaries: true
    },
  });
}

// PRODUCTION data deletion (right to erasure - parent-initiated only)
async function deleteChildData(childClerkUserId: string, parentClerkUserId: string) {
  // Verify parent owns child account in unified Clerk system
  const child = await prisma.childAccount.findUnique({
    where: { 
      clerkUserId: childClerkUserId,
      parentClerkUserId: parentClerkUserId 
    },
  });

  if (!child) throw new Error('Child account not found or not owned by parent');

  // LIVE PRODUCTION deletion with complete cleanup
  await prisma.$transaction([
    prisma.conversationContext.deleteMany({ where: { childClerkUserId } }),
    prisma.safetyEvent.deleteMany({ where: { childClerkUserId } }),
    prisma.message.deleteMany({ 
      where: { conversation: { childClerkUserId } },
    }),
    prisma.conversation.deleteMany({ where: { childClerkUserId } }),
    prisma.calendarConnection.deleteMany({ where: { childClerkUserId } }),
    prisma.weeklySummary.deleteMany({ where: { childClerkUserId } }),
    // Note: Child Clerk user deleted via Clerk API separately
  ]);
}
```

---

**Platform Status**: ✅ **LIVE IN PRODUCTION** at [www.onda.click](https://www.onda.click)  
**Last Updated**: January 2025  
**Database Status**: NeonDB production with unified Clerk architecture operational
```
