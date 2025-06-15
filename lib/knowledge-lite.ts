/**
 * Knowledge Lite System
 * Smart knowledge enhancement with minimal token cost increase
 */

interface KnowledgeEntry {
  term: string;
  definition: string;
  category: 'gaming' | 'slang' | 'youtuber' | 'general';
  ageRange: [number, number];
  confidence: number;
  lastUpdated: Date;
}

export class KnowledgeLite {
  private cache = new Map<string, KnowledgeEntry>();
  private unknownTerms = new Set<string>();

  // Seed with core knowledge from your config
  private coreKnowledge: Map<string, KnowledgeEntry> = new Map([
    [
      'rizz',
      {
        term: 'rizz',
        definition: 'charisma or charm, especially with romantic interests',
        category: 'slang',
        ageRange: [10, 12],
        confidence: 0.9,
        lastUpdated: new Date(),
      },
    ],
    [
      'gyat',
      {
        term: 'gyat',
        definition: 'expression of surprise (from "god damn")',
        category: 'slang',
        ageRange: [11, 12],
        confidence: 0.8,
        lastUpdated: new Date(),
      },
    ],
    [
      'skibidi',
      {
        term: 'skibidi',
        definition: 'from Skibidi Toilet videos, means random/silly',
        category: 'slang',
        ageRange: [7, 11],
        confidence: 0.9,
        lastUpdated: new Date(),
      },
    ],
    // Add more from your seed data...
  ]);

  async enhancePrompt(
    message: string,
    childAge: number
  ): Promise<{
    enhancedPrompt: string;
    knowledgeUsed: string[];
    unknownTerms: string[];
  }> {
    const terms = this.extractTerms(message);
    const knowledgeContext: string[] = [];
    const unknownTerms: string[] = [];

    for (const term of terms) {
      const knowledge = this.getKnowledge(term, childAge);

      if (knowledge) {
        knowledgeContext.push(`[${term}: ${knowledge.definition}]`);
      } else {
        unknownTerms.push(term);
        // Track for future learning
        this.unknownTerms.add(term.toLowerCase());
      }
    }

    let enhancedPrompt = '';
    if (knowledgeContext.length > 0) {
      enhancedPrompt = `\n📚 KNOWLEDGE CONTEXT:\n${knowledgeContext.join('\n')}\n`;
      enhancedPrompt += `Use this knowledge naturally if relevant.\n\n`;
    }

    if (unknownTerms.length > 0) {
      enhancedPrompt += `\n❓ UNKNOWN TERMS: ${unknownTerms.join(', ')}\n`;
      enhancedPrompt += `Feel free to ask about these naturally!\n\n`;
    }

    return {
      enhancedPrompt,
      knowledgeUsed: knowledgeContext,
      unknownTerms,
    };
  }

  private extractTerms(message: string): string[] {
    const terms: string[] = [];

    // Gaming terms
    const gameMatches = message.match(
      /\b(minecraft|roblox|fortnite|among us)\s+\w+/gi
    );
    if (gameMatches) terms.push(...gameMatches);

    // Slang patterns
    const slangMatches = message.match(
      /\b(rizz|gyat|sigma|bussin|no cap|fr|bet|mid|slay)\b/gi
    );
    if (slangMatches) terms.push(...slangMatches);

    // YouTuber mentions
    const ytMatches = message.match(/\b(\w+)\s*(youtube|youtuber)/gi);
    if (ytMatches) terms.push(...ytMatches);

    // Questions about meaning
    const meaningMatches = message.match(/what\s*(does|is)\s*(\w+)\s*mean/gi);
    if (meaningMatches) {
      meaningMatches.forEach(match => {
        const termMatch = match.match(/what\s*(?:does|is)\s*(\w+)/i);
        if (termMatch) terms.push(termMatch[1]);
      });
    }

    return terms.map(t => t.toLowerCase());
  }

  private getKnowledge(term: string, childAge: number): KnowledgeEntry | null {
    // Check cache first
    const cacheKey = `${term}-${childAge}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Check core knowledge
    const knowledge = this.coreKnowledge.get(term.toLowerCase());
    if (knowledge && this.isAgeAppropriate(knowledge, childAge)) {
      this.cache.set(cacheKey, knowledge);
      return knowledge;
    }

    return null;
  }

  private isAgeAppropriate(knowledge: KnowledgeEntry, age: number): boolean {
    return age >= knowledge.ageRange[0] && age <= knowledge.ageRange[1];
  }

  // For admin/learning purposes
  getUnknownTerms(): string[] {
    return Array.from(this.unknownTerms);
  }

  // Manually add new knowledge (from research)
  addKnowledge(entry: KnowledgeEntry): void {
    this.coreKnowledge.set(entry.term.toLowerCase(), entry);
    this.cache.clear(); // Reset cache
  }
}

// Usage in chat API
export async function enhanceChatWithKnowledge(
  message: string,
  childAge: number,
  systemPrompt: string
): Promise<{
  enhancedSystemPrompt: string;
  tokenIncrease: number;
}> {
  const knowledgeLite = new KnowledgeLite();
  const { enhancedPrompt } = await knowledgeLite.enhancePrompt(
    message,
    childAge
  );

  const enhancedSystemPrompt = systemPrompt + enhancedPrompt;
  const tokenIncrease = Math.ceil(enhancedPrompt.length / 4); // Rough token estimate

  return {
    enhancedSystemPrompt,
    tokenIncrease,
  };
}
