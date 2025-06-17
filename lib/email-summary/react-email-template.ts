import { EmailRenderer } from '@/components/email/EmailRenderer';
import { WeeklyData, SummaryAnalysis, EmailTemplateData } from './types';

/**
 * React-based email template generator that replaces the old string-based system
 * Provides better maintainability, type safety, and template variants
 */
export class ReactEmailTemplateGenerator {
  /**
   * Generate email using React-based weekly summary template
   */
  async generateWeeklyEmail(
    weeklyData: WeeklyData,
    analysis: SummaryAnalysis
  ): Promise<{
    subject: string;
    htmlContent: string;
    plainTextContent: string;
  }> {
    const templateData = this.prepareWeeklyTemplateData(weeklyData, analysis);

    const subject = this.generateWeeklySubject(templateData);
    const htmlContent = EmailRenderer.renderWeeklySummary(templateData);
    const plainTextContent = EmailRenderer.generatePlainText(htmlContent);

    return { subject, htmlContent, plainTextContent };
  }

  /**
   * Generate monthly summary email (new capability)
   */
  async generateMonthlyEmail(monthlyData: {
    childName: string;
    childAge: number;
    monthStart: Date;
    monthEnd: Date;
    weeklyData: WeeklyData[];
    aggregatedAnalysis: any; // Define proper type based on your monthly analysis
  }): Promise<{
    subject: string;
    htmlContent: string;
    plainTextContent: string;
  }> {
    const templateData = this.prepareMonthlyTemplateData(monthlyData);

    const subject = `${monthlyData.childName}'s Monthly Development Summary (${monthlyData.monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`;
    const htmlContent = EmailRenderer.renderMonthlySummary(templateData);
    const plainTextContent = EmailRenderer.generatePlainText(htmlContent);

    return { subject, htmlContent, plainTextContent };
  }

  /**
   * Generate incident report email (new capability)
   */
  async generateIncidentEmail(incidentData: {
    childName: string;
    incidentType: string;
    severityLevel: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    conversationId: string;
    detectedAt: Date;
    responseDetails: any;
  }): Promise<{
    subject: string;
    htmlContent: string;
    plainTextContent: string;
  }> {
    const templateData = this.prepareIncidentTemplateData(incidentData);

    const subject = `Safety Incident Report - ${incidentData.childName} (${incidentData.severityLevel.toUpperCase()})`;
    const htmlContent = EmailRenderer.renderIncidentSummary(templateData);
    const plainTextContent = EmailRenderer.generatePlainText(htmlContent);

    return { subject, htmlContent, plainTextContent };
  }

  /**
   * Prepare template data for weekly summary (compatible with existing system)
   */
  private prepareWeeklyTemplateData(
    weeklyData: WeeklyData,
    analysis: SummaryAnalysis
  ): EmailTemplateData {
    const averageSession =
      weeklyData.totalSessions > 0
        ? Math.round(weeklyData.totalChatTime / weeklyData.totalSessions)
        : 0;

    const totalChatTimeFormatted = this.formatChatTime(
      weeklyData.totalChatTime
    );
    const weekDateRange = this.formatDateRange(
      weeklyData.weekStart,
      weeklyData.weekEnd
    );

    // Safety status formatting
    const safetyMapping = {
      all_good: {
        text: '✅ All conversations were appropriate',
        class: 'safety-good',
      },
      minor_concerns: {
        text: '⚠️ Minor safety considerations noted',
        class: 'safety-concern',
      },
      needs_attention: {
        text: '🚨 Safety concerns require attention',
        class: 'safety-concern',
      },
    };

    const safetyInfo =
      safetyMapping[analysis.safety_status] || safetyMapping['all_good'];

    return {
      childName: weeklyData.childName,
      weekDateRange,
      totalChatTime: totalChatTimeFormatted,
      sessionCount: weeklyData.totalSessions,
      avgSession: averageSession,
      overallMood: this.capitalizeFirst(analysis.overall_mood),
      moodDetails: analysis.mood_details,
      mainInterests: this.formatList(analysis.main_interests),
      learningMoments: analysis.learning_moments,
      socialEmotional: analysis.social_emotional,
      safetyStatusText: safetyInfo.text,
      safetyClass: safetyInfo.class,
      safetyDetails: analysis.safety_details,
      highlights: analysis.highlights,
      suggestedConversations: analysis.suggested_conversations,
      dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/parent`,
      unsubscribeUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/parent/email-settings`,
    };
  }

