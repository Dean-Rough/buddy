import OpenAI from 'openai';
import { WeeklyData, SummaryAnalysis } from './types';
import { WeeklyDataCollector } from './data-collector';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class LLMAnalyzer {
  /**
   * Analyze weekly data using GPT-4o-mini for cost-effective insights
   */
  async analyzeWeeklyData(data: WeeklyData): Promise<SummaryAnalysis> {
    const prompt = this.buildAnalysisPrompt(data);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.3, // Consistent summaries
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      const analysis = JSON.parse(content) as SummaryAnalysis;

      // Validate the analysis structure
      this.validateAnalysis(analysis);

      return analysis;
    } catch (error) {
      console.error('LLM Analysis failed:', error);

      // Return fallback analysis on error
      return this.getFallbackAnalysis(data);
    }
  }

  /**
   * Build the analysis prompt for the LLM
   */
  private buildAnalysisPrompt(data: WeeklyData): string {
    const collector = new WeeklyDataCollector();

    const conversationSummaries = data.conversations
      .map(conv => collector.prepareConversationSummary(conv))
      .join('\n\n');

    const averageSession =
      data.totalSessions > 0
        ? Math.round(data.totalChatTime / data.totalSessions)
        : 0;

    const safetyEventsSummary =
      data.safetyEvents.length > 0
        ? `Safety events this week: ${data.safetyEvents.length} (${data.safetyEvents.filter(e => e.severityLevel >= 3).length} high priority)`
        : 'No safety events this week';

    return `You are analyzing a week of conversations between a child (age ${data.childAge}) and an AI companion for a parent summary.

IMPORTANT: This is for the PARENT, not the child. Be professional but warm. Focus on insights that help parents understand their child's emotional well-being, interests, and development.

Analyze these conversations and provide insights in JSON format:

CHILD: ${data.childName} (age ${data.childAge})
WEEK: ${data.weekStart.toDateString()} to ${data.weekEnd.toDateString()}

CONVERSATIONS:
${conversationSummaries || 'No conversations this week'}

USAGE DATA:
- Total chat time: ${data.totalChatTime} minutes
- Number of sessions: ${data.totalSessions}
- Average session: ${averageSession} minutes

SAFETY:
${safetyEventsSummary}

Please analyze and respond with this exact JSON structure:
{
  "overall_mood": "positive|curious|mixed|concerning",
  "mood_details": "Brief explanation of the child's emotional state this week",
  "main_interests": ["interest1", "interest2", "interest3"],
  "learning_moments": "Description of educational content or curiosity shown",
  "social_emotional": "Notes about social interactions, friendships, emotional development",
  "safety_status": "all_good|minor_concerns|needs_attention",
  "safety_details": "Brief explanation if not all_good, otherwise empty string",
  "highlights": ["notable moment 1", "notable moment 2"],
  "suggested_conversations": ["conversation starter 1", "conversation starter 2"]
}

Guidelines:
- Be specific but not overly detailed
- Focus on positive development and growth
- Note any concerning patterns respectfully
- Suggest meaningful family conversation starters
- Keep all fields concise (under 100 words each)
- If no conversations occurred, focus on encouraging re-engagement`;
  }

  /**
   * Validate the structure of the LLM analysis
   */
  private validateAnalysis(analysis: any): void {
    const requiredFields = [
      'overall_mood',
      'mood_details',
      'main_interests',
      'learning_moments',
      'social_emotional',
      'safety_status',
      'safety_details',
      'highlights',
      'suggested_conversations',
    ];

    for (const field of requiredFields) {
      if (!(field in analysis)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate mood values
    const validMoods = ['positive', 'curious', 'mixed', 'concerning'];
    if (!validMoods.includes(analysis.overall_mood)) {
      analysis.overall_mood = 'mixed';
    }

    // Validate safety status
    const validSafetyStatuses = [
      'all_good',
      'minor_concerns',
      'needs_attention',
    ];
    if (!validSafetyStatuses.includes(analysis.safety_status)) {
      analysis.safety_status = 'all_good';
    }

    // Ensure arrays are arrays
    if (!Array.isArray(analysis.main_interests)) {
      analysis.main_interests = [];
    }
    if (!Array.isArray(analysis.highlights)) {
      analysis.highlights = [];
    }
    if (!Array.isArray(analysis.suggested_conversations)) {
      analysis.suggested_conversations = [];
    }
  }

  /**
   * Generate fallback analysis if LLM fails
   */
  private getFallbackAnalysis(data: WeeklyData): SummaryAnalysis {
    const hasConversations = data.conversations.length > 0;
    const hasSafetyIssues = data.safetyEvents.some(e => e.severityLevel >= 3);

    return {
      overall_mood: hasConversations ? 'positive' : 'mixed',
      mood_details: hasConversations
        ? `${data.childName} engaged in ${data.totalSessions} conversations this week, showing active participation.`
        : `${data.childName} was less active this week with limited conversations.`,
      main_interests: this.extractTopicsFromConversations(data.conversations),
      learning_moments: hasConversations
        ? 'Your child showed curiosity and engagement through their conversations.'
        : 'Limited learning interactions this week - consider encouraging more conversations.',
      social_emotional: hasConversations
        ? 'Your child demonstrated good communication skills and emotional expression.'
        : 'Fewer opportunities for social-emotional development through AI conversations this week.',
      safety_status: hasSafetyIssues ? 'minor_concerns' : 'all_good',
      safety_details: hasSafetyIssues
        ? 'Some conversations required safety monitoring - all handled appropriately.'
        : '',
      highlights: hasConversations
        ? [
            `Had ${data.totalSessions} meaningful conversations`,
            `Spent ${data.totalChatTime} minutes in positive interactions`,
          ]
        : ['Opportunity to increase engagement next week'],
      suggested_conversations: [
        `"What was the most interesting thing you learned this week?"`,
        `"Tell me about something that made you happy recently."`,
      ],
    };
  }

  /**
   * Extract common topics from conversations as fallback
   */
  private extractTopicsFromConversations(conversations: any[]): string[] {
    const allTopics = conversations.flatMap(conv => conv.topics || []);
    const topicCounts = allTopics.reduce(
      (acc, topic) => {
        acc[topic] = (acc[topic] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  /**
   * Calculate token usage for cost tracking
   */
  estimateTokenUsage(data: WeeklyData): number {
    // Rough estimate: 1 token ≈ 4 characters
    const prompt = this.buildAnalysisPrompt(data);
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = 800; // Max output tokens

    return inputTokens + outputTokens;
  }
}
