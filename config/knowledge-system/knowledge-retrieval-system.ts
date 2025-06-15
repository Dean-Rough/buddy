// lib/knowledge/types.ts
export interface KnowledgeEntry {
  id: string;
  category: string;
  subcategory?: string;
  term: string;
  definition: string;
  examples?: string[];
  ageRelevance: number[]; // [7, 8, 9, 10, 11, 12]
  lastUpdated: Date;
  source?: string;
  ukSpecific?: boolean;
  confidence: 'verified' | 'crowdsourced' | 'ai_generated';
}

export interface TrendingTopic {
  term: string;
  category: 'game' | 'youtuber' | 'meme' | 'slang' | 'trend';
  momentum: 'rising' | 'peak' | 'fading' | 'dead';
  ageGroups: number[];
  weeklyMentions: number;
  lastSeen: Date;
}

export interface SafeSearchResult {
  content: string;
  source: string;
  safetyScore: number;
  relevanceScore: number;
  processedAt: Date;
}

// lib/knowledge/knowledge-base.ts
import { Redis } from '@upstash/redis';
import { Pinecone } from '@pinecone-database/pinecone';

export class YouthKnowledgeBase {
  private redis: Redis;
  private pinecone: Pinecone;
  private readonly CACHE_TTL = 60 * 60 * 24; // 24 hours
  private readonly HOT_CACHE_TTL = 60 * 60; // 1 hour for trending

