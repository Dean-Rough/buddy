/**
 * Context Weaving Types
 * Type definitions for sophisticated conversation bridging system
 */

export interface ConversationTopic {
  id: string;
  name: string;
  keywords: string[];
  emotionalTone:
    | 'positive'
    | 'neutral'
    | 'negative'
    | 'excited'
    | 'calm'
    | 'curious';
  childEngagement: 'high' | 'medium' | 'low';
  bridgeableTo: string[]; // Other topic IDs this can naturally bridge to
  difficulty: 'easy' | 'medium' | 'hard'; // How hard it is to transition from this topic
}

export interface ParentNudgeRequest {
  id: string;
  parentClerkUserId: string;
  childAccountId: string;
  targetTopic: string; // What the parent wants to discuss
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  naturalPhrasing: string; // How parent wants it mentioned
  context?: string; // Additional context for natural integration
  createdAt: Date;
  scheduledFor?: Date; // Optional timing preference
  maxAttempts: number;
  currentAttempts: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  tags?: string[]; // Optional tags for categorization
  priority?: number; // 1-10 priority score
}

export interface ConversationBridge {
  id: string;
  fromTopic: string;
  toTopic: string;
  transitionType:
    | 'natural'
    | 'callback'
    | 'interest_pivot'
    | 'story_bridge'
    | 'question_bridge';
  transitionTemplates: string[];
  successRate: number; // Historical success rate
  averageDelay: number; // Average messages before bridge
  childAgeRange: [number, number]; // Age range this works for
  emotionalContext: string[]; // When this bridge works best
  complexity: 'simple' | 'moderate' | 'complex'; // Linguistic complexity
  prerequisites?: string[]; // Required prior topics or context
}

export interface ConversationContext {
  sessionId: string;
  childAccountId: string;
  currentTopic: ConversationTopic;
  recentTopics: ConversationTopic[];
  childMood:
    | 'happy'
    | 'sad'
    | 'excited'
    | 'calm'
    | 'frustrated'
    | 'curious'
    | 'tired';
  engagementLevel: 'high' | 'medium' | 'low';
  conversationLength: number; // Number of messages
  sessionDuration: number; // Minutes
  lastBridgeAttempt?: Date;
  childAge: number;
  conversationHistory: ConversationMessage[];
  attentionSpan: number; // Estimated remaining attention in minutes
  energyLevel: 'high' | 'medium' | 'low';
}

export interface ConversationMessage {
  id: string;
  message: string;
  timestamp: Date;
  speaker: 'child' | 'ai';
  topic: string;
  engagement: number; // 1-10
  sentiment: 'positive' | 'neutral' | 'negative';
  wordCount: number;
  containsQuestion: boolean;
  emotionalMarkers: string[]; // Detected emotional indicators
}

export interface BridgeAttempt {
  id: string;
  nudgeRequestId: string;
  childAccountId: string;
  sessionId: string;
  fromTopic: string;
  targetTopic: string;
  bridgeType: ConversationBridge['transitionType'];
  attemptedAt: Date;
  message: string;
  success: boolean;
  childResponse?: string;
  childEngagement?: number; // 1-10
  naturalness?: number; // 1-10 (how natural it felt)
  completedObjective?: boolean; // Did it achieve the parent's goal
  responseTime?: number; // How long child took to respond
  followUpSuccess?: boolean; // Did the conversation continue naturally
  parentSatisfaction?: number; // 1-10 if parent rated the nudge
}

export interface NudgeOpportunity {
  hasOpportunity: boolean;
  confidence: number; // 1-10
  suggestedNudge?: ParentNudgeRequest;
  bridgeStrategy?: ConversationBridge;
  timing: 'immediate' | 'next_message' | 'wait' | 'not_suitable';
  alternativeBridges?: ConversationBridge[];
  reasonsForTiming: string[];
}

