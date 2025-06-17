import { prisma } from './prisma';
import {
  ConversationAnalyzer,
  ConversationImportance,
} from './conversation-analyzer';

export interface TimeSession {
  childAccountId: string;
  startTime: Date;
  currentTime: Date;
  lastActivity: Date;
  messageCount: number;
  dailyUsageMinutes: number;
  weeklyUsageMinutes: number;
}

export interface TimeSettings {
  dailyTimeLimitMinutes?: number;
  weeklyTimeLimitMinutes?: number;
  timeWarningMinutes: number;
  timeEndBehavior: 'hard_stop' | 'gradual' | 'warning_only';
  allowedStartHour?: number;
  allowedEndHour?: number;
  restrictWeekends: boolean;
}

export interface TimeStatus {
  isWithinAllowedHours: boolean;
  isTimeExceeded: boolean;
  shouldShowWarning: boolean;
  shouldEndConversation: boolean;
  minutesRemaining?: number;
  minutesUsedToday: number;
  minutesUsedThisWeek: number;
  warningMessage?: string;
  endingMessage?: string;
  canContinueWithOverride: boolean;
}

export interface ConversationContext {
  isInMiddleOfStory: boolean;
  isDiscussingImportantTopic: boolean;
  emotionalState: 'excited' | 'sad' | 'anxious' | 'calm' | 'neutral';
  recentMessageLength: number;
  isAskingQuestions: boolean;
  topicDepth: 'surface' | 'deep' | 'personal';
}

/**
 * Core time management class for smart conversation time limits
 */
export class TimeManager {
  /**
   * Get current time status for a child's session
   */
  static async getTimeStatus(
    childAccountId: string,
    conversationContext?: ConversationContext,
    recentMessages?: Array<{ content: string; role: string; createdAt: Date }>
  ): Promise<TimeStatus> {
    const settings = await this.getTimeSettings(childAccountId);
    const __session = await this.getCurrentSession(childAccountId);
    const usage = await this.getTodaysUsage(childAccountId);

    // Check if within allowed hours
    const isWithinAllowedHours = this.isWithinAllowedHours(settings);

    // Calculate time limits
    const dailyLimitExceeded = settings.dailyTimeLimitMinutes
      ? usage.totalMinutes >= settings.dailyTimeLimitMinutes
      : false;

    const weeklyLimitExceeded = settings.weeklyTimeLimitMinutes
      ? usage.weeklyMinutes >= settings.weeklyTimeLimitMinutes
      : false;

    const isTimeExceeded = dailyLimitExceeded || weeklyLimitExceeded;

    // Calculate remaining time
    const minutesRemaining = this.calculateRemainingTime(settings, usage);

    // Analyze conversation importance if context and messages are available
    let conversationImportance: ConversationImportance | undefined;
    if (conversationContext && recentMessages) {
      const child = await prisma.childAccount.findUnique({
        where: { id: childAccountId },
        select: { age: true },
      });

      if (child) {
        conversationImportance = ConversationAnalyzer.analyzeImportance(
          conversationContext,
          recentMessages,
          child.age
        );
      }
    }

    // Determine warning and ending behavior based on context and importance
    const shouldShowWarning = this.shouldShowWarning(
      settings,
      usage,
      minutesRemaining,
      conversationContext,
      conversationImportance
    );

    const shouldEndConversation = this.shouldEndConversation(
      settings,
      usage,
      minutesRemaining,
      conversationContext,
      conversationImportance
    );

    // Generate contextual messages
    const warningMessage = shouldShowWarning
      ? this.generateWarningMessage(minutesRemaining, conversationContext)
      : undefined;

    const endingMessage = shouldEndConversation
      ? this.generateEndingMessage(
          settings.timeEndBehavior,
          conversationContext
        )
      : undefined;

    return {
      isWithinAllowedHours,
      isTimeExceeded,
      shouldShowWarning,
      shouldEndConversation,
      minutesRemaining,
      minutesUsedToday: usage.totalMinutes,
      minutesUsedThisWeek: usage.weeklyMinutes,
      warningMessage,
      endingMessage,
      canContinueWithOverride: this.canUseParentOverride(settings),
    };
  }

