import { SafetyResult } from './safety';
import crypto from 'crypto';

interface CacheEntry {
  result: SafetyResult;
  timestamp: number;
  hitCount: number;
  childAge: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
}

/**
 * Intelligent safety cache with LRU eviction and pattern analysis
 * Optimizes safety processing for common patterns and repeated messages
 */
export class SafetyCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 10000; // Cache up to 10k entries
  private ttl = 60 * 60 * 1000; // 1 hour TTL
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, evictions: 0 };

  /**
   * Generate cache key for message and context
   */
  private generateKey(
    message: string,
    childAge: number,
    context?: string
  ): string {
    const normalizedMessage = this.normalizeMessage(message);
    const keyData = `${normalizedMessage}:${childAge}:${context || ''}`;
    return crypto
      .createHash('sha256')
      .update(keyData)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Normalize message for better cache hits
   */
  private normalizeMessage(message: string): string {
    return message
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 200); // Limit length for cache efficiency
  }

  /**
   * Get cached safety result if available and valid
   */
  get(
    message: string,
    childAge: number,
    context?: string
  ): SafetyResult | null {
    const key = this.generateKey(message, childAge, context);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return null;
    }

    // Check age compatibility (allow ±1 year for better cache hits)
    if (Math.abs(entry.childAge - childAge) > 1) {
      this.stats.misses++;
      return null;
    }

    // Update LRU and hit count
    entry.hitCount++;
    entry.timestamp = Date.now();
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.stats.hits++;
    return entry.result;
  }

  /**
   * Store safety result in cache
   */
  set(
    message: string,
    childAge: number,
    result: SafetyResult,
    context?: string
  ): void {
    // Don't cache high-severity results for safety reasons
    if (result.severity >= 3) {
      return;
    }

    const key = this.generateKey(message, childAge, context);

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    const entry: CacheEntry = {
      result,
      timestamp: Date.now(),
      hitCount: 1,
      childAge,
    };

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries());

    // Sort by LRU (oldest timestamp first, then lowest hit count)
    entries.sort(([, a], [, b]) => {
      const timeDiff = a.timestamp - b.timestamp;
      if (timeDiff !== 0) return timeDiff;
      return a.hitCount - b.hitCount;
    });

    // Remove oldest 10% of entries
    const evictCount = Math.max(1, Math.floor(this.maxSize * 0.1));
    for (let i = 0; i < evictCount && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
      this.stats.evictions++;
    }

    this.stats.size = this.cache.size;
  }

  /**
   * Clear expired entries (maintenance function)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
    this.stats.size = this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      ...this.stats,
      hitRate,
    };
  }

  /**
   * Reset cache and statistics
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, size: 0, evictions: 0 };
  }

  /**
   * Warm cache with common patterns
   */
  warmCache(
    patterns: Array<{ message: string; childAge: number; result: SafetyResult }>
  ): void {
    for (const pattern of patterns) {
      this.set(pattern.message, pattern.childAge, pattern.result);
    }
  }
}

// Global cache instance
export const safetyCache = new SafetyCache();

// Cleanup interval (run every 15 minutes)
if (typeof global !== 'undefined') {
  setInterval(
    () => {
      safetyCache.cleanup();
    },
    15 * 60 * 1000
  );
}
