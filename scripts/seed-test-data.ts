import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test data...');

  // Create a test parent
  const parent = await prisma.parent.upsert({
    where: { email: 'test@parent.com' },
    update: {},
    create: {
      clerkUserId: 'test_parent_123',
      email: 'test@parent.com',
      emailNotifications: true,
    },
  });

  console.log('📧 Created parent:', parent.email);

  // Create a test child account
  const child = await prisma.childAccount.upsert({
    where: { clerkUserId: 'test_child_123' },
    update: {},
    create: {
      clerkUserId: 'test_child_123',
      parentClerkUserId: parent.clerkUserId,
      username: 'testchild',
      name: 'Test Child',
      age: 8,
      persona: 'friendly-raccoon',
      languageLevel: 'foundation',
      accountStatus: 'active',
    },
  });

  console.log('👶 Created child:', child.name);

  // Create a test conversation
  const conversation = await prisma.conversation.create({
    data: {
      childAccountId: child.id,
      messageCount: 0,
    },
  });

  console.log('💬 Created conversation:', conversation.id);

  console.log('✅ Test data seeded successfully!');
  console.log(`Child Account ID: ${child.id}`);
  console.log(`Conversation ID: ${conversation.id}`);
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
