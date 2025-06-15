/**
 * Context analyzer for detecting mood, topics, and engagement
 */

interface ConversationContext {
  detectedMood: string;
  recentTopics: string[];
  engagementLevel: string;
}

/**
 * Analyze recent messages to detect mood
 */
export function detectMood(messages: string[]): string {
  const recentText = messages.slice(-3).join(' ').toLowerCase();

  // Excitement indicators
  if (recentText.match(/(!{2,}|wow|amazing|cool|awesome|excited|yay)/)) {
    return 'excited';
  }

  // Sadness indicators
  if (recentText.match(/(sad|cry|upset|hurt|miss|lonely)/)) {
    return 'sad';
  }

  // Anxiety indicators
  if (recentText.match(/(worried|scared|nervous|afraid|anxious)/)) {
    return 'anxious';
  }

  // Curiosity indicators
  if (recentText.match(/(\?{2,}|how|why|what|wonder|curious)/)) {
    return 'curious';
  }

  return 'neutral';
}

/**
 * Extract recent topics from conversation
 */
export function extractRecentTopics(messages: string[]): string[] {
  const topics: string[] = [];
  const recentMessages = messages.slice(-5);

  // Gaming topics
  if (
    recentMessages.some(m =>
      m.match(/minecraft|roblox|fortnite|pokemon|gaming/i)
    )
  ) {
    topics.push('gaming');
  }

  // School topics
  if (
    recentMessages.some(m => m.match(/school|homework|teacher|maths|english/i))
  ) {
    topics.push('school');
  }

  // Family topics
  if (recentMessages.some(m => m.match(/mum|dad|sister|brother|family/i))) {
    topics.push('family');
  }

  // Creative topics
  if (recentMessages.some(m => m.match(/draw|paint|build|create|make|art/i))) {
    topics.push('creative');
  }

  // Story topics
  if (recentMessages.some(m => m.match(/story|tell me|once upon|imagine/i))) {
    topics.push('storytelling');
  }

  return topics;
}

/**
 * Determine engagement level based on message patterns
 */
export function analyzeEngagementLevel(messages: string[]): string {
  if (messages.length < 2) return 'normal';

  // Check message length trends
  const recentLengths = messages.slice(-3).map(m => m.length);
  const avgLength =
    recentLengths.reduce((a, b) => a + b, 0) / recentLengths.length;

  // Short responses might indicate low engagement
  if (avgLength < 20) return 'low';

  // Long, detailed responses indicate high engagement
  if (avgLength > 100) return 'high';

  // Check for questions - indicates active engagement
  const hasQuestions = messages.slice(-3).some(m => m.includes('?'));
  if (hasQuestions) return 'high';

  return 'normal';
}

/**
 * Analyze full conversation context
 */
export function analyzeConversationContext(
  messages: string[]
): ConversationContext {
  return {
    detectedMood: detectMood(messages),
    recentTopics: extractRecentTopics(messages),
    engagementLevel: analyzeEngagementLevel(messages),
  };
}
