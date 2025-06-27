// lib/knowledge/knowledge-base.ts
import { Redis } from '@upstash/redis';
import { Pinecone } from '@pinecone-database/pinecone';
import { prisma } from '../prisma';
import {
  KnowledgeEntry,
  KnowledgeResponse,
  SafeSearchResult,
  KnowledgeConfig,
} from './types';

export class YouthKnowledgeBase {
  private redis: Redis;
  private pinecone: Pinecone;
  private config: KnowledgeConfig;

  constructor(config?: Partial<KnowledgeConfig>) {
    this.redis = Redis.fromEnv();
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    this.config = {
      vectorSearch: {
        enabled: true,
        threshold: 0.85,
        maxResults: 5,
      },
      webSearch: {
        enabled: true,
        safetyThreshold: 0.9,
        maxQueries: 10,
      },
      caching: {
        ttl: 60 * 60 * 24, // 24 hours
        maxSize: 10000,
      },
      trending: {
        trackMentions: true,
        updateFrequency: 60 * 60, // 1 hour
      },
      ...config,
    };
  }

  /**
   * Core knowledge retrieval with fallback layers
   */
  async getKnowledge(
    query: string,
    childAge: number,
    context?: {
      recentTopics?: string[];
      childInterests?: string[];
      location?: 'UK' | 'US' | 'AU';
      conversationId?: string;
    }
  ): Promise<KnowledgeResponse> {
    const startTime = Date.now();
    const normalizedQuery = this.normalizeQuery(query);

    try {
      // Layer 1: Hot cache lookup
      const cached = await this.getCachedKnowledge(normalizedQuery, childAge);
      if (cached) {
        return {
          found: true,
          knowledge: cached,
          confidence: 1.0,
          responseTime: Date.now() - startTime,
          source: 'cache',
        };
      }

      // Layer 2: Database lookup for exact matches
      const dbResult = await this.getDatabaseKnowledge(
        normalizedQuery,
        childAge
      );
      if (dbResult) {
        await this.cacheKnowledge(normalizedQuery, childAge, dbResult);
        return {
          found: true,
          knowledge: dbResult,
          confidence: 0.95,
          responseTime: Date.now() - startTime,
          source: 'database',
        };
      }

      // Layer 3: Vector search for semantic matches
      if (this.config.vectorSearch.enabled) {
        const vectorResult = await this.vectorSearch(normalizedQuery, childAge);
        if (
          vectorResult &&
          vectorResult.confidence >= this.config.vectorSearch.threshold
        ) {
          await this.cacheKnowledge(
            normalizedQuery,
            childAge,
            vectorResult.knowledge!
          );
          return {
            found: true,
            knowledge: vectorResult.knowledge!,
            confidence: vectorResult.confidence,
            responseTime: Date.now() - startTime,
            source: 'vector_search',
          };
        }
      }

      // Layer 4: Safe web search (rate limited)
      if (this.config.webSearch.enabled) {
        const webResult = await this.safeWebSearch(
          normalizedQuery,
          childAge,
          context?.location
        );
        if (webResult) {
          const newEntry = await this.createKnowledgeEntry(
            normalizedQuery,
            webResult,
            childAge
          );
          if (newEntry) {
            await this.cacheKnowledge(normalizedQuery, childAge, newEntry);
            return {
              found: true,
              knowledge: newEntry,
              confidence: 0.7,
              responseTime: Date.now() - startTime,
              source: 'web_search',
            };
          }
        }
      }

      // Layer 5: Fallback response
      return {
        found: false,
        confidence: 0,
        fallbackSuggestion: this.generateFallback(normalizedQuery, childAge),
        responseTime: Date.now() - startTime,
        source: 'fallback',
      };
    } catch (_error) {
      console.error('Knowledge retrieval __error:', _error);
      return {
        found: false,
        confidence: 0,
        fallbackSuggestion: this.generateFallback(normalizedQuery, childAge),
        responseTime: Date.now() - startTime,
        source: 'fallback',
      };
    }
  }

  /**
   * Cache management
   */
  private async getCachedKnowledge(
    query: string,
    age: number
  ): Promise<KnowledgeEntry | null> {
    try {
      const cacheKey = `knowledge:${this.hashQuery(query)}:${age}`;
      const cached = await this.redis.get<KnowledgeEntry>(cacheKey);

      if (cached) {
        // Update hit count in background
        this.updateCacheHit(cacheKey).catch(console.error);
        return cached;
      }

      return null;
    } catch (_error) {
      console.error('Cache retrieval error:', _error);
      return null;
    }
  }

