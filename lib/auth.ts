import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}

export async function verifyPin(pin: string, hashedPin: string): Promise<boolean> {
  return bcrypt.compare(pin, hashedPin);
}

export async function createChildProfile(
  parentId: string,
  name: string,
  age: number,
  pin: string
) {
  const pinHash = await hashPin(pin);
  
  return prisma.child.create({
    data: {
      parentId,
      name,
      age,
      pinHash,
    },
  });
}

export async function verifyChildPin(pin: string) {
  const children = await prisma.child.findMany({
    include: { parent: true },
  });
  
  for (const child of children) {
    const isValid = await verifyPin(pin, child.pinHash);
    if (isValid) {
      return {
        id: child.id,
        name: child.name,
        age: child.age,
        parentId: child.parentId,
      };
    }
  }
  
  return null;
}

export async function getChildProfiles(parentId: string) {
  return prisma.child.findMany({
    where: { parentId },
    select: {
      id: true,
      name: true,
      age: true,
      createdAt: true,
      accountStatus: true,
    },
  });
}
