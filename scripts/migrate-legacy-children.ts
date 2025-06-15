#!/usr/bin/env ts-node

/**
 * Critical Migration Script: Legacy Data to Clerk-based Architecture
 *
 * This script migrates data from the old PIN-based models to the new Clerk-based models:
 * - Child → ChildAccount
 * - Conversation → NewConversation
 * - Message → NewMessage
 * - SafetyEvent → NewSafetyEvent
 * - ParentNotification → NewParentNotification
 * - ChildMemory → NewChildMemory
 *
 * CRITICAL: Run this before updating the Prisma schema to avoid data loss
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationStats {
  children: number;
  conversations: number;
  messages: number;
  safetyEvents: number;
  notifications: number;
  memories: number;
}

async function main() {
  console.log(
    '🚨 Starting critical data migration from legacy to Clerk-based models...\n'
  );

  const stats: MigrationStats = {
    children: 0,
    conversations: 0,
    messages: 0,
    safetyEvents: 0,
    notifications: 0,
    memories: 0,
  };

  try {
    // Step 1: Check what legacy data exists
    console.log('📊 Analyzing existing legacy data...');
    const legacyChildren = await prisma.child.count();
    const legacyConversations = await prisma.conversation.count();
    const legacyMessages = await prisma.message.count();
    const legacySafetyEvents = await prisma.safetyEvent.count();
    const legacyNotifications = await prisma.parentNotification.count();
    const legacyMemories = await prisma.childMemory.count();

    console.log(`Legacy data found:
    - Children: ${legacyChildren}
    - Conversations: ${legacyConversations}  
    - Messages: ${legacyMessages}
    - Safety Events: ${legacySafetyEvents}
    - Notifications: ${legacyNotifications}
    - Memories: ${legacyMemories}\n`);

    if (legacyChildren === 0) {
      console.log('✅ No legacy data found. Migration not needed.');
      return;
    }

    // Step 2: Migrate Children to ChildAccounts
    console.log('👶 Migrating Children to ChildAccounts...');
    const children = await prisma.child.findMany({
      include: {
        parent: true,
      },
    });

    for (const child of children) {
      // Generate unique username from name + random suffix
      const baseUsername = child.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const username = `${baseUsername}_${Math.random().toString(36).substr(2, 4)}`;

      // For migration, we'll create a placeholder clerkUserId
      // In real implementation, these would be actual Clerk user IDs
      const clerkUserId = `user_migration_${child.id}`;

      await prisma.childAccount.create({
        data: {
          id: child.id, // Keep same ID for referential integrity
          clerkUserId,
          parentClerkUserId: child.parent.clerkUserId,
          username,
          name: child.name,
          age: child.age,
          persona: child.persona,
          languageLevel: child.languageLevel,
          preferredName: child.preferredName,
          visibilityLevel: child.visibilityLevel,
          accountStatus: child.accountStatus,
          createdAt: child.createdAt,
          updatedAt: child.updatedAt,
        },
      });

      stats.children++;
    }

    // Step 3: Migrate Conversations to NewConversations
    console.log('💬 Migrating Conversations to NewConversations...');
    const conversations = await prisma.conversation.findMany();

    for (const conversation of conversations) {
      await prisma.newConversation.create({
        data: {
          id: conversation.id, // Keep same ID for referential integrity
          childAccountId: conversation.childId, // Maps to the migrated child
          startedAt: conversation.startedAt,
          endedAt: conversation.endedAt,
          lastActivity: conversation.lastActivity,
          messageCount: conversation.messageCount,
          durationSeconds: conversation.durationSeconds,
          mood: conversation.mood,
          moodConfidence: conversation.moodConfidence,
          emotionalTrend: conversation.emotionalTrend,
          topics: conversation.topics,
          safetyLevel: conversation.safetyLevel,
          parentSummary: conversation.parentSummary,
          escalationLevel: conversation.escalationLevel,
        },
      });

      stats.conversations++;
    }

    // Step 4: Migrate Messages to NewMessages
    console.log('📝 Migrating Messages to NewMessages...');
    const messages = await prisma.message.findMany();

    for (const message of messages) {
      await prisma.newMessage.create({
        data: {
          id: message.id, // Keep same ID for referential integrity
          conversationId: message.conversationId,
          content: message.content,
          role: message.role,
          messageType: message.messageType,
          createdAt: message.createdAt,
          aiModel: message.aiModel,
          processingTimeMs: message.processingTimeMs,
          safetyScore: message.safetyScore,
          safetyFlags: message.safetyFlags,
          humanReviewed: message.humanReviewed,
          audioUrl: message.audioUrl,
          audioDurationMs: message.audioDurationMs,
        },
      });

      stats.messages++;
    }

    // Step 5: Migrate SafetyEvents to NewSafetyEvents
    console.log('🚨 Migrating SafetyEvents to NewSafetyEvents...');
    const safetyEvents = await prisma.safetyEvent.findMany();

    for (const event of safetyEvents) {
      await prisma.newSafetyEvent.create({
        data: {
          id: event.id, // Keep same ID for referential integrity
          eventType: event.eventType,
          severityLevel: event.severityLevel,
          childAccountId: event.childId, // Maps to the migrated child
          conversationId: event.conversationId,
          messageId: event.messageId,
          triggerContent: event.triggerContent,
          aiReasoning: event.aiReasoning,
          contextSummary: event.contextSummary,
          detectedAt: event.detectedAt,
          parentNotifiedAt: event.parentNotifiedAt,
          resolvedAt: event.resolvedAt,
          moderatorId: event.moderatorId,
          moderatorDecision: event.moderatorDecision,
          moderatorNotes: event.moderatorNotes,
          status: event.status,
        },
      });

      stats.safetyEvents++;
    }

    // Step 6: Migrate ParentNotifications to NewParentNotifications
    console.log(
      '📧 Migrating ParentNotifications to NewParentNotifications...'
    );
    const notifications = await prisma.parentNotification.findMany({
      include: {
        parent: true,
        child: true,
      },
    });

    for (const notification of notifications) {
      await prisma.newParentNotification.create({
        data: {
          id: notification.id, // Keep same ID for referential integrity
          parentClerkUserId: notification.parent.clerkUserId,
          childAccountId: notification.childId, // Maps to the migrated child
          notificationType: notification.notificationType,
          subject: notification.subject,
          content: notification.content,
          deliveryMethod: notification.deliveryMethod,
          sentAt: notification.sentAt,
          deliveredAt: notification.deliveredAt,
          readAt: notification.readAt,
          safetyEventId: notification.safetyEventId,
          conversationId: notification.conversationId,
          status: notification.status,
        },
      });

      stats.notifications++;
    }

    // Step 7: Migrate ChildMemory to NewChildMemory
    console.log('🧠 Migrating ChildMemory to NewChildMemory...');
    const memories = await prisma.childMemory.findMany();

    for (const memory of memories) {
      await prisma.newChildMemory.create({
        data: {
          id: memory.id, // Keep same ID for referential integrity
          childAccountId: memory.childId, // Maps to the migrated child
          memoryType: memory.memoryType,
          key: memory.key,
          value: memory.value,
          confidence: memory.confidence,
          lastReferenced: memory.lastReferenced,
          createdAt: memory.createdAt,
          sourceConversationId: memory.sourceConversationId,
          sourceMessageId: memory.sourceMessageId,
          aiReasoning: memory.aiReasoning,
        },
      });

      stats.memories++;
    }

    console.log('\n✅ Migration completed successfully!');
    console.log(`Migration statistics:
    - Children migrated: ${stats.children}
    - Conversations migrated: ${stats.conversations}
    - Messages migrated: ${stats.messages}  
    - Safety Events migrated: ${stats.safetyEvents}
    - Notifications migrated: ${stats.notifications}
    - Memories migrated: ${stats.memories}\n`);

    console.log('🔍 Verifying migration...');
    const newChildAccounts = await prisma.childAccount.count();
    const newConversations = await prisma.newConversation.count();
    const newMessages = await prisma.newMessage.count();
    const newSafetyEvents = await prisma.newSafetyEvent.count();
    const newNotifications = await prisma.newParentNotification.count();
    const newMemories = await prisma.newChildMemory.count();

    console.log(`Verification results:
    - ChildAccounts: ${newChildAccounts} (expected: ${stats.children})
    - NewConversations: ${newConversations} (expected: ${stats.conversations})
    - NewMessages: ${newMessages} (expected: ${stats.messages})
    - NewSafetyEvents: ${newSafetyEvents} (expected: ${stats.safetyEvents})
    - NewParentNotifications: ${newNotifications} (expected: ${stats.notifications})
    - NewChildMemory: ${newMemories} (expected: ${stats.memories})\n`);

    const allMatched =
      newChildAccounts === stats.children &&
      newConversations === stats.conversations &&
      newMessages === stats.messages &&
      newSafetyEvents === stats.safetyEvents &&
      newNotifications === stats.notifications &&
      newMemories === stats.memories;

    if (allMatched) {
      console.log(
        '✅ All data migrated successfully! Ready for schema update.'
      );
    } else {
      console.log(
        '❌ Migration verification failed! Check the data before proceeding.'
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export default main;
