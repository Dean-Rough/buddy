#!/usr/bin/env ts-node

/**
 * Cleanup Script: Remove Legacy Database Tables
 *
 * This script drops the old database tables after confirming data migration:
 * - children (legacy Child model)
 * - conversations (legacy Conversation model)
 * - messages (legacy Message model)
 * - safety_events (legacy SafetyEvent model)
 * - parent_notifications (legacy ParentNotification model)
 * - child_memory (legacy ChildMemory model)
 *
 * CRITICAL: Only run this AFTER confirming migration was successful
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Starting cleanup of legacy database tables...\n');

  try {
    // First, verify the new tables have the expected data
    console.log('🔍 Verifying new tables have migrated data...');
    const childAccounts = await prisma.childAccount.count();
    const newConversations = await prisma.conversation.count();
    const newMessages = await prisma.message.count();
    const newSafetyEvents = await prisma.safetyEvent.count();
    const newNotifications = await prisma.parentNotification.count();
    const newMemories = await prisma.childMemory.count();

    console.log(`New tables data:
    - ChildAccounts: ${childAccounts}
    - Conversations: ${newConversations}
    - Messages: ${newMessages}
    - SafetyEvents: ${newSafetyEvents}
    - ParentNotifications: ${newNotifications}
    - ChildMemory: ${newMemories}\n`);

    if (childAccounts === 0 && newConversations === 0 && newMessages === 0) {
      console.log(
        '⚠️  No data found in new tables. Aborting cleanup to prevent data loss.'
      );
      return;
    }

    // Drop legacy tables using raw SQL since the models no longer exist in schema
    console.log('🗑️  Dropping legacy tables...');

    // Drop tables in reverse dependency order to avoid foreign key constraints
    await prisma.$executeRaw`DROP TABLE IF EXISTS "child_memory" CASCADE;`;
    console.log('✓ Dropped child_memory table');

    await prisma.$executeRaw`DROP TABLE IF EXISTS "parent_notifications" CASCADE;`;
    console.log('✓ Dropped parent_notifications table');

    await prisma.$executeRaw`DROP TABLE IF EXISTS "safety_events" CASCADE;`;
    console.log('✓ Dropped safety_events table');

    await prisma.$executeRaw`DROP TABLE IF EXISTS "messages" CASCADE;`;
    console.log('✓ Dropped messages table');

    await prisma.$executeRaw`DROP TABLE IF EXISTS "conversations" CASCADE;`;
    console.log('✓ Dropped conversations table');

    await prisma.$executeRaw`DROP TABLE IF EXISTS "children" CASCADE;`;
    console.log('✓ Dropped children table');

    console.log('\n✅ Legacy table cleanup completed successfully!');
    console.log('🎯 Database schema is now unified with no duplicate models.');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    console.error(
      '\n⚠️  Manual cleanup may be required. Check database state.'
    );
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
