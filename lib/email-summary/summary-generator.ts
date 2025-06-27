import { prisma } from '@/lib/prisma';
import { WeeklyDataCollector } from './data-collector';
import { LLMAnalyzer } from './llm-analyzer';
import { EmailTemplateGenerator } from './email-template';
import { EmailService } from './email-service';
import { WeeklyData, SummaryAnalysis } from './types';

export class WeeklySummaryGenerator {
  private dataCollector: WeeklyDataCollector;
  private analyzer: LLMAnalyzer;
  private templateGenerator: EmailTemplateGenerator;
  private emailService: EmailService;

  constructor() {
    this.dataCollector = new WeeklyDataCollector();
    this.analyzer = new LLMAnalyzer();
    this.templateGenerator = new EmailTemplateGenerator();
    this.emailService = new EmailService();
  }

  /**
   * Generate weekly summaries for all parents
   */
  async generateWeeklySummaries(): Promise<void> {
    console.log('Starting weekly summary generation...');

    const { weekStart, weekEnd } = WeeklyDataCollector.getPreviousWeekRange();
    console.log(
      `Generating summaries for week: ${weekStart.toDateString()} - ${weekEnd.toDateString()}`
    );

    const parentsToProcess = await this.dataCollector.getParentsForSummaries();
    console.log(`Found ${parentsToProcess.length} parents to process`);

    let successCount = 0;
    let failureCount = 0;

    for (const parent of parentsToProcess) {
      for (const child of parent.children) {
        try {
          // Check if summary already exists
          const exists = await this.dataCollector.summaryExists(
            parent.parentClerkUserId,
            child.id,
            weekStart
          );

          if (exists) {
            console.log(
              `Summary already exists for ${child.name} (${parent.parentClerkUserId})`
            );
            continue;
          }

          await this.generateSummaryForChild(
            parent.parentClerkUserId,
            child.id,
            child.name,
            weekStart,
            weekEnd
          );

          successCount++;
          console.log(`✅ Generated summary for ${child.name}`);
        } catch (error) {
          failureCount++;
          console.error(
            `❌ Failed to generate summary for ${child.name}:`,
            error
          );

          await this.recordFailure(
            parent.parentClerkUserId,
            child.id,
            weekStart,
            error as Error
          );
        }
      }
    }

    console.log(
      `Summary generation completed: ${successCount} successful, ${failureCount} failed`
    );
  }

  /**
   * Generate summary for a specific child
   */
  async generateSummaryForChild(
    parentClerkUserId: string,
    childAccountId: string,
    childName: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<void> {
    // 1. Collect week's data
    const weeklyData = await this.dataCollector.collectWeeklyData(
      parentClerkUserId,
      childAccountId,
      weekStart,
      weekEnd
    );

    // Skip if no activity this week
    if (weeklyData.totalSessions === 0) {
      console.log(`No activity for ${childName} this week, skipping summary`);
      return;
    }

    // 2. Analyze with LLM
    const analysis = await this.analyzer.analyzeWeeklyData(weeklyData);

    // 3. Generate email content
    const { subject, htmlContent } = await this.templateGenerator.generateEmail(
      weeklyData,
      analysis
    );

    // 4. Save summary to database
    const weeklySummary = await this.saveSummaryToDatabase(
      weeklyData,
      analysis,
      subject,
      htmlContent
    );

    // 5. Send email
    await this.emailService.sendSummaryEmail(
      weeklyData.parentEmail,
      subject,
      htmlContent
    );

    // 6. Mark as sent
    await prisma.weeklySummary.update({
      where: { id: weeklySummary.id },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
      },
    });

    console.log(`📧 Sent summary email to ${weeklyData.parentEmail}`);
  }

