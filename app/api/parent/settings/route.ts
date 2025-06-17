import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const settings = await prisma.parentSettings.findUnique({
      where: { parentClerkUserId: userId },
    });

    // Return default settings if none exist
    if (!settings) {
      return NextResponse.json({
        dailyTimeLimitMinutes: null,
        emailSummaryEnabled: true,
        summaryEmail: null,
        emailSummaryFrequency: 'weekly',
        emergencyAlertsEnabled: true,
        safetyLevel: 'standard',
      });
    }

    return NextResponse.json({
      dailyTimeLimitMinutes: settings.dailyTimeLimitMinutes,
      weeklyTimeLimitMinutes: settings.weeklyTimeLimitMinutes,
      timeWarningMinutes: settings.timeWarningMinutes,
      timeEndBehavior: settings.timeEndBehavior,
      allowedStartHour: settings.allowedStartHour,
      allowedEndHour: settings.allowedEndHour,
      restrictWeekends: settings.restrictWeekends,
      emailSummaryEnabled: settings.emailSummaryEnabled,
      emailSummaryFrequency: settings.emailSummaryFrequency,
      summaryEmail: settings.summaryEmail,
      emergencyAlertsEnabled: settings.emergencyAlertsEnabled,
      emergencyEmail: settings.emergencyEmail,
      emergencyPhone: settings.emergencyPhone,
      dataRetentionDays: settings.dataRetentionDays,
      shareUsageAnalytics: settings.shareUsageAnalytics,
      allowDataExport: settings.allowDataExport,
      allowedTopics: settings.allowedTopics,
      blockedTopics: settings.blockedTopics,
      safetyLevel: settings.safetyLevel,
    });
  } catch (error) {
    console.error('Parent settings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate and sanitize input
    const updateData: any = {};

    if (body.dailyTimeLimitMinutes !== undefined) {
      updateData.dailyTimeLimitMinutes = body.dailyTimeLimitMinutes
        ? parseInt(body.dailyTimeLimitMinutes)
        : null;
    }

    if (body.weeklyTimeLimitMinutes !== undefined) {
      updateData.weeklyTimeLimitMinutes = body.weeklyTimeLimitMinutes
        ? parseInt(body.weeklyTimeLimitMinutes)
        : null;
    }

    if (body.timeWarningMinutes !== undefined) {
      updateData.timeWarningMinutes = parseInt(body.timeWarningMinutes) || 10;
    }

    if (body.timeEndBehavior !== undefined) {
      updateData.timeEndBehavior = body.timeEndBehavior;
    }

    if (body.allowedStartHour !== undefined) {
      updateData.allowedStartHour = body.allowedStartHour
        ? parseInt(body.allowedStartHour)
        : null;
    }

    if (body.allowedEndHour !== undefined) {
      updateData.allowedEndHour = body.allowedEndHour
        ? parseInt(body.allowedEndHour)
        : null;
    }

    if (body.restrictWeekends !== undefined) {
      updateData.restrictWeekends = Boolean(body.restrictWeekends);
    }

    if (body.emailSummaryEnabled !== undefined) {
      updateData.emailSummaryEnabled = Boolean(body.emailSummaryEnabled);
    }

    if (body.emailSummaryFrequency !== undefined) {
      updateData.emailSummaryFrequency = body.emailSummaryFrequency;
    }

    if (body.summaryEmail !== undefined) {
      updateData.summaryEmail = body.summaryEmail || null;
    }

    if (body.emergencyAlertsEnabled !== undefined) {
      updateData.emergencyAlertsEnabled = Boolean(body.emergencyAlertsEnabled);
    }

    if (body.emergencyEmail !== undefined) {
      updateData.emergencyEmail = body.emergencyEmail || null;
    }

    if (body.emergencyPhone !== undefined) {
      updateData.emergencyPhone = body.emergencyPhone || null;
    }

    if (body.dataRetentionDays !== undefined) {
      updateData.dataRetentionDays = parseInt(body.dataRetentionDays) || 90;
    }

    if (body.shareUsageAnalytics !== undefined) {
      updateData.shareUsageAnalytics = Boolean(body.shareUsageAnalytics);
    }

    if (body.allowDataExport !== undefined) {
      updateData.allowDataExport = Boolean(body.allowDataExport);
    }

    if (body.allowedTopics !== undefined) {
      updateData.allowedTopics = Array.isArray(body.allowedTopics)
        ? body.allowedTopics
        : [];
    }

    if (body.blockedTopics !== undefined) {
      updateData.blockedTopics = Array.isArray(body.blockedTopics)
        ? body.blockedTopics
        : [];
    }

    if (body.safetyLevel !== undefined) {
      updateData.safetyLevel = body.safetyLevel;
    }

    // Upsert settings
    const settings = await prisma.parentSettings.upsert({
      where: { parentClerkUserId: userId },
      update: updateData,
      create: {
        parentClerkUserId: userId,
        ...updateData,
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Parent settings PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
