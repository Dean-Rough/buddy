import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WeeklySummaryTemplate } from './WeeklySummaryTemplate';
import { MonthlySummaryTemplate } from './MonthlySummaryTemplate';
import { IncidentSummaryTemplate } from './IncidentSummaryTemplate';
import { EmailTemplateData } from '@/lib/email-summary/types';

export type EmailTemplateType = 'weekly' | 'monthly' | 'incident';

interface MonthlyEmailData {
  childName: string;
  childAge: number;
  monthDateRange: string;
  totalChatTime: string;
  totalSessions: number;
  avgSessionLength: number;
  weeklyTrends: {
    week: string;
    sessions: number;
    chatTime: string;
    avgMood: string;
  }[];
  monthlyHighlights: string[];
  developmentalMilestones: string[];
  concernsToMonitor: string[];
  topInterests: string[];
  emotionalGrowth: string;
  socialDevelopment: string;
  safetyOverview: {
    status: 'excellent' | 'good' | 'needs_attention';
    details: string;
  };
  parentRecommendations: string[];
  dashboardUrl: string;
  unsubscribeUrl: string;
}

interface IncidentEmailData {
  childName: string;
  incidentDate: string;
  incidentTime: string;
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  incidentType: string;
  description: string;
  conversationContext: {
    duration: number;
    messageCount: number;
    topics: string[];
  };
  safetyResponse: {
    immediateAction: string;
    escalationTriggered: boolean;
    responseTime: string;
  };
  childResponse: {
    emotionalState: string;
    cooperationLevel: string;
    understandingShown: boolean;
  };
  recommendations: {
    immediate: string[];
    followUp: string[];
    prevention: string[];
  };
  nextSteps: string[];
  contactInfo: {
    supportEmail: string;
    supportPhone?: string;
  };
  dashboardUrl: string;
  unsubscribeUrl: string;
}

/**
 * Email renderer service for converting React templates to HTML
 */
export class EmailRenderer {
  /**
   * Render weekly summary email template to HTML
   */
  static renderWeeklySummary(data: EmailTemplateData): string {
    const reactElement = React.createElement(WeeklySummaryTemplate, { data });
    return this.renderToHtml(reactElement);
  }

  /**
   * Render monthly summary email template to HTML
   */
  static renderMonthlySummary(data: MonthlyEmailData): string {
    const reactElement = React.createElement(MonthlySummaryTemplate, { data });
    return this.renderToHtml(reactElement);
  }

  /**
   * Render incident summary email template to HTML
   */
  static renderIncidentSummary(data: IncidentEmailData): string {
    const reactElement = React.createElement(IncidentSummaryTemplate, { data });
    return this.renderToHtml(reactElement);
  }

  /**
   * Generic template renderer with type safety
   */
  static renderTemplate<T>(templateType: EmailTemplateType, data: T): string {
    let reactElement: React.ReactElement;

    switch (templateType) {
      case 'weekly':
        reactElement = React.createElement(WeeklySummaryTemplate, {
          data: data as EmailTemplateData,
        });
        break;
      case 'monthly':
        reactElement = React.createElement(MonthlySummaryTemplate, {
          data: data as MonthlyEmailData,
        });
        break;
      case 'incident':
        reactElement = React.createElement(IncidentSummaryTemplate, {
          data: data as IncidentEmailData,
        });
        break;
      default:
        throw new Error(`Unknown template type: ${templateType}`);
    }

    return this.renderToHtml(reactElement);
  }

  /**
   * Convert React element to clean HTML string
   */
  private static renderToHtml(reactElement: React.ReactElement): string {
    const htmlString = renderToStaticMarkup(reactElement);

    // Clean up the HTML for better email client compatibility
    return this.optimizeForEmailClients(htmlString);
  }

  /**
   * Optimize HTML for email client compatibility
   */
  private static optimizeForEmailClients(html: string): string {
    return (
      html
        // Add DOCTYPE for better email client rendering
        .replace('<html>', '<!DOCTYPE html>\n<html>')
        // Ensure proper encoding
        .replace(
          '<head>',
          '<head>\n  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'
        )
        // Add MSO conditional comments for Outlook
        .replace(
          '<head>',
          '<head>\n  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->'
        )
        // Convert React className to class for HTML
        .replace(/className=/g, 'class=')
        // Ensure proper style attribute formatting
        .replace(/style="([^"]*)"/g, (match, styles) => {
          return `style="${styles.replace(/([a-zA-Z-]+):\s*([^;]+)/g, '$1: $2')}"`;
        })
        // Remove React-specific attributes
        .replace(/data-react[^=]*="[^"]*"/g, '')
        // Optimize for Outlook font rendering
        .replace(
          /<span style="([^"]*font-family:[^"]*)">/g,
          '<span style="$1; mso-font-alt: Arial, sans-serif;">'
        )
    );
  }

  /**
   * Generate plain text version from HTML
   */
  static generatePlainText(html: string): string {
    return (
      html
        // Remove style tags and their content
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        // Remove script tags and their content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        // Convert headers to uppercase with line breaks
        .replace(
          /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi,
          '\n\n$1\n' + '='.repeat(50) + '\n'
        )
        // Convert paragraphs to line breaks
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
        // Convert list items
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
        // Convert line breaks
        .replace(/<br[^>]*>/gi, '\n')
        // Convert links to "text (url)" format
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
        // Remove all remaining HTML tags
        .replace(/<[^>]*>/g, '')
        // Decode HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // Clean up whitespace
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/^\s+|\s+$/g, '')
        .trim()
    );
  }

  /**
   * Validate email template data
   */
  static validateTemplateData<T>(
    templateType: EmailTemplateType,
    data: T
  ): boolean {
    try {
      switch (templateType) {
        case 'weekly':
          return this.validateWeeklyData(data as EmailTemplateData);
        case 'monthly':
          return this.validateMonthlyData(data as MonthlyEmailData);
        case 'incident':
          return this.validateIncidentData(data as IncidentEmailData);
        default:
          return false;
      }
    } catch (error) {
      console.error('Template data validation failed:', error);
      return false;
    }
  }

  private static validateWeeklyData(data: EmailTemplateData): boolean {
    return !!(
      data.childName &&
      data.weekDateRange &&
      data.totalChatTime &&
      typeof data.sessionCount === 'number' &&
      data.dashboardUrl &&
      data.unsubscribeUrl
    );
  }

  private static validateMonthlyData(data: MonthlyEmailData): boolean {
    return !!(
      data.childName &&
      data.monthDateRange &&
      data.totalChatTime &&
      typeof data.totalSessions === 'number' &&
      Array.isArray(data.weeklyTrends) &&
      data.dashboardUrl &&
      data.unsubscribeUrl
    );
  }

  private static validateIncidentData(data: IncidentEmailData): boolean {
    return !!(
      data.childName &&
      data.incidentDate &&
      data.severityLevel &&
      data.incidentType &&
      data.description &&
      data.safetyResponse &&
      data.recommendations &&
      data.dashboardUrl &&
      data.unsubscribeUrl
    );
  }
}

// Export types for use in other modules
export type { MonthlyEmailData, IncidentEmailData };