  /**
   * Get time settings for a child from parent settings
   */
  private static async getTimeSettings(
    childAccountId: string
  ): Promise<TimeSettings> {
    const child = await prisma.childAccount.findUnique({
      where: { id: childAccountId },
      include: {
        parent: true,
      },
    });

    if (!child?.parent) {
      throw new Error('Child account not found or no parent associated');
    }

    // Get parent settings separately
    const parentSettings = await prisma.parentSettings.findUnique({
      where: { parentClerkUserId: child.parent.clerkUserId },
    });

    return {
      dailyTimeLimitMinutes: parentSettings?.dailyTimeLimitMinutes || undefined,
      weeklyTimeLimitMinutes:
        parentSettings?.weeklyTimeLimitMinutes || undefined,
      timeWarningMinutes: parentSettings?.timeWarningMinutes || 10,
      timeEndBehavior: (parentSettings?.timeEndBehavior as any) || 'gradual',
      allowedStartHour: parentSettings?.allowedStartHour || undefined,
      allowedEndHour: parentSettings?.allowedEndHour || undefined,
      restrictWeekends: parentSettings?.restrictWeekends || false,
    };
  }

  /**
   * Get current session information
   */
  private static async getCurrentSession(
    childAccountId: string
  ): Promise<TimeSession> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Find active conversation
    const activeConversation = await prisma.conversation.findFirst({
      where: {
        childAccountId,
        endedAt: null,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const startTime = activeConversation?.startedAt || now;
    const lastActivity = activeConversation?.messages[0]?.createdAt || now;
    const messageCount = activeConversation?.messageCount || 0;

    // Get today's usage
    const todayUsage = await this.getTodaysUsage(childAccountId);

    return {
      childAccountId,
      startTime,
      currentTime: now,
      lastActivity,
      messageCount,
      dailyUsageMinutes: todayUsage.totalMinutes,
      weeklyUsageMinutes: todayUsage.weeklyMinutes,
    };
  }

  /**
   * Get today's and this week's usage
   */
  private static async getTodaysUsage(childAccountId: string) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get today's usage
    const todayUsage = await prisma.dailyUsage.findUnique({
      where: {
        childAccountId_date: {
          childAccountId,
          date: startOfDay,
        },
      },
    });

    // Get this week's usage
    const weeklyUsage = await prisma.dailyUsage.aggregate({
      where: {
        childAccountId,
        date: {
          gte: startOfWeek,
          lte: now,
        },
      },
      _sum: {
        totalMinutes: true,
      },
    });

    return {
      totalMinutes: todayUsage?.totalMinutes || 0,
      weeklyMinutes: weeklyUsage._sum.totalMinutes || 0,
    };
  }

  /**
   * Check if current time is within allowed hours
   */
  private static isWithinAllowedHours(settings: TimeSettings): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Check weekend restrictions
    if (settings.restrictWeekends && (currentDay === 0 || currentDay === 6)) {
      return false;
    }

    // Check hourly restrictions
    if (
      settings.allowedStartHour !== undefined &&
      settings.allowedEndHour !== undefined
    ) {
      if (settings.allowedStartHour <= settings.allowedEndHour) {
        // Same day range (e.g., 9 AM to 8 PM)
        return (
          currentHour >= settings.allowedStartHour &&
          currentHour < settings.allowedEndHour
        );
      } else {
        // Cross-midnight range (e.g., 6 PM to 9 AM next day)
        return (
          currentHour >= settings.allowedStartHour ||
          currentHour < settings.allowedEndHour
        );
      }
    }

    return true;
  }

  /**
   * Calculate remaining time based on daily/weekly limits
   */
  private static calculateRemainingTime(
    settings: TimeSettings,
    usage: { totalMinutes: number; weeklyMinutes: number }
  ): number | undefined {
    const remainingTimes: number[] = [];

    if (settings.dailyTimeLimitMinutes) {
      remainingTimes.push(settings.dailyTimeLimitMinutes - usage.totalMinutes);
    }

    if (settings.weeklyTimeLimitMinutes) {
      remainingTimes.push(
        settings.weeklyTimeLimitMinutes - usage.weeklyMinutes
      );
    }

    if (remainingTimes.length === 0) return undefined;

    return Math.max(0, Math.min(...remainingTimes));
  }