  private async cacheKnowledge(
    query: string,
    age: number,
    knowledge: KnowledgeEntry
  ): Promise<void> {
    try {
      const cacheKey = `knowledge:${this.hashQuery(query)}:${age}`;
      const expiresAt = new Date(Date.now() + this.config.caching.ttl * 1000);

      // Cache in Redis
      await this.redis.set(cacheKey, knowledge, {
        ex: this.config.caching.ttl,
      });

      // Store cache metadata in database
      await prisma.knowledgeCache.upsert({
        where: { cacheKey },
        update: {
          hitCount: { increment: 1 },
          lastHit: new Date(),
          expiresAt,
        },
        create: {
          cacheKey,
          childAge: age,
          query,
          knowledgeData: knowledge as any,
          confidence: knowledge.confidence === 'verified' ? 1.0 : 0.8,
          expiresAt,
        },
      });
    } catch (_error) {
      console.error('Cache storage error:', _error);
    }
  }

  /**
   * Database queries
   */
  private async getDatabaseKnowledge(
    query: string,
    age: number
  ): Promise<KnowledgeEntry | null> {
    try {
      const entry = await prisma.knowledgeEntry.findFirst({
        where: {
          OR: [
            { term: { equals: query, mode: 'insensitive' } },
            { examples: { has: query } },
          ],
          ageRelevance: { has: age },
        },
        orderBy: [{ confidence: 'desc' }, { popularity: 'desc' }],
      });

      if (entry) {
        // Track usage
        await this.trackKnowledgeUsage(entry.id, age, query);
        return this.mapPrismaToKnowledge(entry);
      }

      return null;
    } catch (_error) {
      console.error('Database query error:', _error);
      return null;
    }
  }

  /**
   * Vector search using Pinecone
   */
  private async vectorSearch(
    query: string,
    age: number
  ): Promise<{ knowledge: KnowledgeEntry; confidence: number } | null> {
    try {
      if (!process.env.PINECONE_API_KEY) {
        return null;
      }

      const embedding = await this.generateEmbedding(query);
      const index = this.pinecone.index('youth-knowledge');

      const results = await index.query({
        vector: embedding,
        topK: this.config.vectorSearch.maxResults,
        includeMetadata: true,
        filter: {
          minAge: { $lte: age },
          maxAge: { $gte: age },
        },
      });

      if (
        results.matches &&
        results.matches[0]?.score &&
        results.matches[0].score > this.config.vectorSearch.threshold
      ) {
        const match = results.matches[0];
        const knowledgeId = match.metadata?.knowledgeId as string;

        if (knowledgeId) {
          const entry = await prisma.knowledgeEntry.findUnique({
            where: { id: knowledgeId },
          });

          if (entry) {
            await this.trackKnowledgeUsage(entry.id, age, query, match.score);
            return {
              knowledge: this.mapPrismaToKnowledge(entry),
              confidence: match.score || 0,
            };
          }
        }
      }

      return null;
    } catch (_error) {
      console.error('Vector search error:', _error);
      return null;
    }
  }

