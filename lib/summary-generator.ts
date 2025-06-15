import { prisma } from './prisma';

export interface WeeklySummary {
  childName: string;
  childAge: number;
  weekStartDate: Date;
  weekEndDate: Date;
  totalSessions: number;
  totalMessages: number;
  averageSessionLength: number;
  moodTrends: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topTopics: string[];
  safetyEvents: {
    level1: number;
    level2: number;
    level3: number;
  };
  highlights: string[];
  concernsNoted: string[];
}

/**
 * Generate weekly summary for a child
 */
export async function generateWeeklySummary(
  childAccountId: string,
  weekStartDate: Date
): Promise<WeeklySummary | null> {
  try {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    // Get child info
    const child = await prisma.childAccount.findUnique({
      where: { id: childAccountId },
      select: { name: true, age: true },
    });

    if (!child) return null;

    // Get conversations for the week
    const conversations = await prisma.conversation.findMany({
      where: {
        childAccountId,
        startedAt: {
          gte: weekStartDate,
          lt: weekEndDate,
        },
      },
      include: {
        messages: {
          select: {
            content: true,
            role: true,
            createdAt: true,
          },
        },
        safetyEvents: {
          select: {
            severityLevel: true,
            eventType: true,
            triggerContent: true,
          },
        },
      },
    });

    // Calculate basic stats
    const totalSessions = conversations.length;
    const totalMessages = conversations.reduce(
      (sum, conv) => sum + conv.messages.length,
      0
    );
    const averageSessionLength =
      totalSessions > 0
        ? Math.round(
            conversations.reduce((sum, conv) => sum + conv.durationSeconds, 0) /
              totalSessions /
              60
          ) // in minutes
        : 0;

    // Analyze mood trends (simplified - could use AI for better analysis)
    const moodTrends = analyzeMoodTrends(conversations);

    // Extract top topics
    const topTopics = extractTopTopics(conversations);

    // Count safety events
    const safetyEvents = {
      level1: 0,
      level2: 0,
      level3: 0,
    };

    conversations.forEach(conv => {
      conv.safetyEvents.forEach(event => {
        if (event.severityLevel === 1) safetyEvents.level1++;
        else if (event.severityLevel === 2) safetyEvents.level2++;
        else if (event.severityLevel === 3) safetyEvents.level3++;
      });
    });

    // Generate highlights and concerns
    const highlights = generateHighlights(conversations, child.age);
    const concernsNoted = generateConcerns(conversations, safetyEvents);

    return {
      childName: child.name,
      childAge: child.age,
      weekStartDate,
      weekEndDate,
      totalSessions,
      totalMessages,
      averageSessionLength,
      moodTrends,
      topTopics,
      safetyEvents,
      highlights,
      concernsNoted,
    };
  } catch (error) {
    console.error('Failed to generate weekly summary:', error);
    return null;
  }
}

/**
 * Analyze mood trends from conversations
 */
function analyzeMoodTrends(conversations: any[]): WeeklySummary['moodTrends'] {
  const moodKeywords = {
    positive: [
      'happy',
      'excited',
      'love',
      'awesome',
      'cool',
      'great',
      'fun',
      'amazing',
      'good',
      'nice',
      'yay',
      'woohoo',
      'yes',
    ],
    negative: [
      'sad',
      'angry',
      'mad',
      'upset',
      'worried',
      'scared',
      'bad',
      'hate',
      'stupid',
      'dumb',
      'no',
      'awful',
      'terrible',
    ],
  };

  let positive = 0;
  let negative = 0;
  let total = 0;

  conversations.forEach(conv => {
    conv.messages.forEach((msg: any) => {
      if (msg.role === 'child') {
        total++;
        const content = msg.content.toLowerCase();

        const hasPositive = moodKeywords.positive.some(word =>
          content.includes(word)
        );
        const hasNegative = moodKeywords.negative.some(word =>
          content.includes(word)
        );

        if (hasPositive && !hasNegative) positive++;
        else if (hasNegative && !hasPositive) negative++;
      }
    });
  });

  const neutral = total - positive - negative;

  return {
    positive: total > 0 ? Math.round((positive / total) * 100) : 0,
    neutral: total > 0 ? Math.round((neutral / total) * 100) : 0,
    negative: total > 0 ? Math.round((negative / total) * 100) : 0,
  };
}

/**
 * Extract top conversation topics
 */
function extractTopTopics(conversations: any[]): string[] {
  const topicKeywords = {
    'School & Learning': [
      'school',
      'teacher',
      'homework',
      'test',
      'class',
      'study',
    ],
    'Friends & Social': ['friend', 'play', 'hangout', 'party', 'talk', 'group'],
    Family: ['mom', 'dad', 'parent', 'brother', 'sister', 'family', 'home'],
    'Hobbies & Interests': [
      'game',
      'sport',
      'music',
      'art',
      'draw',
      'read',
      'book',
    ],
    'Animals & Pets': ['dog', 'cat', 'pet', 'animal', 'bird', 'fish', 'zoo'],
    Technology: ['computer', 'phone', 'game', 'app', 'internet', 'video'],
    'Emotions & Feelings': [
      'feel',
      'emotion',
      'happy',
      'sad',
      'worried',
      'excited',
    ],
  };

  const topicCounts: { [key: string]: number } = {};

  Object.keys(topicKeywords).forEach(topic => {
    topicCounts[topic] = 0;
  });

  conversations.forEach(conv => {
    conv.messages.forEach((msg: any) => {
      if (msg.role === 'child') {
        const content = msg.content.toLowerCase();

        Object.entries(topicKeywords).forEach(([topic, keywords]) => {
          const hasKeyword = keywords.some(keyword =>
            content.includes(keyword)
          );
          if (hasKeyword) topicCounts[topic]++;
        });
      }
    });
  });

  return Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([topic]) => topic)
    .filter(topic => topicCounts[topic] > 0);
}