  constructor() {
    this.redis = Redis.fromEnv();
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
      environment: process.env.PINECONE_ENVIRONMENT!,
    });
  }

  // Core knowledge retrieval with fallback layers
  async getKnowledge(
    query: string,
    childAge: number,
    context?: {
      recentTopics?: string[];
      childInterests?: string[];
      location?: 'UK' | 'US' | 'AU';
    }
  ): Promise<{
    found: boolean;
    knowledge?: KnowledgeEntry;
    confidence: number;
    fallbackSuggestion?: string;
  }> {
    // Layer 1: Check hot cache for exact matches
    const cacheKey = `knowledge:hot:${query.toLowerCase()}:${childAge}`;
    const cached = await this.redis.get<KnowledgeEntry>(cacheKey);

    if (cached) {
      return { found: true, knowledge: cached, confidence: 1.0 };
    }

    // Layer 2: Vector search in Pinecone for semantic matches
    const embedding = await this.getEmbedding(query);
    const vectorResults = await this.searchVectors(embedding, childAge);

    if (vectorResults.matches && vectorResults.matches[0]?.score > 0.85) {
      const knowledge = await this.getEntryById(vectorResults.matches[0].id);
      if (knowledge) {
        // Cache for future
        await this.redis.set(cacheKey, knowledge, { ex: this.CACHE_TTL });
        return {
          found: true,
          knowledge,
          confidence: vectorResults.matches[0].score,
        };
      }
    }

    // Layer 3: Guardrailed web search
    const searchResult = await this.safeWebSearch(
      query,
      childAge,
      context?.location
    );

    if (searchResult) {
      // Create new knowledge entry
      const newEntry = await this.createKnowledgeEntry(
        query,
        searchResult,
        childAge
      );
      return {
        found: true,
        knowledge: newEntry,
        confidence: 0.7,
      };
    }

    // Layer 4: Fallback response
    return {
      found: false,
      confidence: 0,
      fallbackSuggestion: this.generateFallback(query, childAge),
    };
  }

  // Safe web search with multiple guardrails
  private async safeWebSearch(
    query: string,
    childAge: number,
    location: string = 'UK'
  ): Promise<SafeSearchResult | null> {
    // Sanitize query
    const sanitized = this.sanitizeQuery(query, childAge);

    // Define safe sources by category
    const safeSources = this.getSafeSources(query, location);

    try {
      // Use Google Custom Search API with SafeSearch
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?` +
          `key=${process.env.GOOGLE_API_KEY}` +
          `&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}` +
          `&q=${encodeURIComponent(sanitized)}` +
          `&safe=active` +
          `&siteSearch=${safeSources.join(' OR ')}` +
          `&num=5`
      );

      const data = await response.json();

      if (!data.items?.length) return null;

      // Process and filter results
      for (const item of data.items) {
        const processed = await this.processSearchResult(item, childAge);
        if (processed.safetyScore > 0.9) {
          return processed;
        }
      }

      return null;
    } catch (error) {
      console.error('Safe search failed:', error);
      return null;
    }
  }

  // Smart query sanitization based on age
  private sanitizeQuery(query: string, age: number): string {
    // Remove potentially problematic terms
    const blocked = [
      'death',
      'kill',
      'sex',
      'drugs',
      'violence',
      'blood',
      'gore',
      'naked',
      'kiss',
      'dating',
    ];

    let sanitized = query.toLowerCase();

    // Age-specific filtering
    if (age < 10) {
      blocked.push('scary', 'horror', 'fight');
    }

    blocked.forEach(term => {
      sanitized = sanitized.replace(new RegExp(`\\b${term}\\b`, 'gi'), '');
    });

    // Add safe context
    if (query.includes('youtube') || query.includes('youtuber')) {
      sanitized += ' family friendly kids';
    }

    if (
      query.includes('game') ||
      query.includes('roblox') ||
      query.includes('minecraft')
    ) {
      sanitized += ' age appropriate';
    }

    return sanitized.trim();
  }

  // Get appropriate safe sources based on query type
  private getSafeSources(query: string, location: string): string[] {
    const sources: string[] = [];

    // Gaming sources
    if (/game|minecraft|roblox|fortnite/i.test(query)) {
      sources.push(
        'minecraft.wiki',
        'minecraft.fandom.com',
        'roblox.fandom.com',
        'commonsensemedia.org'
      );
    }

    // YouTube/Content creators
    if (/youtube|youtuber|streamer/i.test(query)) {
      sources.push(
        'youtube.fandom.com',
        'famousbirthdays.com',
        'commonsensemedia.org'
      );
    }

    // UK specific sources
    if (location === 'UK') {
      sources.push(
        'bbc.co.uk/newsround',
        'bbc.co.uk/cbbc',
        'theguardian.com/childrens-books-site'
      );
    }

    // General safe sources
    sources.push(
      'kiddle.co',
      'ducksters.com',
      'kids.britannica.com',
      'natgeokids.com'
    );

    return [...new Set(sources)]; // Remove duplicates
  }

  // Process search results with safety scoring
  private async processSearchResult(
    item: any,
    childAge: number
  ): Promise<SafeSearchResult> {
    const content = item.snippet || '';

    // Run through content safety check
    const safetyScore = await this.checkContentSafety(content, childAge);

    // Extract relevant information
    const processed = {
      content: this.simplifyForAge(content, childAge),
      source: item.displayLink,
      safetyScore,
      relevanceScore: this.calculateRelevance(content, item.title),
      processedAt: new Date(),
    };

    return processed;
  }

  // Content safety scoring using multiple signals
  private async checkContentSafety(
    content: string,
    age: number
  ): Promise<number> {
    let score = 1.0;

    // Check for concerning terms (more strict for younger ages)
    const concerningTerms =
      age < 10
        ? ['fight', 'battle', 'war', 'scary', 'horror', 'blood']
        : ['violence', 'death', 'explicit'];

    concerningTerms.forEach(term => {
      if (new RegExp(`\\b${term}\\b`, 'i').test(content)) {
        score -= 0.2;
      }
    });

    // Positive signals
    const positiveTerms = ['kids', 'family', 'friendly', 'educational', 'safe'];
    positiveTerms.forEach(term => {
      if (new RegExp(`\\b${term}\\b`, 'i').test(content)) {
        score += 0.1;
      }
    });

    // Length check (too short might be low quality)
    if (content.length < 50) score -= 0.1;

    return Math.max(0, Math.min(1, score));
  }

  // Simplify content for age
  private simplifyForAge(content: string, age: number): string {
    if (age < 9) {
      // Simplify sentence structure
      content = content.replace(/[;:]/, '.');
      // Remove complex words (this is simplified, real implementation would be more sophisticated)
      content = content.replace(/\b\w{10,}\b/g, match => {
        // Keep gaming terms
        if (/minecraft|fortnite|youtube/i.test(match)) return match;
        return 'something';
      });
    }

    // Limit length based on age
    const maxLength = age < 9 ? 100 : age < 11 ? 150 : 200;
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + '...';
    }

    return content;
  }

  // Generate age-appropriate fallbacks
  private generateFallback(query: string, age: number): string {
    const fallbacks = {
      game: [
        "haven't heard of that game yet - is it new? what's it like?",
        "don't know that one - what kind of game is it?",
        "that's a new one for me - is it on roblox or something else?",
      ],
      youtuber: [
        "don't think i know them - what kind of videos do they make?",
        "haven't seen their stuff - are they gaming or something else?",
        "new youtuber? what's their channel about?",
      ],
      slang: [
        "that's new slang to me lol - what's it mean?",
        "haven't heard that one - is it a new thing?",
        "you're teaching me new words - what's that mean?",
      ],
      default: [
        'ngl no idea what that is - can you tell me about it?',
        "that's new to me - what is it?",
        "haven't come across that - fill me in?",
      ],
    };

    const category = this.categorizeQuery(query);
    const options = fallbacks[category] || fallbacks.default;

    // Age-appropriate selection
    if (age < 9) {
      return options[0]; // Simpler language
    } else if (age < 11) {
      return options[1];
    } else {
      return options[2]; // More casual/slang
    }
  }

  // Categorize queries for better responses
  private categorizeQuery(query: string): string {
    if (/game|play|minecraft|roblox|fortnite/i.test(query)) return 'game';
    if (/youtube|youtuber|channel|streamer/i.test(query)) return 'youtuber';
    if (/mean|slang|word|saying/i.test(query)) return 'slang';
    return 'default';
  }

  // Create embedding for vector search
  private async getEmbedding(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    const data = await response.json();
    return data.data[0].embedding;
  }

  // Search vector database
  private async searchVectors(embedding: number[], age: number) {
    const index = this.pinecone.index('youth-knowledge');

    return await index.query({
      vector: embedding,
      topK: 5,
      includeMetadata: true,
      filter: {
        minAge: { $lte: age },
        maxAge: { $gte: age },
      },
    });
  }
}

// lib/knowledge/trending-monitor.ts
export class TrendingMonitor {
  private redis: Redis;

  constructor() {
    this.redis = Redis.fromEnv();
  }

  // Track what kids are actually talking about
  async trackMention(
    term: string,
    category: string,
    childAge: number,
    context?: {
      sentiment?: 'positive' | 'negative' | 'neutral';
      fullMessage?: string;
    }
  ): Promise<void> {
    const week = this.getCurrentWeek();
    const key = `trending:${week}:${term.toLowerCase()}`;

    // Increment mention count
    await this.redis.hincrby(key, 'count', 1);
    await this.redis.hincrby(key, `age_${childAge}`, 1);

    // Track category
    await this.redis.hset(key, 'category', category);

    // Set expiry (2 weeks)
    await this.redis.expire(key, 60 * 60 * 24 * 14);

    // Check if trending
    await this.checkTrendingStatus(term);
  }

  // Get current trending topics by age group
  async getTrending(
    ageGroup: number[],
    limit: number = 10
  ): Promise<TrendingTopic[]> {
    const week = this.getCurrentWeek();
    const pattern = `trending:${week}:*`;

    // Get all keys for current week
    const keys = await this.redis.keys(pattern);
    const trends: TrendingTopic[] = [];

    for (const key of keys) {
      const data = await this.redis.hgetall(key);
      if (!data) continue;

      // Calculate relevance for age group
      let ageRelevance = 0;
      ageGroup.forEach(age => {
        ageRelevance += parseInt(data[`age_${age}`] || '0');
      });

      if (ageRelevance > 0) {
        trends.push({
          term: key.split(':').pop()!,
          category: data.category as any,
          momentum: this.calculateMomentum(data),
          ageGroups: this.extractAgeGroups(data),
          weeklyMentions: parseInt(data.count || '0'),
          lastSeen: new Date(),
        });
      }
    }

    // Sort by relevance and recency
    return trends
      .sort((a, b) => b.weeklyMentions - a.weeklyMentions)
      .slice(0, limit);
  }

  // Calculate if something is rising/falling
  private calculateMomentum(data: any): 'rising' | 'peak' | 'fading' | 'dead' {
    const currentCount = parseInt(data.count || '0');
    const lastWeekCount = parseInt(data.lastWeekCount || '0');

    if (currentCount === 0) return 'dead';
    if (lastWeekCount === 0) return 'rising';

    const change = (currentCount - lastWeekCount) / lastWeekCount;

    if (change > 0.5) return 'rising';
    if (change > -0.2) return 'peak';
    if (change > -0.5) return 'fading';
    return 'dead';
  }

  private getCurrentWeek(): string {
    const now = new Date();
    const year = now.getFullYear();
    const week = Math.floor(
      (now.getTime() - new Date(year, 0, 1).getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    );
    return `${year}-${week}`;
  }

  private extractAgeGroups(data: any): number[] {
    const ages: number[] = [];
    for (let age = 7; age <= 12; age++) {
      if (parseInt(data[`age_${age}`] || '0') > 0) {
        ages.push(age);
      }
    }
    return ages;
  }
}

// lib/knowledge/knowledge-updater.ts
import { CronJob } from 'cron';

export class KnowledgeUpdater {
  private knowledgeBase: YouthKnowledgeBase;
  private trendingMonitor: TrendingMonitor;

  constructor() {
    this.knowledgeBase = new YouthKnowledgeBase();
    this.trendingMonitor = new TrendingMonitor();

    // Set up cron jobs
    this.setupDailyUpdate();
    this.setupWeeklyDeepUpdate();
  }

  private setupDailyUpdate() {
    // Run every day at 3 AM
    new CronJob(
      '0 3 * * *',
      async () => {
        console.log('Running daily knowledge update...');

        // Update trending gaming content
        await this.updateGamingTrends();

        // Update UK-specific content
        await this.updateUKContent();

        // Check for new slang
        await this.updateSlangDictionary();
      },
      null,
      true,
      'Europe/London'
    );
  }

  private setupWeeklyDeepUpdate() {
    // Run every Sunday at 2 AM
    new CronJob(
      '0 2 * * 0',
      async () => {
        console.log('Running weekly deep knowledge update...');

        // Analyze trending patterns
        await this.analyzeTrendingPatterns();

        // Update YouTuber database
        await this.updateYouTuberDatabase();

        // Clean up old entries
        await this.cleanupOldKnowledge();
      },
      null,
      true,
      'Europe/London'
    );
  }

  private async updateGamingTrends() {
    // Minecraft
    try {
      const minecraftUpdates = await this.fetchSafely(
        'https://minecraft.wiki/api.php?action=query&list=recentchanges&rcnamespace=0&rclimit=10&format=json'
      );
      // Process and store updates
    } catch (error) {
      console.error('Failed to update Minecraft trends:', error);
    }

    // Roblox popular games
    try {
      // This would need proper Roblox API integration
      const robloxTrending = await this.scrapeRobloxTrending();
      // Store in knowledge base
    } catch (error) {
      console.error('Failed to update Roblox trends:', error);
    }
  }

  private async updateUKContent() {
    // BBC Newsround
    try {
      const newsroundFeed = await this.fetchSafely(
        'https://feeds.bbci.co.uk/newsround/rss.xml'
      );
      // Parse RSS and extract kid-relevant UK news
    } catch (error) {
      console.error('Failed to update UK content:', error);
    }

    // UK YouTube trends
    try {
      const ukTrends = await this.fetchYouTubeTrends('GB');
      // Filter for kid-appropriate content
    } catch (error) {
      console.error('Failed to update UK YouTube trends:', error);
    }
  }

  private async updateSlangDictionary() {
    // Get trending terms from last week
    const trending = await this.trendingMonitor.getTrending(
      [7, 8, 9, 10, 11, 12],
      50
    );

    // Filter for potential new slang
    const unknownTerms = trending.filter(
      t => t.category === 'slang' && t.momentum === 'rising'
    );

    // Try to define through safe search
    for (const term of unknownTerms) {
      const definition = await this.knowledgeBase.getKnowledge(
        `what does ${term.term} mean slang`,
        10
      );

      if (definition.found && definition.confidence > 0.7) {
        // Add to permanent knowledge base
        await this.storeSlangTerm(term.term, definition.knowledge!);
      }
    }
  }

  private async fetchSafely(url: string): Promise<any> {
    // Add safety headers and timeout
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OndaAI-YouthKnowledge/1.0',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    return response.json();
  }
}

// lib/knowledge/integration.ts
// Integration with the main chat system

export class KnowledgeAwareChat {
  private knowledgeBase: YouthKnowledgeBase;
  private trendingMonitor: TrendingMonitor;
  private contextWindow: Map<string, string[]> = new Map();

  constructor() {
    this.knowledgeBase = new YouthKnowledgeBase();
    this.trendingMonitor = new TrendingMonitor();
  }

  // Enhance chat messages with real-time knowledge
  async enhancePrompt(
    message: string,
    childAge: number,
    childId: string,
    personaId: string
  ): Promise<{
    enhancedPrompt: string;
    knowledgeContext: string;
    unknownTerms: string[];
  }> {
    // Extract potential knowledge queries
    const terms = this.extractKnowledgeTerms(message);
    const knowledgeContext: string[] = [];
    const unknownTerms: string[] = [];

    // Track all mentioned terms
    for (const term of terms) {
      await this.trendingMonitor.trackMention(
        term.text,
        term.category,
        childAge,
        { fullMessage: message }
      );
    }

    // Look up each term
    for (const term of terms) {
      const result = await this.knowledgeBase.getKnowledge(
        term.text,
        childAge,
        { location: 'UK' }
      );

      if (result.found && result.knowledge) {
        knowledgeContext.push(`[${term.text}: ${result.knowledge.definition}]`);
      } else {
        unknownTerms.push(term.text);
      }
    }

    // Get current trending topics for context
    const trending = await this.trendingMonitor.getTrending([childAge], 5);

    // Build enhanced prompt
    const enhancedPrompt = this.buildEnhancedPrompt(
      message,
      knowledgeContext,
      trending,
      childAge,
      personaId
    );

    return {
      enhancedPrompt,
      knowledgeContext: knowledgeContext.join('\n'),
      unknownTerms,
    };
  }

  // Extract terms that might need knowledge lookup
  private extractKnowledgeTerms(
    message: string
  ): Array<{ text: string; category: string }> {
    const terms: Array<{ text: string; category: string }> = [];

    // Gaming terms
    const gamePattern = /\b(minecraft|roblox|fortnite|among us)\s+\w+/gi;
    const gameMatches = message.match(gamePattern);
    if (gameMatches) {
      gameMatches.forEach(match => {
        terms.push({ text: match, category: 'game' });
      });
    }

    // YouTuber mentions
    const youtuberPattern = /\b(\w+)\s*(youtube|youtuber|channel)/gi;
    const ytMatches = message.match(youtuberPattern);
    if (ytMatches) {
      ytMatches.forEach(match => {
        terms.push({ text: match, category: 'youtuber' });
      });
    }

    // Potential slang (all caps words, unusual spellings)
    const slangPattern =
      /\b[A-Z]{3,}\b|\b\w*z{2,}\w*\b|\b(rizz|gyat|sigma|bussin)\b/gi;
    const slangMatches = message.match(slangPattern);
    if (slangMatches) {
      slangMatches.forEach(match => {
        terms.push({ text: match, category: 'slang' });
      });
    }

    // Questions about meaning
    const meaningPattern = /what\s*(does|is)\s*(\w+)\s*mean|what'?s\s*(\w+)/gi;
    let match;
    while ((match = meaningPattern.exec(message)) !== null) {
      const term = match[2] || match[3];
      if (term) {
        terms.push({ text: term, category: 'definition' });
      }
    }

    return terms;
  }

  // Build the enhanced prompt with knowledge context
  private buildEnhancedPrompt(
    originalMessage: string,
    knowledgeContext: string[],
    trending: TrendingTopic[],
    childAge: number,
    personaId: string
  ): string {
    let prompt = '';

    // Add knowledge context if found
    if (knowledgeContext.length > 0) {
      prompt += `\n📚 KNOWLEDGE CONTEXT:\n${knowledgeContext.join('\n')}\n`;
      prompt += `Use this knowledge naturally in your response if relevant.\n\n`;
    }

    // Add trending context
    if (trending.length > 0) {
      prompt += `\n📈 CURRENTLY TRENDING WITH ${childAge} YEAR OLDS:\n`;
      trending.forEach(t => {
        prompt += `- ${t.term} (${t.category}, ${t.momentum})\n`;
      });
      prompt += `\nYou can reference these if relevant to make conversation current.\n\n`;
    }

    // Add conversation context
    const recentContext = this.getRecentContext(personaId);
    if (recentContext.length > 0) {
      prompt += `\n💭 RECENT CONVERSATION CONTEXT:\n`;
      prompt += recentContext.join(' → ');
      prompt += `\n\n`;
    }

    return prompt;
  }

  // Track conversation context
  private getRecentContext(childId: string): string[] {
    return this.contextWindow.get(childId) || [];
  }

  updateContext(childId: string, topic: string) {
    const context = this.contextWindow.get(childId) || [];
    context.push(topic);

    // Keep only last 5 topics
    if (context.length > 5) {
      context.shift();
    }

    this.contextWindow.set(childId, context);
  }
}

// Usage example in your chat API
// app/api/chat/route.ts
import { KnowledgeAwareChat } from '@/lib/knowledge/integration';

const knowledgeChat = new KnowledgeAwareChat();

export async function POST(req: Request) {
  const { message, childAge, childId, personaId } = await req.json();

  // Enhance the prompt with knowledge
  const { enhancedPrompt, unknownTerms } = await knowledgeChat.enhancePrompt(
    message,
    childAge,
    childId,
    personaId
  );

  // If there are unknown terms, the AI can ask about them
  let systemPrompt = getSystemPrompt(personaId, childAge);
  if (unknownTerms.length > 0) {
    systemPrompt += `\n\n❓ UNKNOWN TERMS: ${unknownTerms.join(', ')}`;
    systemPrompt += `\nFeel free to ask the child about these naturally!`;
  }

  // Continue with your normal chat flow...
}