  /**
   * Determine if warning should be shown based on context
   */
  private static shouldShowWarning(
    settings: TimeSettings,
    usage: { totalMinutes: number; weeklyMinutes: number },
    minutesRemaining: number | undefined,
    context?: ConversationContext,
    importance?: ConversationImportance
  ): boolean {
    if (!minutesRemaining) return false;

    // Use conversation importance to determine warning behavior
    if (importance) {
      // Don't warn during critical conversations
      if (importance.category === 'critical') {
        return false;
      }

      // Delay warnings for educational conversations
      if (importance.category === 'educational' && minutesRemaining > 2) {
        return false;
      }

      // Allow warnings for emotional conversations but with longer threshold
      if (importance.category === 'emotional' && minutesRemaining > 5) {
        return false;
      }
    }

    // Don't warn if in middle of important conversation
    if (context?.isInMiddleOfStory || context?.isDiscussingImportantTopic) {
      return false;
    }

    // Don't warn if child is in emotional state that needs support
    if (
      context?.emotionalState === 'sad' ||
      context?.emotionalState === 'anxious'
    ) {
      return false;
    }

    // Show warning when approaching time limit
    return (
      minutesRemaining <= settings.timeWarningMinutes && minutesRemaining > 0
    );
  }

  /**
   * Determine if conversation should end based on context
   */
  private static shouldEndConversation(
    settings: TimeSettings,
    usage: { totalMinutes: number; weeklyMinutes: number },
    minutesRemaining: number | undefined,
    context?: ConversationContext,
    importance?: ConversationImportance
  ): boolean {
    if (!minutesRemaining) return false;

    // Use conversation importance for intelligent override decisions
    if (importance?.canOverride && minutesRemaining <= 0) {
      const overrideTime = importance.maxOverrideMinutes;

      // Allow override if we're within the override window
      if (Math.abs(minutesRemaining) <= overrideTime) {
        return false; // Don't end yet, allow override
      }
    }

    // Hard stop behavior (but still respect critical conversations)
    if (settings.timeEndBehavior === 'hard_stop') {
      // Never hard-stop critical conversations
      if (importance?.category === 'critical') {
        return false;
      }
      return minutesRemaining <= 0;
    }

    // Warning only - never auto-end
    if (settings.timeEndBehavior === 'warning_only') {
      return false;
    }

    // Gradual ending with context awareness
    if (settings.timeEndBehavior === 'gradual') {
      // Don't end if time limit exceeded but conversation is important
      if (context?.isInMiddleOfStory || context?.isDiscussingImportantTopic) {
        return false;
      }

      // Don't end if child needs emotional support
      if (
        context?.emotionalState === 'sad' ||
        context?.emotionalState === 'anxious'
      ) {
        return false;
      }

      // Use importance-based grace periods
      let graceMinutes = 5; // Default grace period
      if (importance) {
        switch (importance.category) {
          case 'critical':
            return false; // Never end critical conversations
          case 'educational':
            graceMinutes = 10;
            break;
          case 'emotional':
            graceMinutes = 8;
            break;
          case 'casual':
            graceMinutes = 3;
            break;
          case 'trivial':
            graceMinutes = 1;
            break;
        }
      }

      // End if significantly over time limit considering importance
      return minutesRemaining <= -graceMinutes;
    }

    return false;
  }

  /**
   * Generate contextual warning message
   */
  private static generateWarningMessage(
    minutesRemaining: number | undefined,
    context?: ConversationContext
  ): string {
    if (!minutesRemaining) return '';

    const timePhrase =
      minutesRemaining === 1 ? '1 minute' : `${minutesRemaining} minutes`;

    // Gentle warnings based on emotional state
    if (context?.emotionalState === 'excited') {
      return `Hey! Just so you know, we have about ${timePhrase} left to chat today. What should we talk about next?`;
    }

    if (context?.emotionalState === 'calm') {
      return `I wanted to let you know we have ${timePhrase} left for today. Anything special you want to chat about?`;
    }

    // Default friendly warning
    return `Just a heads up - we have about ${timePhrase} left to chat today! What would you like to talk about?`;
  }