export interface BridgeMessage {
  message: string;
  naturalness: number; // 1-10
  expectedEngagement: number; // 1-10
  followUpStrategy?: string;
  estimatedSuccessRate: number; // 0-1
  fallbackOptions?: string[];
}

export interface ContextAnalysis {
  currentTopicConfidence: number; // How sure we are about current topic
  emotionalState: string;
  engagementLevel: number;
  bridgeReadiness: number; // How ready for a bridge attempt
  conversationFlow: 'natural' | 'choppy' | 'forced';
  childInterestLevel: number; // 1-10
  topicSaturation: number; // How tired of current topic (1-10)
  transitionSignals: string[]; // Detected signals child is ready to change topics
}

export interface TopicTransition {
  fromTopicId: string;
  toTopicId: string;
  transitionMessage: string;
  confidence: number;
  naturalness: number;
  childAgeAppropriate: boolean;
  estimatedSuccess: number;
  requiresSetup: boolean; // Does this transition need conversation preparation
}

export interface ConversationFlow {
  sessionId: string;
  childAccountId: string;
  startedAt: Date;
  endedAt?: Date;
  totalMessages: number;
  topicChanges: TopicTransition[];
  bridgeAttempts: BridgeAttempt[];
  overallEngagement: number; // 1-10
  naturalness: number; // 1-10
  parentGoalsAchieved: string[];
  sessionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface NudgeQueueStatus {
  pendingNudges: ParentNudgeRequest[];
  recentAttempts: BridgeAttempt[];
  queueHealth: 'healthy' | 'backed_up' | 'stalled';
  recommendations: string[];
  estimatedProcessingTime: number; // minutes
  successRate: number; // Recent success rate
}

export interface ContextWeaverMetrics {
  totalBridgeAttempts: number;
  successfulBridges: number;
  averageNaturalness: number;
  averageEngagement: number;
  topPerformingBridges: ConversationBridge[];
  improvementAreas: string[];
  childSatisfactionScore: number;
  parentSatisfactionScore: number;
}

export interface BridgeTemplate {
  id: string;
  template: string;
  variables: string[]; // {naturalPhrasing}, {targetTopic}, etc.
  ageRange: [number, number];
  emotionalContext: string[];
  complexityLevel: 'simple' | 'moderate' | 'complex';
  successRate: number;
  usageCount: number;
  lastUpdated: Date;
}

export interface ConversationPersona {
  id: string;
  name: string;
  description: string;
  bridgingStyle:
    | 'gentle'
    | 'enthusiastic'
    | 'curious'
    | 'storytelling'
    | 'playful';
  preferredTransitions: string[]; // Bridge types this persona prefers
  vocabularyLevel: 'simple' | 'moderate' | 'advanced';
  emotionalApproach: string[];
}

export interface LearningModel {
  childAccountId: string;
  preferredBridgeTypes: { [key: string]: number }; // Success rates by bridge type
  bestTimingPatterns: string[]; // When bridges work best for this child
  topicPreferences: { [key: string]: number }; // Child's interest in topics
  attentionPatterns: string[]; // When child is most/least engaged
  languagePreferences: string[]; // How child prefers information presented
  lastUpdated: Date;
  confidence: number; // How much data we have (0-1)
}

export interface ParentNudgeInterface {
  requestNudge: (
    request: Omit<
      ParentNudgeRequest,
      'id' | 'createdAt' | 'currentAttempts' | 'status'
    >
  ) => Promise<{ success: boolean; id?: string; error?: string }>;
  cancelNudge: (id: string) => Promise<{ success: boolean; error?: string }>;
  getQueueStatus: () => Promise<NudgeQueueStatus>;
  updateNudgePhrasing: (
    id: string,
    newPhrasing: string
  ) => Promise<{ success: boolean; error?: string }>;
  prioritizeNudge: (
    id: string,
    priority: number
  ) => Promise<{ success: boolean; error?: string }>;
  scheduleNudge: (
    id: string,
    scheduledFor: Date
  ) => Promise<{ success: boolean; error?: string }>;
}
