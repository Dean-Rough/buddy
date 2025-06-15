import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}

export async function verifyPin(
  pin: string,
  hashedPin: string
): Promise<boolean> {
  return bcrypt.compare(pin, hashedPin);
}

// Legacy function - replaced by Clerk child account creation
export async function createChildProfile(
  _parentId: string,
  _name: string,
  _age: number,
  _pin: string
) {
  throw new Error(
    'Legacy child creation not supported. Use Clerk child account creation.'
  );
}

// Legacy function - no longer used with Clerk auth
export async function verifyChildPin(_pin: string) {
  return null;
}

export async function getChildProfiles(parentClerkUserId: string) {
  const childAccounts = await prisma.childAccount.findMany({
    where: { parentClerkUserId },
    select: {
      id: true,
      clerkUserId: true,
      username: true,
      name: true,
      age: true,
      createdAt: true,
      accountStatus: true,
      persona: true,
      languageLevel: true,
    },
  });

  return childAccounts.map(child => ({
    id: child.id,
    name: child.name,
    age: child.age,
    createdAt: child.createdAt,
    accountStatus: child.accountStatus,
    username: child.username,
    persona: child.persona,
    languageLevel: child.languageLevel,
  }));
}
