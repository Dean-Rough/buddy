import { prisma } from '@/lib/prisma';
import { WeeklyData, ConversationSummary, SafetyEventSummary } from './types';

export class WeeklyDataCollector {
  /**
   * Collect all data needed for a weekly summary
   */
  async collectWeeklyData(
    parentClerkUserId: string,
    childAccountId: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<WeeklyData> {
    // Get child information
    const child = await prisma.childAccount.findUnique({
      where: { id: childAccountId },
      select: {
        id: true,
        name: true,
        age: true,
        parent: {
          select: {
            email: true,
            clerkUserId: true,
          },
        },
      },
    });

    if (!child) {
      throw new Error(`Child account not found: ${childAccountId}`);
    }

    // Get conversations for the week
    const conversations = await prisma.conversation.findMany({
      where: {
        childAccountId,
        startedAt: {
          gte: weekStart,
          lte: weekEnd,
        },
        endedAt: { not: null }, // Only completed conversations
      },
      include: {
        messages: {
          select: {
            content: true,
            role: true,
            safetyFlags: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { startedAt: 'asc' },
    });

    // Get safety events for the week
    const safetyEvents = await prisma.safetyEvent.findMany({
      where: {
        childAccountId,
        detectedAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      select: {
        id: true,
        eventType: true,
        severityLevel: true,
        detectedAt: true,
        resolvedAt: true,
      },
      orderBy: { detectedAt: 'asc' },
    });

    // Process conversations
    const conversationSummaries: ConversationSummary[] = conversations.map(
      conv => {
        const childMessages = conv.messages
          .filter(m => m.role === 'child')
          .map(m => m.content);

        const aiResponses = conv.messages
          .filter(m => m.role === 'assistant')
          .map(m => m.content);

        // Extract all safety flags
        const safetyFlags = conv.messages
          .flatMap(m => m.safetyFlags)
          .filter((flag, index, arr) => arr.indexOf(flag) === index); // Remove duplicates

        return {
          id: conv.id,
          date: conv.startedAt,
          duration: conv.durationSeconds
            ? Math.round(conv.durationSeconds / 60)
            : 0,
          messageCount: conv.messageCount,
          childMessages,
          aiResponses,
          safetyFlags,
          mood: conv.mood || 'neutral',
          topics: conv.topics || [],
          emotionalTrend: conv.emotionalTrend || 'stable',
          safetyLevel: conv.safetyLevel,
        };
      }
    );

    // Process safety events
    const safetyEventSummaries: SafetyEventSummary[] = safetyEvents.map(
      event => ({
        id: event.id,
        eventType: event.eventType,
        severityLevel: event.severityLevel,
        date: event.detectedAt,
        resolved: !!event.resolvedAt,
      })
    );

    // Calculate totals
    const totalChatTime = conversationSummaries.reduce(
      (sum, conv) => sum + conv.duration,
      0
    );
    const totalSessions = conversationSummaries.length;

    return {
      childId: child.id,
      childName: child.name,
      childAge: child.age,
      parentEmail: child.parent.email,
      parentClerkUserId: child.parent.clerkUserId,
      weekStart,
      weekEnd,
      conversations: conversationSummaries,
      totalChatTime,
      totalSessions,
      safetyEvents: safetyEventSummaries,
    };
  }

  /**
   * Get all parents who should receive weekly summaries
   */
  async getParentsForSummaries(): Promise<
    Array<{
      parentClerkUserId: string;
      children: Array<{ id: string; name: string }>;
    }>
  > {
    const parents = await prisma.parent.findMany({
      where: {
        // Only parents with email summaries enabled
        // You may need to add this field to ParentSettings
      },
      select: {
        clerkUserId: true,
        childAccounts: {
          select: {
            id: true,
            name: true,
          },
          where: {
            accountStatus: 'active',
          },
        },
      },
    });

    return parents
      .filter(parent => parent.childAccounts.length > 0)
      .map(parent => ({
        parentClerkUserId: parent.clerkUserId,
        children: parent.childAccounts,
      }));
  }

  /**
   * Check if summary already exists for this week
   */
  async summaryExists(
    parentClerkUserId: string,
    childAccountId: string,
    weekStart: Date
  ): Promise<boolean> {
    const existing = await prisma.weeklySummary.findUnique({
      where: {
        parentClerkUserId_childAccountId_weekStart: {
          parentClerkUserId,
          childAccountId,
          weekStart,
        },
      },
    });

    return !!existing;
  }

  /**
   * Get date range for current week (Sunday to Saturday)
   */
  static getCurrentWeekRange(): { weekStart: Date; weekEnd: Date } {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Calculate start of week (last Sunday)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - currentDay);
    weekStart.setHours(0, 0, 0, 0);

    // Calculate end of week (next Saturday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
  }

  /**
   * Get date range for previous week
   */
  static getPreviousWeekRange(): { weekStart: Date; weekEnd: Date } {
    const { weekStart: currentWeekStart } = this.getCurrentWeekRange();

    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
  }

  /**
   * Prepare conversation data for LLM analysis (privacy-conscious)
   */
  prepareConversationSummary(conversation: ConversationSummary): string {
    // Don't include full messages - just topics, mood, and key indicators
    const topicSummary =
      conversation.topics.length > 0
        ? conversation.topics.join(', ')
        : 'General conversation';

    const safetyStatus =
      conversation.safetyFlags.length > 0
        ? `Safety flags: ${conversation.safetyFlags.join(', ')}`
        : 'No safety concerns';

    return `Session ${conversation.date.toDateString()}:
Duration: ${conversation.duration} minutes
Messages exchanged: ${conversation.messageCount}
Topics discussed: ${topicSummary}
Child's mood: ${conversation.mood}
Emotional trend: ${conversation.emotionalTrend}
Safety level: ${conversation.safetyLevel}/5
${safetyStatus}`;
  }
}
