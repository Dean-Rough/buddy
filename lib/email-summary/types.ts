export interface WeeklyData {
  childId: string;
  childName: string;
  childAge: number;
  parentEmail: string;
  parentClerkUserId: string;
  weekStart: Date;
  weekEnd: Date;
  conversations: ConversationSummary[];
  totalChatTime: number;
  totalSessions: number;
  safetyEvents: SafetyEventSummary[];
}

export interface ConversationSummary {
  id: string;
  date: Date;
  duration: number; // minutes
  messageCount: number;
  childMessages: string[];
  aiResponses: string[];
  safetyFlags: string[];
  mood: string;
  topics: string[];
  emotionalTrend: string;
  safetyLevel: number;
}

export interface SafetyEventSummary {
  id: string;
  eventType: string;
  severityLevel: number;
  date: Date;
  resolved: boolean;
}

export interface SummaryAnalysis {
  overall_mood: 'positive' | 'curious' | 'mixed' | 'concerning';
  mood_details: string;
  main_interests: string[];
  learning_moments: string;
  social_emotional: string;
  safety_status: 'all_good' | 'minor_concerns' | 'needs_attention';
  safety_details: string;
  highlights: string[];
  suggested_conversations: string[];
}

export interface EmailTemplateData {
  childName: string;
  weekDateRange: string;
  totalChatTime: string;
  sessionCount: number;
  avgSession: number;
  overallMood: string;
  moodDetails: string;
  mainInterests: string;
  learningMoments: string;
  socialEmotional: string;
  safetyStatusText: string;
  safetyClass: string;
  safetyDetails?: string;
  highlights: string[];
  suggestedConversations: string[];
  dashboardUrl: string;
  unsubscribeUrl: string;
}
