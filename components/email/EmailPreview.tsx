'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  EmailRenderer,
  EmailTemplateType,
  MonthlyEmailData,
  IncidentEmailData,
} from './EmailRenderer';
import { EmailTemplateData } from '@/lib/email-summary/types';

interface EmailPreviewProps {
  className?: string;
}

/**
 * Email preview component for testing and development
 */
export const EmailPreview: React.FC<EmailPreviewProps> = ({
  className = '',
}) => {
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplateType>('weekly');
  const [viewMode, setViewMode] = useState<'html' | 'plaintext'>('html');
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [renderedPlainText, setRenderedPlainText] = useState<string>('');

  // Sample data for testing - memoized to prevent unnecessary re-renders
  const sampleWeeklyData: EmailTemplateData = useMemo(
    () => ({
      childName: 'Emma',
      weekDateRange: 'Dec 9 - Dec 15, 2024',
      totalChatTime: '2h 35m',
      sessionCount: 8,
      avgSession: 19,
      overallMood: 'Happy',
      moodDetails:
        'Emma showed consistent positive emotions throughout the week, with particular excitement about her art projects and upcoming school winter concert.',
      mainInterests: 'Art, music, and creative writing',
      learningMoments:
        'Emma explored different painting techniques and showed curiosity about how colors mix. She also practiced storytelling and asked thoughtful questions about character development.',
      socialEmotional:
        'Emma demonstrated strong empathy when discussing friendship challenges and showed good problem-solving skills when talking through a disagreement with a classmate.',
      safetyStatusText: '✅ All conversations were appropriate',
      safetyClass: 'safety-good',
      safetyDetails: '',
      highlights: [
        'Showed exceptional creativity in art discussions',
        'Demonstrated strong emotional intelligence when talking about friendships',
        'Asked insightful questions about storytelling and character development',
      ],
      suggestedConversations: [
        'What was your favorite part about the art project you described?',
        "Can you tell me more about the story you're writing?",
        'How did you feel when you helped your friend solve that problem?',
      ],
      dashboardUrl: 'https://onda.ai/parent',
      unsubscribeUrl: 'https://onda.ai/parent/email-settings',
    }),
    []
  );

  const sampleMonthlyData: MonthlyEmailData = useMemo(
    () => ({
      childName: 'Emma',
      childAge: 9,
      monthDateRange: 'November 2024',
      totalChatTime: '12h 45m',
      totalSessions: 32,
      avgSessionLength: 24,
      weeklyTrends: [
        { week: 'Week 1', sessions: 6, chatTime: '2h 15m', avgMood: 'Happy' },
        { week: 'Week 2', sessions: 8, chatTime: '3h 20m', avgMood: 'Excited' },
        { week: 'Week 3', sessions: 9, chatTime: '3h 45m', avgMood: 'Curious' },
        { week: 'Week 4', sessions: 9, chatTime: '3h 25m', avgMood: 'Content' },
      ],
      monthlyHighlights: [
        'Significant improvement in emotional vocabulary and expression',
        'Developed a strong interest in environmental science',
        'Showed increased confidence in problem-solving discussions',
      ],
      developmentalMilestones: [
        'Started using more complex emotional language to describe feelings',
        'Demonstrated advanced cause-and-effect reasoning in science topics',
        'Showed emerging leadership qualities in group project discussions',
      ],
      concernsToMonitor: [
        'Occasional perfectionist tendencies in creative work',
        'Sometimes hesitant to share initial ideas before fully forming them',
      ],
      topInterests: [
        'Environmental Science',
        'Creative Writing',
        'Photography',
        'Marine Biology',
        'Art',
      ],
      emotionalGrowth:
        'Emma has shown remarkable growth in emotional awareness this month. She now regularly identifies and names complex emotions, and has developed effective strategies for managing frustration during challenging tasks.',
      socialDevelopment:
        'Emma continues to demonstrate strong empathy and has taken on more of a helper role with peers. She shows excellent listening skills and often offers thoughtful advice to friends.',
      safetyOverview: {
        status: 'excellent',
        details:
          'All conversations this month were highly appropriate with no safety concerns detected.',
      },
      parentRecommendations: [
        "Continue encouraging Emma's environmental interests with nature documentaries or museum visits",
        'Consider enrolling in a creative writing workshop to nurture her storytelling skills',
        'Praise her emotional awareness while gently encouraging initial idea sharing',
      ],
      dashboardUrl: 'https://onda.ai/parent',
      unsubscribeUrl: 'https://onda.ai/parent/email-settings',
    }),
    []
  );

  const sampleIncidentData: IncidentEmailData = useMemo(
    () => ({
      childName: 'Emma',
      incidentDate: 'December 15, 2024',
      incidentTime: '3:45 PM',
      severityLevel: 'medium',
      incidentType: 'Inappropriate Content Sharing',
      description:
        'During conversation, Emma mentioned something she saw online that contained inappropriate content. The AI immediately redirected the conversation and provided age-appropriate guidance.',
      conversationContext: {
        duration: 12,
        messageCount: 15,
        topics: ['School', 'Internet Safety', 'Media Content'],
      },
      safetyResponse: {
        immediateAction:
          'Conversation was immediately redirected to age-appropriate topics. Emma was provided with gentle guidance about internet safety.',
        escalationTriggered: true,
        responseTime: '< 2 seconds',
      },
      childResponse: {
        emotionalState: 'Initially confused, then understanding',
        cooperationLevel: 'Fully cooperative',
        understandingShown: true,
      },
      recommendations: {
        immediate: [
          'Have a gentle conversation with Emma about what she saw and how she felt',
          'Review and update parental controls on her devices',
          'Reinforce the importance of talking to trusted adults about confusing content',
        ],
        followUp: [
          'Check in with Emma over the next few days about online experiences',
          'Consider scheduling a family discussion about internet safety',
          'Review her online activity for any patterns of concern',
        ],
        prevention: [
          'Install additional content filtering software',
          'Create a family media agreement with clear guidelines',
          'Establish regular check-ins about online experiences',
        ],
      },
      nextSteps: [
        "Emma's future conversations will include enhanced monitoring for 48 hours",
        'You will receive a follow-up email in 24 hours to check on the situation',
        'Our safety team will review the conversation logs to improve filtering',
      ],
      contactInfo: {
        supportEmail: 'safety@onda.ai',
        supportPhone: '1-800-ONDA-HELP',
      },
      dashboardUrl: 'https://onda.ai/parent',
      unsubscribeUrl: 'https://onda.ai/parent/email-settings',
    }),
    []
  );

  const generatePreview = useCallback(() => {
    let html = '';

    switch (selectedTemplate) {
      case 'weekly':
        html = EmailRenderer.renderWeeklySummary(sampleWeeklyData);
        break;
      case 'monthly':
        html = EmailRenderer.renderMonthlySummary(sampleMonthlyData);
        break;
      case 'incident':
        html = EmailRenderer.renderIncidentSummary(sampleIncidentData);
        break;
    }

    setRenderedHtml(html);
    setRenderedPlainText(EmailRenderer.generatePlainText(html));
  }, [
    selectedTemplate,
    sampleWeeklyData,
    sampleMonthlyData,
    sampleIncidentData,
  ]);

  React.useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  return (
    <div className={`email-preview-container ${className}`}>
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Email Template Preview</h2>

        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Template Type:
            </label>
            <select
              value={selectedTemplate}
              onChange={e =>
                setSelectedTemplate(e.target.value as EmailTemplateType)
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="weekly">Weekly Summary</option>
              <option value="monthly">Monthly Summary</option>
              <option value="incident">Incident Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">View Mode:</label>
            <select
              value={viewMode}
              onChange={e =>
                setViewMode(e.target.value as 'html' | 'plaintext')
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="html">HTML View</option>
              <option value="plaintext">Plain Text</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={generatePreview}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Regenerate Preview
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>
            <strong>Template:</strong>{' '}
            {selectedTemplate.charAt(0).toUpperCase() +
              selectedTemplate.slice(1)}{' '}
            Summary
          </p>
          <p>
            <strong>Mode:</strong>{' '}
            {viewMode === 'html'
              ? 'HTML (as rendered in email clients)'
              : 'Plain text (fallback)'}
          </p>
        </div>
      </div>

      <div className="email-preview-content">
        {viewMode === 'html' ? (
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 text-sm font-medium">
              Email Preview (HTML)
            </div>
            <div
              className="email-iframe-container"
              style={{ height: '600px', overflow: 'auto' }}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        ) : (
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 text-sm font-medium">
              Plain Text Preview
            </div>
            <pre className="p-4 text-sm whitespace-pre-wrap overflow-auto max-h-96 bg-white">
              {renderedPlainText}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Testing Notes</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • Templates are designed for 10+ email clients including Gmail,
            Outlook, Apple Mail
          </li>
          <li>• Responsive design adapts to mobile devices automatically</li>
          <li>
            • Plain text fallback ensures compatibility with all email clients
          </li>
          <li>• Dark mode styles included for supporting email clients</li>
          <li>
            • All templates include proper unsubscribe and preference management
            links
          </li>
        </ul>
      </div>
    </div>
  );
};
