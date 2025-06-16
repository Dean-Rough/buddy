import { WeeklyData, SummaryAnalysis, EmailTemplateData } from './types';

export class EmailTemplateGenerator {
  /**
   * Generate email subject and HTML content
   */
  async generateEmail(
    weeklyData: WeeklyData,
    analysis: SummaryAnalysis
  ): Promise<{ subject: string; htmlContent: string }> {
    const templateData = this.prepareTemplateData(weeklyData, analysis);
    const subject = this.generateSubject(templateData);
    const htmlContent = this.generateHtmlContent(templateData);

    return { subject, htmlContent };
  }

  /**
   * Prepare template data from weekly data and analysis
   */
  private prepareTemplateData(
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
   * Generate email subject line
   */
  private generateSubject(data: EmailTemplateData): string {
    const weekShort = data.weekDateRange.split(' - ')[0];
    return `${data.childName}'s Week with Onda (${weekShort})`;
  }

  /**
   * Generate HTML email content
   */
  private generateHtmlContent(data: EmailTemplateData): string {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.childName}'s Week with Onda</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: white;
      }
      .header {
        background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
        color: white;
        padding: 30px 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0 0 10px 0;
        font-size: 24px;
        font-weight: 600;
      }
      .header p {
        margin: 0;
        opacity: 0.9;
        font-size: 16px;
      }
      .content {
        padding: 0;
      }
      .section {
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
      }
      .section:last-child {
        border-bottom: none;
      }
      .section h2 {
        margin: 0 0 15px 0;
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
      }
      .stats {
        display: flex;
        gap: 20px;
        margin: 20px 0;
      }
      .stat {
        text-align: center;
        flex: 1;
        padding: 15px;
        background: #f8fafc;
        border-radius: 8px;
      }
      .stat strong {
        display: block;
        font-size: 20px;
        font-weight: 700;
        color: #2563eb;
        margin-bottom: 5px;
      }
      .stat span {
        font-size: 14px;
        color: #6b7280;
      }
      .highlight {
        background: #eff6ff;
        border-left: 4px solid #2563eb;
        padding: 15px;
        margin: 10px 0;
        border-radius: 0 6px 6px 0;
      }
      .safety-good {
        color: #059669;
        font-weight: 600;
      }
      .safety-concern {
        color: #dc2626;
        font-weight: 600;
      }
      .conversation-starters {
        background: #f9fafb;
        padding: 15px;
        border-radius: 8px;
        margin: 15px 0;
      }
      .conversation-starters ul {
        margin: 10px 0;
        padding-left: 20px;
      }
      .conversation-starters li {
        margin: 8px 0;
        color: #374151;
      }
      .footer {
        text-align: center;
        padding: 20px;
        background: #f9fafb;
        color: #6b7280;
        font-size: 14px;
      }
      .footer a {
        color: #2563eb;
        text-decoration: none;
      }
      .footer a:hover {
        text-decoration: underline;
      }
      
      /* Mobile responsiveness */
      @media (max-width: 600px) {
        .stats {
          flex-direction: column;
          gap: 10px;
        }
        .section {
          padding: 15px;
        }
        .header {
          padding: 20px 15px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📊 ${data.childName}'s Week with Onda</h1>
        <p>${data.weekDateRange}</p>
      </div>

      <div class="content">
        <div class="section">
          <h2>📊 This Week's Overview</h2>
          <div class="stats">
            <div class="stat">
              <strong>${data.totalChatTime}</strong>
              <span>Total chat time</span>
            </div>
            <div class="stat">
              <strong>${data.sessionCount}</strong>
              <span>Conversations</span>
            </div>
            <div class="stat">
              <strong>${data.avgSession} mins</strong>
              <span>Average length</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>😊 Emotional Wellbeing</h2>
          <p><strong>Overall mood:</strong> ${data.overallMood}</p>
          <p>${data.moodDetails}</p>
        </div>

        <div class="section">
          <h2>🎯 Interests & Learning</h2>
          <p><strong>Main interests:</strong> ${data.mainInterests}</p>
          <p><strong>Learning moments:</strong> ${data.learningMoments}</p>
        </div>

        ${
          data.socialEmotional
            ? `
        <div class="section">
          <h2>👥 Social & Emotional</h2>
          <p>${data.socialEmotional}</p>
        </div>
        `
            : ''
        }

        <div class="section">
          <h2>🛡️ Safety Status</h2>
          <p class="${data.safetyClass}">
            ${data.safetyStatusText}
          </p>
          ${data.safetyDetails ? `<p>${data.safetyDetails}</p>` : ''}
        </div>

        ${
          data.highlights.length > 0
            ? `
        <div class="section">
          <h2>✨ This Week's Highlights</h2>
          ${data.highlights.map(highlight => `<div class="highlight">${highlight}</div>`).join('')}
        </div>
        `
            : ''
        }

        <div class="section">
          <h2>💬 Family Conversation Starters</h2>
          <div class="conversation-starters">
            <p>Here are some questions to spark meaningful conversations with ${data.childName}:</p>
            <ul>
              ${data.suggestedConversations.map(conversation => `<li>${conversation}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="footer">
          <p>
            Generated by Onda AI • 
            <a href="${data.dashboardUrl}">View Dashboard</a> • 
            <a href="${data.unsubscribeUrl}">Email Settings</a>
          </p>
          <p style="margin-top: 10px; font-size: 12px; color: #9ca3af;">
            This summary is generated using privacy-safe analysis of conversation patterns.
            <br>Full conversation content is never stored or shared.
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;
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
   * Generate plain text version for email clients that don't support HTML
   */
  generatePlainTextContent(data: EmailTemplateData): string {
    return `
${data.childName}'s Week with Onda
${data.weekDateRange}

This Week's Overview:
- Total chat time: ${data.totalChatTime}
- Conversations: ${data.sessionCount}
- Average length: ${data.avgSession} minutes

Emotional Wellbeing:
Overall mood: ${data.overallMood}
${data.moodDetails}

Interests & Learning:
Main interests: ${data.mainInterests}
Learning moments: ${data.learningMoments}

${data.socialEmotional ? `Social & Emotional:\n${data.socialEmotional}\n\n` : ''}

Safety Status:
${data.safetyStatusText}
${data.safetyDetails ? data.safetyDetails : ''}

${data.highlights.length > 0 ? `This Week's Highlights:\n${data.highlights.map(h => `• ${h}`).join('\n')}\n\n` : ''}

Family Conversation Starters:
${data.suggestedConversations.map(c => `• ${c}`).join('\n')}

---
Generated by Onda AI
View Dashboard: ${data.dashboardUrl}
Email Settings: ${data.unsubscribeUrl}
    `.trim();
  }
}
