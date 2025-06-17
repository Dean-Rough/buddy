import OpenAI from 'openai';
import {
  WeeklyData,
  SummaryAnalysis,
  ConversationSummary,
} from '@/lib/email-summary/types';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ConversationPreprocessed {
  mood: string;
  topics: string[];
  safetyEvents: string[];
  emotionalTrend: string;
  engagementLevel: 'low' | 'medium' | 'high';
  keyInsights: string[];
}

interface AgeSpecificPrompts {
  '6-8': string;
  '9-11': string;
  '12+': string;
}

export class AISummaryGenerator {
  private agePrompts: AgeSpecificPrompts;

  constructor() {
    this.agePrompts = this.loadAgeSpecificPrompts();
  }

  /**
   * Enhanced conversation preprocessing pipeline
   * Extracts mood, topics, safety events with deeper analysis
   */
  preprocessConversations(
    conversations: ConversationSummary[]
  ): ConversationPreprocessed[] {
    return conversations.map(conv => this.preprocessSingleConversation(conv));
  }

  private preprocessSingleConversation(
    conv: ConversationSummary
  ): ConversationPreprocessed {
    // Enhanced mood analysis
    const mood = this.analyzeMoodDepth(conv.mood, conv.emotionalTrend);

    // Topic categorization and enrichment
    const topics = this.enrichTopics(conv.topics);

    // Safety event processing
    const safetyEvents = this.processSafetyEvents(
      conv.safetyFlags,
      conv.safetyLevel
    );

    // Engagement level calculation
    const engagementLevel = this.calculateEngagementLevel(
      conv.messageCount,
      conv.duration,
      conv.topics.length
    );

    // Extract key insights from conversation patterns
    const keyInsights = this.extractKeyInsights(conv);

    return {
      mood,
      topics,
      safetyEvents,
      emotionalTrend: conv.emotionalTrend,
      engagementLevel,
      keyInsights,
    };
  }

  /**
   * Generate AI summary with age-specific prompting
   */
  async generateSummary(
    weeklyData: WeeklyData,
    childAge: number
  ): Promise<SummaryAnalysis> {
    // Preprocess conversations
    const preprocessedConversations = this.preprocessConversations(
      weeklyData.conversations
    );

    // Determine age group and get appropriate prompt
    const ageGroup = this.determineAgeGroup(childAge);
    const basePrompt = this.agePrompts[ageGroup];

    // Build comprehensive analysis prompt
    const analysisPrompt = this.buildAnalysisPrompt(
      weeklyData,
      preprocessedConversations,
      basePrompt
    );

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective model
        messages: [
          {
            role: 'system',
            content: basePrompt,
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.2, // Consistent, factual summaries
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      const analysis = JSON.parse(content) as SummaryAnalysis;

      // Add cost tracking
      const tokenUsage = response.usage;
      const estimatedCost = this.calculateCost(tokenUsage);

      console.log(
        `Summary generated - Tokens: ${tokenUsage?.total_tokens}, Cost: $${estimatedCost.toFixed(6)}`
      );

      return {
        ...analysis,
        // Add metadata as additional properties (not part of SummaryAnalysis interface)
        tokenUsage: tokenUsage?.total_tokens || 0,
        estimatedCost,
        generatedAt: new Date().toISOString(),
      } as SummaryAnalysis & {
        tokenUsage: number;
        estimatedCost: number;
        generatedAt: string;
      };
    } catch (error) {
      console.error('AI Summary generation failed:', error);
      throw new Error(
        `Failed to generate AI summary: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Batch process multiple summaries for cost optimization
   */
  async generateBatchSummaries(
    summaryRequests: Array<{ data: WeeklyData; childAge: number }>
  ): Promise<SummaryAnalysis[]> {
    // Process in batches of 5 to avoid rate limits and optimize costs
    const batchSize = 5;
    const results: SummaryAnalysis[] = [];

    for (let i = 0; i < summaryRequests.length; i += batchSize) {
      const batch = summaryRequests.slice(i, i + batchSize);

      // Process batch in parallel
      const batchPromises = batch.map(({ data, childAge }) =>
        this.generateSummary(data, childAge)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      // Handle results and errors
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Batch summary ${i + index} failed:`, result.reason);
          // Add fallback summary for failed requests
          results.push(this.generateFallbackSummary(batch[index].data));
        }
      });

