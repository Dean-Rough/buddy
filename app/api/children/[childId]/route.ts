import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { childId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { childId } = params;
    const updates = await request.json();

    // Verify this child belongs to the authenticated parent
    const child = await prisma.childAccount.findFirst({
      where: {
        id: childId,
        parentClerkUserId: userId,
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found or access denied' },
        { status: 404 }
      );
    }

    // Validate allowed fields
    const allowedFields = ['name', 'parentNotes'];
    const filteredUpdates: any = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update child record
    const updatedChild = await prisma.childAccount.update({
      where: { id: childId },
      data: filteredUpdates,
    });

    return NextResponse.json({
      success: true,
      child: {
        id: updatedChild.id,
        name: updatedChild.name,
        username: updatedChild.username,
        age: updatedChild.age,
        parentNotes: updatedChild.parentNotes,
      },
    });
  } catch (error) {
    console.error('Update child error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