/**
 * Generate positive highlights from the week
 */
function generateHighlights(conversations: any[], childAge: number): string[] {
  const highlights: string[] = [];

  if (conversations.length === 0) {
    return ['No conversations this week'];
  }

  const totalMessages = conversations.reduce(
    (sum, conv) =>
      sum + conv.messages.filter((m: any) => m.role === 'child').length,
    0
  );

  if (totalMessages > 20) {
    highlights.push(`Very chatty week with ${totalMessages} messages!`);
  } else if (totalMessages > 10) {
    highlights.push(`Good engagement with ${totalMessages} messages`);
  }

  // Check for creative conversations
  const creativeWords = [
    'story',
    'imagine',
    'pretend',
    'create',
    'draw',
    'make',
  ];
  const hasCreativeChat = conversations.some(conv =>
    conv.messages.some(
      (msg: any) =>
        msg.role === 'child' &&
        creativeWords.some(word => msg.content.toLowerCase().includes(word))
    )
  );

  if (hasCreativeChat) {
    highlights.push('Engaged in creative and imaginative conversations');
  }

  // Check for learning discussions
  const learningWords = ['learn', 'know', 'understand', 'why', 'how', 'what'];
  const hasLearningChat = conversations.some(conv =>
    conv.messages.some(
      (msg: any) =>
        msg.role === 'child' &&
        learningWords.some(word => msg.content.toLowerCase().includes(word))
    )
  );

  if (hasLearningChat) {
    highlights.push('Asked thoughtful questions and showed curiosity');
  }

  // Age-specific highlights
  if (childAge <= 8 && totalMessages > 0) {
    highlights.push('Communicated well for their age group');
  } else if (childAge > 10 && totalMessages > 15) {
    highlights.push('Demonstrated strong communication skills');
  }

  return highlights.length > 0
    ? highlights
    : ['Had meaningful conversations with Onda'];
}

/**
 * Generate concerns or notes for parents
 */
function generateConcerns(
  conversations: any[],
  safetyEvents: WeeklySummary['safetyEvents']
): string[] {
  const concerns: string[] = [];

  if (safetyEvents.level3 > 0) {
    concerns.push(
      `${safetyEvents.level3} high-priority safety alerts that required immediate attention`
    );
  }

  if (safetyEvents.level2 > 2) {
    concerns.push(
      `${safetyEvents.level2} moderate safety concerns noted this week`
    );
  }

  if (conversations.length === 0) {
    concerns.push(
      'No conversations this week - consider encouraging engagement'
    );
  }

  // Check for emotional distress patterns
  const distressWords = ['sad', 'cry', 'upset', 'angry', 'scared', 'worried'];
  const distressCount = conversations.reduce(
    (count, conv) =>
      count +
      conv.messages.filter(
        (msg: any) =>
          msg.role === 'child' &&
          distressWords.some(word => msg.content.toLowerCase().includes(word))
      ).length,
    0
  );

  if (distressCount > 3) {
    concerns.push(
      'Multiple expressions of negative emotions - may want to check in'
    );
  }

  return concerns;
}

/**
 * Format summary for email
 */
export function formatSummaryForEmail(summary: WeeklySummary): string {
  const startDate = summary.weekStartDate.toLocaleDateString();
  const endDate = summary.weekEndDate.toLocaleDateString();

  return `
# Weekly Summary for ${summary.childName}

**Week of ${startDate} - ${endDate}**

## Activity Overview
- **Total chat sessions:** ${summary.totalSessions}
- **Total messages:** ${summary.totalMessages}
- **Average session length:** ${summary.averageSessionLength} minutes

## Mood & Engagement
- **Positive expressions:** ${summary.moodTrends.positive}%
- **Neutral interactions:** ${summary.moodTrends.neutral}%
- **Negative expressions:** ${summary.moodTrends.negative}%

## Top Conversation Topics
${summary.topTopics.length > 0 ? summary.topTopics.map(topic => `- ${topic}`).join('\n') : '- No specific topics identified'}

## Highlights
${summary.highlights.map(highlight => `✨ ${highlight}`).join('\n')}

## Safety & Monitoring
- **Level 1 monitoring events:** ${summary.safetyEvents.level1}
- **Level 2 attention events:** ${summary.safetyEvents.level2}
- **Level 3 escalation events:** ${summary.safetyEvents.level3}

${summary.concernsNoted.length > 0 ? `## Notes for Your Attention\n${summary.concernsNoted.map(concern => `⚠️ ${concern}`).join('\n')}` : ''}

---

*This summary was automatically generated by Onda's AI safety system. For questions or concerns, please contact support.*
  `.trim();
}