      // Add small delay between batches to be respectful to API
      if (i + batchSize < summaryRequests.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Enhanced emotional intelligence analysis
   */
  analyzeEmotionalIntelligence(preprocessed: ConversationPreprocessed[]): {
    overallMood: string;
    moodTrends: string[];
    emotionalGrowth: string[];
    parentRecommendations: string[];
  } {
    const moods = preprocessed.map(p => p.mood);

    // Analyze mood patterns
    const moodCounts = moods.reduce(
      (acc, mood) => {
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const dominantMood =
      Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      'neutral';

    // Track emotional trends
    const moodTrends = this.analyzeMoodProgression(moods);

    // Identify growth opportunities
    const emotionalGrowth = this.identifyEmotionalGrowth(preprocessed);

    // Generate parent recommendations
    const parentRecommendations = this.generateParentRecommendations(
      dominantMood,
      moodTrends,
      emotionalGrowth
    );

    return {
      overallMood: dominantMood,
      moodTrends,
      emotionalGrowth,
      parentRecommendations,
    };
  }

  // Private helper methods

  private loadAgeSpecificPrompts(): AgeSpecificPrompts {
    try {
      const configPath = path.join(
        process.cwd(),
        'config',
        'summary-prompts.json'
      );
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);

      return {
        '6-8': config.age_groups['6-8'].system_prompt,
        '9-11': config.age_groups['9-11'].system_prompt,
        '12+': config.age_groups['12+'].system_prompt,
      };
    } catch (error) {
      console.error(
        'Failed to load age-specific prompts, using fallback:',
        error
      );
      // Fallback prompts if config file is missing
      return {
        '6-8': `You are analyzing conversations with a young child (6-8 years old). 
        Focus on simple language, play activities, basic emotions, and family interactions.
        Keep explanations simple and highlight positive growth.`,

        '9-11': `You are analyzing conversations with a middle-grade child (9-11 years old).
        Focus on developing independence, school life, friendships, and interests.`,

        '12+': `You are analyzing conversations with a pre-teen/teen (12+ years old).
        Focus on identity development, deeper friendships, academic pressures, and emotional complexity.`,
      };
    }
  }

  private determineAgeGroup(age: number): keyof AgeSpecificPrompts {
    if (age <= 8) return '6-8';
    if (age <= 11) return '9-11';
    return '12+';
  }

  private analyzeMoodDepth(mood: string, trend: string): string {
    // Enhanced mood analysis combining base mood with trend
    if (trend === 'improving' && mood !== 'happy') {
      return `${mood} (improving)`;
    }
    if (trend === 'declining' && mood !== 'sad') {
      return `${mood} (needs attention)`;
    }
    return mood;
  }

  private enrichTopics(topics: string[]): string[] {
    // Categorize and enrich topics for better analysis
    const topicCategories = {
      academic: [
        'school',
        'homework',
        'teacher',
        'learning',
        'math',
        'reading',
      ],
      social: ['friends', 'friendship', 'classmates', 'siblings', 'family'],
      creative: ['art', 'music', 'drawing', 'writing', 'imagination'],
      gaming: ['minecraft', 'roblox', 'games', 'gaming', 'youtube'],
      emotional: ['feelings', 'emotions', 'worry', 'anxiety', 'happiness'],
    };

    const enriched = [...topics];

    topics.forEach(topic => {
      Object.entries(topicCategories).forEach(([category, keywords]) => {
        if (keywords.some(keyword => topic.toLowerCase().includes(keyword))) {
          enriched.push(`${category}_discussion`);
        }
      });
    });

    return [...new Set(enriched)]; // Remove duplicates
  }

  private processSafetyEvents(flags: string[], level: number): string[] {
    const events = [...flags];

    if (level >= 3) {
      events.push('high_safety_concern');
    } else if (level >= 2) {
      events.push('moderate_safety_concern');
    }

    return events;
  }

  private calculateEngagementLevel(
    messageCount: number,
    duration: number,
    topicCount: number
  ): 'low' | 'medium' | 'high' {
    const engagementScore = messageCount / 10 + duration / 30 + topicCount * 2;

    if (engagementScore >= 8) return 'high';
    if (engagementScore >= 4) return 'medium';
    return 'low';
  }

  private extractKeyInsights(conv: ConversationSummary): string[] {
    const insights: string[] = [];

    // High engagement indicator
    if (conv.messageCount > 20) {
      insights.push('highly_engaged_conversation');
    }

    // Long conversation indicator
    if (conv.duration > 30) {
      insights.push('extended_interaction');
    }

    // Multiple topics indicator
    if (conv.topics.length > 3) {
      insights.push('diverse_topic_exploration');
    }

    // Emotional expression
    if (conv.mood !== 'neutral') {
      insights.push(`strong_emotional_expression_${conv.mood}`);
    }

    return insights;
  }

  private buildAnalysisPrompt(
    weeklyData: WeeklyData,
    preprocessed: ConversationPreprocessed[],
    _basePrompt: string
  ): string {
    const emotionalAnalysis = this.analyzeEmotionalIntelligence(preprocessed);

    return `
Please analyze this week's conversation data for ${weeklyData.childName} (age ${weeklyData.childAge}):

SUMMARY STATISTICS:
- Total chat sessions: ${weeklyData.totalSessions}
- Total chat time: ${weeklyData.totalChatTime} minutes
- Safety events: ${weeklyData.safetyEvents.length}

CONVERSATION ANALYSIS:
${preprocessed
  .map(
    (conv, i) => `
Session ${i + 1}:
- Mood: ${conv.mood}
- Topics: ${conv.topics.join(', ')}
- Engagement: ${conv.engagementLevel}
- Key insights: ${conv.keyInsights.join(', ')}
- Safety events: ${conv.safetyEvents.join(', ') || 'None'}
`
  )
  .join('\n')}

EMOTIONAL INTELLIGENCE ANALYSIS:
- Overall mood pattern: ${emotionalAnalysis.overallMood}
- Mood trends: ${emotionalAnalysis.moodTrends.join(', ')}
- Growth areas: ${emotionalAnalysis.emotionalGrowth.join(', ')}

Return a JSON response with this structure:
{
  "summary": "Brief 2-3 sentence overview",
  "highlights": ["positive development 1", "positive development 2"],
  "concerns": ["concern 1 if any"],
  "recommendations": ["actionable parent recommendation 1", "recommendation 2"],
  "mood_analysis": "emotional development insights",
  "growth_opportunities": ["learning opportunity 1", "opportunity 2"],
  "next_week_focus": "suggested areas for parents to pay attention to",
  "metadata": {
    "engagement_level": "overall engagement rating",
    "conversation_quality": "quality assessment",
    "safety_status": "safety assessment"
  }
}`;
  }

  private calculateCost(usage: OpenAI.CompletionUsage | undefined): number {
    if (!usage) return 0;

    // GPT-4o-mini pricing (as of 2024)
    const inputCostPer1K = 0.00015; // $0.15 per 1K input tokens
    const outputCostPer1K = 0.0006; // $0.6 per 1K output tokens

    const inputCost = (usage.prompt_tokens / 1000) * inputCostPer1K;
    const outputCost = (usage.completion_tokens / 1000) * outputCostPer1K;

    return inputCost + outputCost;
  }

  private analyzeMoodProgression(moods: string[]): string[] {
    const trends = [];

    if (moods.length < 2) return ['insufficient_data'];

    let positiveCount = 0;
    let negativeCount = 0;

    moods.forEach(mood => {
      if (['happy', 'excited', 'confident'].includes(mood)) {
        positiveCount++;
      } else if (['sad', 'angry', 'frustrated', 'worried'].includes(mood)) {
        negativeCount++;
      }
    });

    const ratio = positiveCount / (positiveCount + negativeCount);

    if (ratio > 0.7) trends.push('predominantly_positive');
    if (ratio < 0.3) trends.push('needs_emotional_support');
    if (positiveCount > 0 && negativeCount > 0)
      trends.push('balanced_emotional_expression');

    return trends;
  }

  private identifyEmotionalGrowth(
    preprocessed: ConversationPreprocessed[]
  ): string[] {
    const growth = [];

    const highEngagementCount = preprocessed.filter(
      p => p.engagementLevel === 'high'
    ).length;
    if (highEngagementCount > preprocessed.length / 2) {
      growth.push('strong_communication_skills');
    }

    const diverseTopics = new Set(preprocessed.flatMap(p => p.topics)).size;
    if (diverseTopics > 5) {
      growth.push('curious_and_explorative');
    }

    return growth;
  }

  private generateParentRecommendations(
    dominantMood: string,
    trends: string[],
    growth: string[]
  ): string[] {
    const recommendations = [];

    if (trends.includes('needs_emotional_support')) {
      recommendations.push(
        'Consider having more one-on-one conversations about feelings'
      );
    }

    if (growth.includes('curious_and_explorative')) {
      recommendations.push('Encourage exploration of new topics and interests');
    }

    if (dominantMood === 'frustrated') {
      recommendations.push(
        'Look for opportunities to help with problem-solving skills'
      );
    }

    return recommendations;
  }

  private generateFallbackSummary(data: WeeklyData): SummaryAnalysis {
    return {
      overall_mood: 'mixed',
      mood_details: 'Unable to analyze due to processing error',
      main_interests: ['Regular conversation topics'],
      learning_moments: `${data.childName} had ${data.totalSessions} chat sessions this week totaling ${data.totalChatTime} minutes.`,
      social_emotional: 'Active participation in conversations',
      safety_status: data.safetyEvents.length > 0 ? 'needs_attention' : 'all_good',
      safety_details: data.safetyEvents.length > 0 ? 'Some safety events detected - please review' : 'No safety concerns',
      highlights: ['Active participation in conversations'],
      suggested_conversations: ['Continue encouraging regular communication'],
    };
  }
}
