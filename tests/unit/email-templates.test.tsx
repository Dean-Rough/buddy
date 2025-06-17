import { describe, it, expect, vi } from 'vitest';
import { EmailRenderer } from '@/components/email/EmailRenderer';
import { ReactEmailTemplateGenerator } from '@/lib/email-summary/react-email-template';
import {
  EmailTemplateData,
  WeeklyData,
  SummaryAnalysis,
} from '@/lib/email-summary/types';

describe('Email Template System', () => {
  const mockWeeklyData: WeeklyData = {
    childId: 'child-123',
    childName: 'Test Child',
    childAge: 8,
    parentEmail: 'parent@test.com',
    parentClerkUserId: 'parent-123',
    weekStart: new Date('2024-06-10'),
    weekEnd: new Date('2024-06-16'),
    conversations: [
      {
        id: 'conv-1',
        date: new Date('2024-06-10'),
        duration: 15,
        messageCount: 10,
        childMessages: ['Hello!', 'How are you?'],
        aiResponses: ['Hi there!', "I'm doing great!"],
        safetyFlags: [],
        mood: 'happy',
        topics: ['greeting', 'wellbeing'],
        emotionalTrend: 'stable',
        safetyLevel: 0,
      },
    ],
    totalChatTime: 40,
    totalSessions: 2,
    safetyEvents: [],
  };

  const mockAnalysis: SummaryAnalysis = {
    overall_mood: 'positive',
    mood_details:
      'Child showed consistent positive emotions throughout the week.',
    main_interests: ['gaming', 'art', 'friends'],
    learning_moments: 'Child explored creative topics and showed curiosity.',
    social_emotional: 'Good social interaction and emotional expression.',
    safety_status: 'all_good',
    safety_details: '',
    highlights: ['Engaged well with topics', 'Showed creativity'],
    suggested_conversations: [
      'What was your favorite part?',
      'Tell me more about your art.',
    ],
  };

  const mockTemplateData: EmailTemplateData = {
    childName: 'Test Child',
    weekDateRange: 'Jun 10 - Jun 16, 2024',
    totalChatTime: '40m',
    sessionCount: 2,
    avgSession: 20,
    overallMood: 'Positive',
    moodDetails:
      'Child showed consistent positive emotions throughout the week.',
    mainInterests: 'gaming, art, and friends',
    learningMoments: 'Child explored creative topics and showed curiosity.',
    socialEmotional: 'Good social interaction and emotional expression.',
    safetyStatusText: '✅ All conversations were appropriate',
    safetyClass: 'safety-good',
    safetyDetails: '',
    highlights: ['Engaged well with topics', 'Showed creativity'],
    suggestedConversations: [
      'What was your favorite part?',
      'Tell me more about your art.',
    ],
    dashboardUrl: 'https://test.com/parent',
    unsubscribeUrl: 'https://test.com/parent/email-settings',
  };

  describe('EmailRenderer', () => {
    it('should render weekly summary template to HTML', () => {
      const html = EmailRenderer.renderWeeklySummary(mockTemplateData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Test Child');
      expect(html).toContain('Jun 10 - Jun 16, 2024');
      expect(html).toContain('40m');
      expect(html).toContain('2');
      expect(html).toContain('Positive');
      expect(html).toContain('All conversations were appropriate');
    });

    it('should generate plain text from HTML', () => {
      const html = EmailRenderer.renderWeeklySummary(mockTemplateData);
      const plainText = EmailRenderer.generatePlainText(html);

      expect(plainText).toContain('Test Child');
      expect(plainText).toContain('Jun 10 - Jun 16, 2024');
      expect(plainText).not.toContain('<html>');
      expect(plainText).not.toContain('<div>');
      expect(plainText).not.toContain('class=');
    });

    it('should validate template data correctly', () => {
      expect(
        EmailRenderer.validateTemplateData('weekly', mockTemplateData)
      ).toBe(true);

      const invalidData = { ...mockTemplateData, childName: '' };
      expect(EmailRenderer.validateTemplateData('weekly', invalidData)).toBe(
        false
      );
    });

    it('should optimize HTML for email clients', () => {
      const html = EmailRenderer.renderWeeklySummary(mockTemplateData);

      // Should contain DOCTYPE
      expect(html).toMatch(/^<!DOCTYPE html>/);

      // Should use class instead of className
      expect(html).toContain('class=');
      expect(html).not.toContain('className=');

      // Should contain proper meta tags
      expect(html).toContain('Content-Type');
      expect(html).toContain('charset=UTF-8');
    });
  });

  describe('ReactEmailTemplateGenerator', () => {
    let generator: ReactEmailTemplateGenerator;

    beforeEach(() => {
      generator = new ReactEmailTemplateGenerator();
    });

    it('should generate weekly email with all required content', async () => {
      const result = await generator.generateWeeklyEmail(
        mockWeeklyData,
        mockAnalysis
      );

      expect(result.subject).toBe("Test Child's Week with Onda (Jun 10)");
      expect(result.htmlContent).toContain('<!DOCTYPE html>');
      expect(result.htmlContent).toContain('Test Child');
      expect(result.plainTextContent).toContain('Test Child');
      expect(result.plainTextContent).not.toContain('<html>');
    });

    it('should format chat time correctly', async () => {
      const testData = { ...mockWeeklyData, totalChatTime: 125 }; // 2h 5m
      const result = await generator.generateWeeklyEmail(
        testData,
        mockAnalysis
      );

      expect(result.htmlContent).toContain('2h 5m');
    });

    it('should format date range correctly', async () => {
      const result = await generator.generateWeeklyEmail(
        mockWeeklyData,
        mockAnalysis
      );

      expect(result.htmlContent).toContain('Jun 10 - Jun 16, 2024');
    });

    it('should handle safety status variations', async () => {
      const warningAnalysis = {
        ...mockAnalysis,
        safety_status: 'minor_concerns' as const,
      };
      const result = await generator.generateWeeklyEmail(
        mockWeeklyData,
        warningAnalysis
      );

      expect(result.htmlContent).toContain('Minor safety considerations noted');
      expect(result.htmlContent).toContain('safety-concern');
    });

    it('should include all highlights when present', async () => {
      const result = await generator.generateWeeklyEmail(
        mockWeeklyData,
        mockAnalysis
      );

      expect(result.htmlContent).toContain('Engaged well with topics');
      expect(result.htmlContent).toContain('Showed creativity');
    });

    it('should include conversation starters', async () => {
      const result = await generator.generateWeeklyEmail(
        mockWeeklyData,
        mockAnalysis
      );

      expect(result.htmlContent).toContain('What was your favorite part?');
      expect(result.htmlContent).toContain('Tell me more about your art.');
    });

    it('should validate template data before rendering', () => {
      expect(generator.validateTemplateData('weekly', mockTemplateData)).toBe(
        true
      );

      const invalidData = { ...mockTemplateData, childName: undefined };
      expect(generator.validateTemplateData('weekly', invalidData)).toBe(false);
    });
  });

  describe('Email Client Compatibility', () => {
    it('should generate mobile-responsive HTML', () => {
      const html = EmailRenderer.renderWeeklySummary(mockTemplateData);

      // Should contain viewport meta tag
      expect(html).toContain('viewport');

      // Should contain mobile media queries
      expect(html).toContain('@media');
      expect(html).toContain('max-width: 600px');
    });

    it('should include dark mode support', () => {
      const html = EmailRenderer.renderWeeklySummary(mockTemplateData);

      expect(html).toContain('prefers-color-scheme: dark');
    });

    it('should use email-safe CSS properties', () => {
      const html = EmailRenderer.renderWeeklySummary(mockTemplateData);

      // Should use CSS table layout for compatibility
      expect(html).toContain('display: table');
      expect(html).toContain('display: table-cell');

      // Should use inline styles for better client support
      expect(html).toContain('style=');

      // Should include fallback fonts
      expect(html).toContain('Arial');
      expect(html).toContain('sans-serif');
    });

    it('should include proper unsubscribe headers', () => {
      const html = EmailRenderer.renderWeeklySummary(mockTemplateData);

      expect(html).toContain('email-settings');
      expect(html).toContain('Email Settings');
    });
  });

  describe('Template Variants', () => {
    it('should handle monthly summary template type', () => {
      const monthlyData = {
        childName: 'Test Child',
        childAge: 8,
        monthDateRange: 'June 2024',
        totalChatTime: '8h 30m',
        totalSessions: 32,
        avgSessionLength: 16,
        weeklyTrends: [],
        monthlyHighlights: [],
        developmentalMilestones: [],
        concernsToMonitor: [],
        topInterests: [],
        emotionalGrowth: '',
        socialDevelopment: '',
        safetyOverview: { status: 'excellent' as const, details: '' },
        parentRecommendations: [],
        dashboardUrl: 'https://test.com/parent',
        unsubscribeUrl: 'https://test.com/parent/email-settings',
      };

      const html = EmailRenderer.renderMonthlySummary(monthlyData);

      expect(html).toContain('Monthly Summary');
      expect(html).toContain('June 2024');
      expect(html).toContain('Test Child');
    });

    it('should handle incident summary template type', () => {
      const incidentData = {
        childName: 'Test Child',
        incidentDate: 'June 15, 2024',
        incidentTime: '3:45 PM',
        severityLevel: 'medium' as const,
        incidentType: 'Content Filter Trigger',
        description: 'Test incident description',
        conversationContext: {
          duration: 10,
          messageCount: 15,
          topics: ['safety'],
        },
        safetyResponse: {
          immediateAction: 'Redirected',
          escalationTriggered: true,
          responseTime: '2s',
        },
        childResponse: {
          emotionalState: 'Understanding',
          cooperationLevel: 'Good',
          understandingShown: true,
        },
        recommendations: { immediate: [], followUp: [], prevention: [] },
        nextSteps: [],
        contactInfo: { supportEmail: 'test@test.com' },
        dashboardUrl: 'https://test.com/parent',
        unsubscribeUrl: 'https://test.com/parent/email-settings',
      };

      const html = EmailRenderer.renderIncidentSummary(incidentData);

      expect(html).toContain('Safety Incident Report');
      expect(html).toContain('Test Child');
      expect(html).toContain('Content Filter Trigger');
      expect(html).toContain('medium');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing optional fields gracefully', async () => {
      const generator = new ReactEmailTemplateGenerator();
      const minimalAnalysis: SummaryAnalysis = {
        overall_mood: 'positive',
        mood_details: 'Good week',
        main_interests: [],
        learning_moments: '',
        social_emotional: '',
        safety_status: 'all_good',
        safety_details: '',
        highlights: [],
        suggested_conversations: [],
      };

      const result = await generator.generateWeeklyEmail(
        mockWeeklyData,
        minimalAnalysis
      );

      expect(result.htmlContent).toContain('Test Child');
      expect(result.subject).toBeDefined();
      expect(result.plainTextContent).toBeDefined();
    });

    it('should validate and reject invalid template types', () => {
      expect(() => {
        EmailRenderer.renderTemplate('invalid' as any, mockTemplateData);
      }).toThrow('Unknown template type');
    });
  });
});
