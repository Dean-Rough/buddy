import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getChildProfiles } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const children = await getChildProfiles(userId);

    return NextResponse.json({ children });
  } catch (error) {
    console.error('Get children error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, age } = await request.json();

    if (!name || !age) {
      return NextResponse.json(
        { error: 'Name and age are required' },
        { status: 400 }
      );
    }

    if (age < 6 || age > 12) {
      return NextResponse.json(
        { error: 'Age must be between 6 and 12' },
        { status: 400 }
      );
    }

    // Get or create parent record
    let parent = await prisma.parent.findUnique({
      where: { clerkUserId: userId },
    });

    if (!parent) {
      // Create parent record - get email from Clerk
      const { currentUser } = await import('@clerk/nextjs/server');
      const user = await currentUser();

      parent = await prisma.parent.create({
        data: {
          clerkUserId: userId,
          email: user?.emailAddresses[0]?.emailAddress || '',
        },
      });
    }

    // Generate unique Clerk user ID for child (in real implementation, this would come from Clerk)
    const childClerkUserId = `child_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // Create child account directly using Prisma
    const child = await prisma.childAccount.create({
      data: {
        clerkUserId: childClerkUserId,
        parentClerkUserId: userId,
        name,
        age,
        username: name.toLowerCase().replace(/\s+/g, ''),
        accountStatus: 'active',
        persona: 'friendly-raccoon',
        languageLevel: age <= 8 ? 'foundation' : 'intermediate',
      },
    });

    return NextResponse.json({
      success: true,
      child: {
        id: child.id,
        name: child.name,
        age: child.age,
      },
    });
  } catch (error) {
    console.error('Create child error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