  /**
   * Prepare template data for monthly summary
   */
  private prepareMonthlyTemplateData(monthlyData: any): any {
    // Aggregate weekly data into monthly insights
    const totalSessions = monthlyData.weeklyData.reduce(
      (sum: number, week: WeeklyData) => sum + week.totalSessions,
      0
    );
    const totalChatTime = monthlyData.weeklyData.reduce(
      (sum: number, week: WeeklyData) => sum + week.totalChatTime,
      0
    );

    return {
      childName: monthlyData.childName,
      childAge: monthlyData.childAge,
      monthDateRange: monthlyData.monthStart.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
      totalChatTime: this.formatChatTime(totalChatTime),
      totalSessions,
      avgSessionLength:
        totalSessions > 0 ? Math.round(totalChatTime / totalSessions) : 0,
      weeklyTrends: monthlyData.weeklyData.map(
        (week: WeeklyData, index: number) => ({
          week: `Week ${index + 1}`,
          sessions: week.totalSessions,
          chatTime: this.formatChatTime(week.totalChatTime),
          avgMood: 'Happy', // TODO: Calculate from week data
        })
      ),
      monthlyHighlights: monthlyData.aggregatedAnalysis?.highlights || [],
      developmentalMilestones: monthlyData.aggregatedAnalysis?.milestones || [],
      concernsToMonitor: monthlyData.aggregatedAnalysis?.concerns || [],
      topInterests: monthlyData.aggregatedAnalysis?.topInterests || [],
      emotionalGrowth: monthlyData.aggregatedAnalysis?.emotionalGrowth || '',
      socialDevelopment:
        monthlyData.aggregatedAnalysis?.socialDevelopment || '',
      safetyOverview: {
        status: 'excellent' as const,
        details: '',
      },
      parentRecommendations:
        monthlyData.aggregatedAnalysis?.recommendations || [],
      dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/parent`,
      unsubscribeUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/parent/email-settings`,
    };
  }

  /**
   * Prepare template data for incident report
   */
  private prepareIncidentTemplateData(incidentData: any): any {
    return {
      childName: incidentData.childName,
      incidentDate: incidentData.detectedAt.toLocaleDateString(),
      incidentTime: incidentData.detectedAt.toLocaleTimeString(),
      severityLevel: incidentData.severityLevel,
      incidentType: incidentData.incidentType,
      description: incidentData.description,
      conversationContext: {
        duration: 15, // TODO: Get from conversation data
        messageCount: 20, // TODO: Get from conversation data
        topics: ['Safety', 'Content Filtering'], // TODO: Get from conversation data
      },
      safetyResponse: {
        immediateAction: 'Conversation redirected to appropriate topics',
        escalationTriggered: incidentData.severityLevel !== 'low',
        responseTime: '< 2 seconds',
      },
      childResponse: {
        emotionalState: 'Understanding',
        cooperationLevel: 'Cooperative',
        understandingShown: true,
      },
      recommendations: {
        immediate: ['Review incident with child', 'Check safety settings'],
        followUp: ['Monitor future conversations', 'Schedule follow-up check'],
        prevention: ['Update content filters', 'Reinforce safety guidelines'],
      },
      nextSteps: [
        'Enhanced monitoring for 24 hours',
        'Follow-up email in 24 hours',
        'Safety team review of incident',
      ],
      contactInfo: {
        supportEmail: 'safety@onda.ai',
        supportPhone: '1-800-ONDA-HELP',
      },
      dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/parent`,
      unsubscribeUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/parent/email-settings`,
    };
  }

  /**
   * Generate subject line for weekly summary
   */
  private generateWeeklySubject(data: EmailTemplateData): string {
    const weekShort = data.weekDateRange.split(' - ')[0];
    return `${data.childName}'s Week with Onda (${weekShort})`;
  }

  /**
   * Format chat time in human-readable format
   */
  private formatChatTime(totalMinutes: number): string {
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (minutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${minutes}m`;
  }

  /**
   * Format date range for display
   */
  private formatDateRange(start: Date, end: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };

    const startStr = start.toLocaleDateString('en-US', options);
    const endStr = end.toLocaleDateString('en-US', options);
    const year = end.getFullYear();

    return `${startStr} - ${endStr}, ${year}`;
  }

  /**
   * Format array as comma-separated string
   */
  private formatList(items: string[]): string {
    if (items.length === 0) return 'General conversation';
    if (items.length === 1) return items[0];
    if (items.length === 2) return items.join(' and ');

    const last = items.pop();
    return items.join(', ') + ', and ' + last;
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Validate template data before rendering
   */
  validateTemplateData(
    templateType: 'weekly' | 'monthly' | 'incident',
    data: any
  ): boolean {
    return EmailRenderer.validateTemplateData(templateType, data);
  }
}
