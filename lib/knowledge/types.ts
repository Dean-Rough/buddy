// lib/knowledge/types.ts
export interface KnowledgeEntry {
  id: string;
  term: string;
  definition: string;
  category: 'gaming' | 'slang' | 'youtuber' | 'general';
  subcategory?: string;
  examples: string[];
  ageRelevance: number[];
  ukSpecific: boolean;
  confidence: 'verified' | 'crowdsourced' | 'ai_generated';
  source?: string;
  sourceUrl?: string;
  trend?: 'rising' | 'peak' | 'fading' | 'stable';
  popularity: number;
  embedding: number[];
  lastUpdated: Date;
  createdAt: Date;
}

export interface TrendingTopic {
  id: string;
  term: string;
  category: 'game' | 'youtuber' | 'meme' | 'slang' | 'trend';
  weeklyMentions: number;
  momentum: 'rising' | 'peak' | 'fading' | 'dead';
  ageGroups: number[];
  region: string;
  firstSeen: Date;
  lastSeen: Date;
  relatedTerms: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  platform: string[];
}

export interface ConversationContext {
  id: string;
  conversationId: string;
  childAccountId: string;
  topics: string[];
  mood?: string;
  interests: string[];
  unknownTerms: string[];
  knowledgeUsed: string[];
  trendingContext: string[];
  messageCount: number;
  engagementScore?: number;
  knowledgeScore?: number;
  startedAt: Date;
  lastUpdated: Date;
}

export interface KnowledgeUsage {
  id: string;
  knowledgeEntryId: string;
  childAccountId: string;
  conversationId: string;
  queryTerm: string;
  confidence: number;
  helpful?: boolean;
  childAge: number;
  messageContext?: string;
  aiResponse?: string;
  usedAt: Date;
  responseTime?: number;
}

export interface SafeSearchResult {
  content: string;
  source: string;
  safetyScore: number;
  relevanceScore: number;
  processedAt: Date;
}

export interface KnowledgeResponse {
  found: boolean;
  knowledge?: KnowledgeEntry;
  confidence: number;
  fallbackSuggestion?: string;
  responseTime: number;
  source: 'cache' | 'database' | 'vector_search' | 'web_search' | 'fallback';
}

export interface KnowledgeEnhancement {
  enhancedPrompt: string;
  knowledgeContext: string[];
  unknownTerms: string[];
  trendingContext: TrendingTopic[];
  conversationContext?: ConversationContext;
  totalTokens: number;
  processingTime: number;
}

// Configuration interfaces
export interface KnowledgeConfig {
  vectorSearch: {
    enabled: boolean;
    threshold: number;
    maxResults: number;
  };
  webSearch: {
    enabled: boolean;
    safetyThreshold: number;
    maxQueries: number;
  };
  caching: {
    ttl: number;
    maxSize: number;
  };
  trending: {
    trackMentions: boolean;
    updateFrequency: number;
  };
}

export interface SafeSources {
  gaming: {
    minecraft: string[];
    roblox: string[];
    fortnite: string[];
    general: string[];
  };
  youtube: {
    safe: string[];
    uk_specific: string[];
  };
  education: {
    uk: string[];
    general: string[];
  };
  slang: {
    safe: string[];
  };
}

// Analysis interfaces
export interface TermAnalysis {
  text: string;
  category: 'gaming' | 'slang' | 'youtuber' | 'definition' | 'general';
  confidence: number;
  context?: string;
}

export interface ConversationAnalysis {
  topics: string[];
  mood: string;
  interests: string[];
  unknownTerms: TermAnalysis[];
  knowledgeOpportunities: string[];
  engagementLevel: 'low' | 'medium' | 'high';
  supportNeeded: boolean;
}

// Error interfaces
export interface KnowledgeError {
  code:
    | 'VECTOR_SEARCH_FAILED'
    | 'WEB_SEARCH_FAILED'
    | 'DATABASE_ERROR'
    | 'CACHE_ERROR'
    | 'API_RATE_LIMIT';
  message: string;
  details?: any;
  timestamp: Date;
}