  /**
   * Safe web search with multiple guardrails
   */
  private async safeWebSearch(
    query: string,
    childAge: number,
    location: string = 'UK'
  ): Promise<SafeSearchResult | null> {
    try {
      if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID) {
        return null;
      }

      // Check rate limit
      const rateLimitKey = `search_rate_limit:${Math.floor(Date.now() / (60 * 60 * 1000))}`; // Per hour
      const currentCount = (await this.redis.get<number>(rateLimitKey)) || 0;

      if (currentCount >= this.config.webSearch.maxQueries) {
        console.warn('Web search rate limit reached');
        return null;
      }

      // Sanitize and enhance query
      const sanitizedQuery = this.sanitizeSearchQuery(query, childAge);
      const safeSources = this.getSafeSources(query, location);

      const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
      searchUrl.searchParams.set('key', process.env.GOOGLE_API_KEY);
      searchUrl.searchParams.set('cx', process.env.GOOGLE_SEARCH_ENGINE_ID);
      searchUrl.searchParams.set('q', sanitizedQuery);
      searchUrl.searchParams.set('safe', 'active');
      searchUrl.searchParams.set('siteSearch', safeSources.join(' OR '));
      searchUrl.searchParams.set('num', '5');

      const response = await fetch(searchUrl.toString(), {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Search API __error: ${response.statusText}`);
      }

      const data = await response.json();

      // Increment rate limit
      await this.redis.incr(rateLimitKey);
      await this.redis.expire(rateLimitKey, 3600); // 1 hour TTL

      if (!data.items?.length) {
        return null;
      }

      // Process and filter results
      for (const item of data.items) {
        const processed = await this.processSearchResult(item, childAge);
        if (processed.safetyScore >= this.config.webSearch.safetyThreshold) {
          return processed;
        }
      }

      return null;
    } catch (_error) {
      console.error('Safe web search error:', _error);
      return null;
    }
  }

  /**
   * Create new knowledge entry from web search
   */
  private async createKnowledgeEntry(
    query: string,
    searchResult: SafeSearchResult,
    childAge: number
  ): Promise<KnowledgeEntry | null> {
    try {
      const category = this.categorizeQuery(query);
      const ageRange = this.determineAgeRelevance(
        searchResult.content,
        childAge
      );
      const embedding = await this.generateEmbedding(
        `${query} ${searchResult.content}`
      );

      const entry = await prisma.knowledgeEntry.create({
        data: {
          term: query.toLowerCase(),
          definition: searchResult.content,
          category,
          examples: [query],
          ageRelevance: ageRange,
          ukSpecific:
            searchResult.source.includes('.uk') ||
            searchResult.source.includes('bbc.'),
          confidence: 'ai_generated',
          source: searchResult.source,
          embedding,
          trend: 'rising',
          popularity: 1,
        },
      });

      // Add to vector database
      await this.addToVectorDB(entry);

      return this.mapPrismaToKnowledge(entry);
    } catch (_error) {
      console.error('Knowledge entry creation error:', _error);
      return null;
    }
  }

  /**
   * Helper methods
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '');
  }

  private hashQuery(query: string): string {
    // Simple hash for cache keys
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private categorizeQuery(
    query: string
  ): 'gaming' | 'slang' | 'youtuber' | 'general' {
    if (/game|play|minecraft|roblox|fortnite/i.test(query)) return 'gaming';
    if (/youtube|youtuber|channel|streamer/i.test(query)) return 'youtuber';
    if (/mean|slang|word|saying/i.test(query)) return 'slang';
    return 'general';
  }

  private getSafeSources(query: string, location: string): string[] {
    const sources: string[] = [];

    if (/game|minecraft|roblox|fortnite/i.test(query)) {
      sources.push(
        'minecraft.wiki',
        'minecraft.fandom.com',
        'roblox.fandom.com',
        'commonsensemedia.org'
      );
    }

    if (/youtube|youtuber|streamer/i.test(query)) {
      sources.push(
        'youtube.fandom.com',
        'famousbirthdays.com',
        'commonsensemedia.org'
      );
    }

    if (location === 'UK') {
      sources.push(
        'bbc.co.uk/newsround',
        'bbc.co.uk/cbbc',
        'theguardian.com/childrens-books-site'
      );
    }

    sources.push(
      'kiddle.co',
      'ducksters.com',
      'kids.britannica.com',
      'natgeokids.com'
    );

    return Array.from(new Set(sources));
  }

  private sanitizeSearchQuery(query: string, age: number): string {
    let sanitized = query.toLowerCase();

    // Remove potentially problematic terms
    const blocked = ['death', 'kill', 'sex', 'drugs', 'violence'];
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

    if (query.includes('game')) {
      sanitized += ' age appropriate';
    }

    return sanitized.trim();
  }

  private async processSearchResult(
    item: any,
    childAge: number
  ): Promise<SafeSearchResult> {
    const content = item.snippet || '';
    const safetyScore = await this.checkContentSafety(content, childAge);

    return {
      content: this.simplifyForAge(content, childAge),
      source: item.displayLink,
      safetyScore,
      relevanceScore: this.calculateRelevance(content, item.title),
      processedAt: new Date(),
    };
  }

  private async checkContentSafety(
    content: string,
    age: number
  ): Promise<number> {
    let score = 1.0;

    const concerningTerms =
      age < 10
        ? ['fight', 'battle', 'war', 'scary', 'horror', 'blood']
        : ['violence', 'death', 'explicit'];

    concerningTerms.forEach(term => {
      if (new RegExp(`\\b${term}\\b`, 'i').test(content)) {
        score -= 0.2;
      }
    });

    const positiveTerms = ['kids', 'family', 'friendly', 'educational', 'safe'];
    positiveTerms.forEach(term => {
      if (new RegExp(`\\b${term}\\b`, 'i').test(content)) {
        score += 0.1;
      }
    });

    if (content.length < 50) score -= 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private simplifyForAge(content: string, age: number): string {
    const maxLength = age < 9 ? 100 : age < 11 ? 150 : 200;

    if (age < 9) {
      content = content.replace(/[;:]/, '.');
      content = content.replace(/\b\w{10,}\b/g, match => {
        if (/minecraft|fortnite|youtube/i.test(match)) return match;
        return 'something';
      });
    }

    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + '...';
    }

    return content;
  }

  private calculateRelevance(content: string, title: string): number {
    // Simple relevance scoring
    return Math.min(1, (content.length + title.length) / 200);
  }

  private determineAgeRelevance(content: string, baseAge: number): number[] {
    // Determine which ages this content is appropriate for
    const ages = [];
    const ageRange = 2; // +/- 2 years from base age

    for (
      let age = Math.max(7, baseAge - ageRange);
      age <= Math.min(12, baseAge + ageRange);
      age++
    ) {
      ages.push(age);
    }

    return ages;
  }

  private generateFallback(query: string, age: number): string {
    const fallbacks: Record<string, string[]> = {
      gaming: [
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
      general: [
        'ngl no idea what that is - can you tell me about it?',
        "that's new to me - what is it?",
        "haven't come across that - fill me in?",
      ],
      default: [
        'ngl no idea what that is - can you tell me about it?',
        "that's new to me - what is it?",
        "haven't come across that - fill me in?",
      ],
    };

    const category = this.categorizeQuery(query);
    const options =
      fallbacks[category] || fallbacks['general'] || fallbacks.default;

    if (age < 9) return options[0];
    if (age < 11) return options[1];
    return options[2];
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
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

      if (!response.ok) {
        throw new Error(`Embedding API __error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (_error) {
      console.error('Embedding generation __error:', _error);
      return [];
    }
  }

  private async addToVectorDB(entry: any): Promise<void> {
    try {
      if (!process.env.PINECONE_API_KEY || !entry.embedding?.length) {
        return;
      }

      const index = this.pinecone.index('youth-knowledge');
      await index.upsert([
        {
          id: `knowledge-${entry.id}`,
          values: entry.embedding,
          metadata: {
            knowledgeId: entry.id,
            term: entry.term,
            category: entry.category,
            minAge: Math.min(...entry.ageRelevance),
            maxAge: Math.max(...entry.ageRelevance),
            ukSpecific: entry.ukSpecific,
          },
        },
      ]);
    } catch (_error) {
      console.error('Vector DB __error:', _error);
    }
  }

  private async trackKnowledgeUsage(
    knowledgeId: string,
    childAge: number,
    queryTerm: string,
    ___confidence: number = 1.0
  ): Promise<void> {
    try {
      // This would be called from the main chat integration
      // For now, just update popularity
      await prisma.knowledgeEntry.update({
        where: { id: knowledgeId },
        data: { popularity: { increment: 1 } },
      });
    } catch (_error) {
      console.error('Usage tracking __error:', _error);
    }
  }

  private async updateCacheHit(cacheKey: string): Promise<void> {
    try {
      await prisma.knowledgeCache.update({
        where: { cacheKey },
        data: {
          hitCount: { increment: 1 },
          lastHit: new Date(),
        },
      });
    } catch (_error) {
      // Ignore cache hit update errors
    }
  }

  private mapPrismaToKnowledge(entry: any): KnowledgeEntry {
    return {
      id: entry.id,
      term: entry.term,
      definition: entry.definition,
      category: entry.category,
      subcategory: entry.subcategory,
      examples: entry.examples,
      ageRelevance: entry.ageRelevance,
      ukSpecific: entry.ukSpecific,
      confidence: entry.confidence,
      source: entry.source,
      sourceUrl: entry.sourceUrl,
      trend: entry.trend,
      popularity: entry.popularity,
      embedding: entry.embedding,
      lastUpdated: entry.lastUpdated,
      createdAt: entry.createdAt,
    };
  }
}