  /**
   * Save summary data to database
   */
  private async saveSummaryToDatabase(
    weeklyData: WeeklyData,
    analysis: SummaryAnalysis,
    subject: string,
    htmlContent: string
  ) {
    const tokenCost = this.analyzer.estimateTokenUsage(weeklyData);

    return await prisma.weeklySummary.create({
      data: {
        parentClerkUserId: weeklyData.parentClerkUserId,
        childAccountId: weeklyData.childId,
        weekStart: weeklyData.weekStart,
        weekEnd: weeklyData.weekEnd,
        totalChatTime: weeklyData.totalChatTime,
        sessionCount: weeklyData.totalSessions,
        averageSessionTime:
          weeklyData.totalSessions > 0
            ? Math.round(weeklyData.totalChatTime / weeklyData.totalSessions)
            : 0,
        analysisData: analysis as any,
        emailSubject: subject,
        emailContent: htmlContent,
        tokenCost,
        generationErrors: [],
      },
    });
  }

  /**
   * Record failure for retry later
   */
  private async recordFailure(
    parentClerkUserId: string,
    childAccountId: string,
    weekStart: Date,
    error: Error
  ): Promise<void> {
    try {
      // Try to update existing record or create new one
      await prisma.weeklySummary.upsert({
        where: {
          parentClerkUserId_childAccountId_weekStart: {
            parentClerkUserId,
            childAccountId,
            weekStart,
          },
        },
        update: {
          generationErrors: {
            push: error.message,
          },
          retryCount: {
            increment: 1,
          },
        },
        create: {
          parentClerkUserId,
          childAccountId,
          weekStart,
          weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000), // Add 6 days
          totalChatTime: 0,
          sessionCount: 0,
          averageSessionTime: 0,
          analysisData: {},
          generationErrors: [error.message],
          retryCount: 1,
        },
      });
    } catch (dbError) {
      console.error('Failed to record failure:', dbError);
    }
  }

  /**
   * Retry failed summaries
   */
  async retryFailedSummaries(maxRetries: number = 3): Promise<void> {
    const failedSummaries = await prisma.weeklySummary.findMany({
      where: {
        emailSent: false,
        retryCount: {
          lt: maxRetries,
        },
        generationErrors: {
          isEmpty: false,
        },
      },
      include: {
        childAccount: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`Retrying ${failedSummaries.length} failed summaries...`);

    for (const summary of failedSummaries) {
      try {
        await this.generateSummaryForChild(
          summary.parentClerkUserId,
          summary.childAccountId,
          summary.childAccount.name,
          summary.weekStart,
          summary.weekEnd
        );
      } catch (error) {
        await this.recordFailure(
          summary.parentClerkUserId,
          summary.childAccountId,
          summary.weekStart,
          error as Error
        );
      }
    }
  }

  /**
   * Generate summary for specific parent/child (manual trigger)
   */
  async generateManualSummary(
    parentClerkUserId: string,
    childAccountId: string,
    weekStart?: Date,
    weekEnd?: Date
  ): Promise<void> {
    const dates =
      weekStart && weekEnd
        ? { weekStart, weekEnd }
        : WeeklyDataCollector.getPreviousWeekRange();

    // Get child name
    const child = await prisma.childAccount.findUnique({
      where: { id: childAccountId },
      select: { name: true },
    });

    if (!child) {
      throw new Error('Child not found');
    }

    await this.generateSummaryForChild(
      parentClerkUserId,
      childAccountId,
      child.name,
      dates.weekStart,
      dates.weekEnd
    );
  }

  /**
   * Get summary statistics
   */
  async getSummaryStats(): Promise<{
    totalGenerated: number;
    totalSent: number;
    totalFailed: number;
    averageTokenCost: number;
  }> {
    const stats = await prisma.weeklySummary.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        tokenCost: true,
      },
      _avg: {
        tokenCost: true,
      },
    });

    const sentCount = await prisma.weeklySummary.count({
      where: { emailSent: true },
    });

    const failedCount = await prisma.weeklySummary.count({
      where: {
        emailSent: false,
        generationErrors: {
          isEmpty: false,
        },
      },
    });

    return {
      totalGenerated: stats._count.id || 0,
      totalSent: sentCount,
      totalFailed: failedCount,
      averageTokenCost: stats._avg.tokenCost || 0,
    };
  }
}