  /**
   * Generate contextual ending message
   */
  private static generateEndingMessage(
    behavior: string,
    context?: ConversationContext
  ): string {
    // Gentle ending messages
    const endings = [
      "It's been awesome chatting with you today! Time to take a break, but I'll be here tomorrow for more fun conversations! 🌟",
      "What a great chat we've had! Time flies when we're having fun. See you next time! ✨",
      "Thanks for all the cool stories today! Time for a break - but I can't wait to hear more tomorrow! 🚀",
      "You're such great company! Time to wrap up for now, but there's always more to explore together tomorrow! 🌈",
    ];

    // Choose ending based on context
    if (
      context?.emotionalState === 'sad' ||
      context?.emotionalState === 'anxious'
    ) {
      return "I really enjoyed our chat today! Remember, I'm always here when you need someone to talk to. Take care! 💙";
    }

    // Random selection for variety
    return endings[Math.floor(Math.random() * endings.length)];
  }

  /**
   * Check if parent override is available
   */
  private static canUseParentOverride(settings: TimeSettings): boolean {
    // Allow override for gradual and warning_only modes
    return settings.timeEndBehavior !== 'hard_stop';
  }

  /**
   * Update session timing for active conversation
   */
  static async updateSessionTiming(childAccountId: string): Promise<void> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Update active conversation
    await prisma.conversation.updateMany({
      where: {
        childAccountId,
        endedAt: null,
      },
      data: {
        lastActivity: now,
      },
    });

    // Update or create daily usage record
    const activeConversation = await prisma.conversation.findFirst({
      where: {
        childAccountId,
        endedAt: null,
      },
    });

    if (activeConversation) {
      const sessionMinutes = Math.floor(
        (now.getTime() - activeConversation.startedAt.getTime()) / (1000 * 60)
      );

      await prisma.dailyUsage.upsert({
        where: {
          childAccountId_date: {
            childAccountId,
            date: startOfDay,
          },
        },
        update: {
          totalMinutes: sessionMinutes,
          updatedAt: now,
        },
        create: {
          parentClerkUserId: '', // Will be filled by parent relationship
          childAccountId,
          date: startOfDay,
          totalMinutes: sessionMinutes,
          sessionCount: 1,
          messagesSent: activeConversation.messageCount,
        },
      });
    }
  }

  /**
   * End current session gracefully
   */
  static async endSession(
    childAccountId: string,
    _reason: 'time_limit' | 'manual' | 'parent_override'
  ): Promise<void> {
    const now = new Date();

    // End active conversation
    const activeConversation = await prisma.conversation.findFirst({
      where: {
        childAccountId,
        endedAt: null,
      },
    });

    if (activeConversation) {
      const sessionMinutes = Math.floor(
        (now.getTime() - activeConversation.startedAt.getTime()) / (1000 * 60)
      );

      await prisma.conversation.update({
        where: { id: activeConversation.id },
        data: {
          endedAt: now,
          durationSeconds: Math.floor(
            (now.getTime() - activeConversation.startedAt.getTime()) / 1000
          ),
        },
      });

      // Update final daily usage
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      await prisma.dailyUsage.upsert({
        where: {
          childAccountId_date: {
            childAccountId,
            date: startOfDay,
          },
        },
        update: {
          totalMinutes: sessionMinutes,
          sessionCount: { increment: 1 },
        },
        create: {
          parentClerkUserId: '', // Will be filled properly
          childAccountId,
          date: startOfDay,
          totalMinutes: sessionMinutes,
          sessionCount: 1,
          messagesSent: activeConversation.messageCount,
        },
      });
    }
  }
}

/**
 * Utility functions for time formatting and calculations
 */
export class TimeUtils {
  /**
   * Format minutes into human-readable time
   */
  static formatMinutes(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    }

    return `${hours} hour${hours === 1 ? '' : 's'} and ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;
  }

  /**
   * Get age-appropriate time warning based on child's age
   */
  static getAgeAppropriateTimeMessage(
    childAge: number,
    minutesRemaining: number
  ): string {
    const timeStr = this.formatMinutes(minutesRemaining);

    if (childAge <= 8) {
      return `We have ${timeStr} left to play together today! What should we do?`;
    } else if (childAge <= 10) {
      return `Just letting you know - we have ${timeStr} left for our chat today. Anything important to talk about?`;
    } else {
      return `Hey, we've got ${timeStr} left today. Want to wrap up what we're discussing or start something new?`;
    }
  }

  /**
   * Calculate optimal break time based on usage
   */
  static suggestBreakDuration(minutesUsed: number): number {
    // Suggest break time proportional to usage
    if (minutesUsed <= 30) return 15; // 15-minute break
    if (minutesUsed <= 60) return 30; // 30-minute break
    return 60; // 1-hour break for longer sessions
  }
}
