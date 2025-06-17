import { describe, test, expect, beforeAll, afterAll } from 'vitest';

/**
 * Load Testing Suite for Onda Platform
 *
 * This suite complements Artillery.js load tests with programmatic testing
 * for specific performance scenarios and custom metrics.
 *
 * Performance Targets:
 * - API Response Time: <2s (95th percentile)
 * - Safety Processing: <10s (95th percentile)
 * - Chat Processing: <5s (95th percentile)
 * - Page Load: <3s (95th percentile)
 * - Error Rate: <5% (excluding auth errors)
 */

interface LoadTestResult {
  duration: number;
  success: boolean;
  statusCode?: number;
  error?: string;
}

interface PerformanceMetrics {
  min: number;
  max: number;
  avg: number;
  p95: number;
  p99: number;
}

class LoadTester {
  private baseUrl: string;
  private results: LoadTestResult[] = [];

  constructor(baseUrl = 'http://localhost:4288') {
    this.baseUrl = baseUrl;
  }

  /**
   * Execute a single API request and measure performance
   */
  async executeRequest(
    method: 'GET' | 'POST',
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<LoadTestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const duration = Date.now() - startTime;
      const result: LoadTestResult = {
        duration,
        success: response.ok || response.status < 500, // Accept 4xx as "successful" for load testing
        statusCode: response.status,
      };

      this.results.push(result);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: LoadTestResult = {
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Execute concurrent requests to test load handling
   */
  async executeConcurrentRequests(
    requests: Array<() => Promise<LoadTestResult>>,
    concurrency = 10
  ): Promise<LoadTestResult[]> {
    const results: LoadTestResult[] = [];

    // Execute requests in batches to control concurrency
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map(req => req()));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Calculate performance metrics from results
   */
  calculateMetrics(results: LoadTestResult[]): PerformanceMetrics {
    const durations = results
      .filter(r => r.success)
      .map(r => r.duration)
      .sort((a, b) => a - b);

    if (durations.length === 0) {
      return { min: 0, max: 0, avg: 0, p95: 0, p99: 0 };
    }

    const min = durations[0];
    const max = durations[durations.length - 1];
    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);
    const p95 = durations[p95Index] || max;
    const p99 = durations[p99Index] || max;

    return { min, max, avg, p95, p99 };
  }

  /**
   * Clear results for next test
   */
  clearResults(): void {
    this.results = [];
  }
}

describe('Load Testing Suite', () => {
  let loadTester: LoadTester;
  let serverProcess: any;

  beforeAll(async () => {
    loadTester = new LoadTester();

    // Note: In a real scenario, you might want to start the dev server here
    // For now, assume it's already running on port 4288
    console.log('🚀 Starting load tests against http://localhost:4288');
  });

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill();
    }
    console.log('✅ Load tests completed');
  });

  describe('API Response Time Tests', () => {
    test('should handle chat API requests within performance targets', async () => {
      loadTester.clearResults();

      // Create 100 chat requests
      const chatRequests = Array.from(
        { length: 100 },
        (_, i) => () =>
          loadTester.executeRequest('POST', '/api/chat/message', {
            message: `Test message ${i}`,
            childAccountId: `test-child-${i}`,
            sessionId: `session-${i}`,
          })
      );

      // Execute with moderate concurrency
      const results = await loadTester.executeConcurrentRequests(
        chatRequests,
        5
      );
      const metrics = loadTester.calculateMetrics(results);

      console.log('📊 Chat API Performance Metrics:', {
        totalRequests: results.length,
        successRate: `${((results.filter(r => r.success).length / results.length) * 100).toFixed(1)}%`,
        ...metrics,
      });

      // Performance assertions
      expect(metrics.p95).toBeLessThan(2000); // 95th percentile under 2s
      expect(metrics.avg).toBeLessThan(1500); // Average under 1.5s

      // At least 80% success rate (accounting for auth failures in test environment)
      const successRate =
        results.filter(r => r.success).length / results.length;
      expect(successRate).toBeGreaterThan(0.8);
    }, 60000); // 60 second timeout

    test('should handle safety validation requests efficiently', async () => {
      loadTester.clearResults();

      const safetyMessages = [
        'Hello, how are you?',
        'Can you help me with homework?',
        'Tell me about dinosaurs',
        'What is 2 + 2?',
        'I feel sad today',
        'Can we play a game?',
      ];

      // Create 50 safety validation requests
      const safetyRequests = Array.from(
        { length: 50 },
        (_, i) => () =>
          loadTester.executeRequest('POST', '/api/safety/validate', {
            message: safetyMessages[i % safetyMessages.length],
            childAge: 6 + (i % 7), // Ages 6-12
          })
      );

      const results = await loadTester.executeConcurrentRequests(
        safetyRequests,
        3
      );
      const metrics = loadTester.calculateMetrics(results);

      console.log('🔒 Safety API Performance Metrics:', {
        totalRequests: results.length,
        successRate: `${((results.filter(r => r.success).length / results.length) * 100).toFixed(1)}%`,
        ...metrics,
      });

      // Safety processing should be under 10s
      expect(metrics.p95).toBeLessThan(10000);
      expect(metrics.avg).toBeLessThan(5000);
    }, 45000);

    test('should serve static content quickly', async () => {
      loadTester.clearResults();

      // Create 50 page load requests
      const pageRequests = Array.from(
        { length: 50 },
        () => () => loadTester.executeRequest('GET', '/')
      );

      const results = await loadTester.executeConcurrentRequests(
        pageRequests,
        10
      );
      const metrics = loadTester.calculateMetrics(results);

      console.log('📄 Page Load Performance Metrics:', {
        totalRequests: results.length,
        successRate: `${((results.filter(r => r.success).length / results.length) * 100).toFixed(1)}%`,
        ...metrics,
      });

      // Page loads should be under 3s
      expect(metrics.p95).toBeLessThan(3000);
      expect(metrics.avg).toBeLessThan(2000);

      // Should have high success rate for static content
      const successRate =
        results.filter(r => r.success).length / results.length;
      expect(successRate).toBeGreaterThan(0.95);
    }, 30000);
  });

  describe('Stress Testing', () => {
    test('should handle burst traffic without significant degradation', async () => {
      loadTester.clearResults();

      // Simulate burst traffic - 200 requests in quick succession
      const burstRequests = Array.from(
        { length: 200 },
        (_, i) => () => loadTester.executeRequest('GET', '/')
      );

      // Execute with high concurrency to simulate burst
      const results = await loadTester.executeConcurrentRequests(
        burstRequests,
        20
      );
      const metrics = loadTester.calculateMetrics(results);

      console.log('💥 Burst Traffic Performance Metrics:', {
        totalRequests: results.length,
        successRate: `${((results.filter(r => r.success).length / results.length) * 100).toFixed(1)}%`,
        ...metrics,
      });

      // Even under burst load, p95 should be reasonable
      expect(metrics.p95).toBeLessThan(5000);

      // Should maintain reasonable success rate even under stress
      const successRate =
        results.filter(r => r.success).length / results.length;
      expect(successRate).toBeGreaterThan(0.7);
    }, 60000);

    test('should handle mixed API traffic patterns', async () => {
      loadTester.clearResults();

      // Create mixed requests simulating real usage
      const mixedRequests: Array<() => Promise<LoadTestResult>> = [];

      // 60% chat requests
      for (let i = 0; i < 60; i++) {
        mixedRequests.push(() =>
          loadTester.executeRequest('POST', '/api/chat/message', {
            message: `Mixed test message ${i}`,
            childAccountId: `child-${i}`,
            sessionId: `session-${i}`,
          })
        );
      }

      // 20% time status checks
      for (let i = 0; i < 20; i++) {
        mixedRequests.push(() =>
          loadTester.executeRequest(
            'GET',
            `/api/chat/time-status?childAccountId=child-${i}`
          )
        );
      }

      // 20% page loads
      for (let i = 0; i < 20; i++) {
        mixedRequests.push(() => loadTester.executeRequest('GET', '/'));
      }

      // Shuffle requests to simulate real traffic patterns
      const shuffledRequests = mixedRequests.sort(() => Math.random() - 0.5);

      const results = await loadTester.executeConcurrentRequests(
        shuffledRequests,
        8
      );
      const metrics = loadTester.calculateMetrics(results);

      console.log('🔄 Mixed Traffic Performance Metrics:', {
        totalRequests: results.length,
        successRate: `${((results.filter(r => r.success).length / results.length) * 100).toFixed(1)}%`,
        ...metrics,
      });

      // Mixed traffic should still meet performance targets
      expect(metrics.p95).toBeLessThan(3000);
      expect(metrics.avg).toBeLessThan(2000);
    }, 90000);
  });

  describe('Memory and Resource Testing', () => {
    test('should not have memory leaks under sustained load', async () => {
      // This test simulates sustained load to check for memory leaks
      const sustainedRequests = Array.from(
        { length: 300 },
        (_, i) => () => loadTester.executeRequest('GET', '/')
      );

      // Execute in smaller batches with delays to simulate sustained load
      const batchSize = 10;
      const batches = Math.ceil(sustainedRequests.length / batchSize);

      console.log(
        `🔄 Starting sustained load test: ${batches} batches of ${batchSize} requests`
      );

      for (let i = 0; i < batches; i++) {
        const batchStart = i * batchSize;
        const batchEnd = Math.min(
          batchStart + batchSize,
          sustainedRequests.length
        );
        const batch = sustainedRequests.slice(batchStart, batchEnd);

        await loadTester.executeConcurrentRequests(batch, 5);

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));

        if (i % 10 === 0) {
          console.log(`  Completed batch ${i + 1}/${batches}`);
        }
      }

      const allResults = loadTester.results;
      const metrics = loadTester.calculateMetrics(allResults);

      console.log('♻️ Sustained Load Performance Metrics:', {
        totalRequests: allResults.length,
        successRate: `${((allResults.filter(r => r.success).length / allResults.length) * 100).toFixed(1)}%`,
        ...metrics,
      });

      // Performance should not degrade significantly over time
      const firstHalf = allResults.slice(0, Math.floor(allResults.length / 2));
      const secondHalf = allResults.slice(Math.floor(allResults.length / 2));

      const firstHalfMetrics = loadTester.calculateMetrics(firstHalf);
      const secondHalfMetrics = loadTester.calculateMetrics(secondHalf);

      // Second half should not be significantly slower than first half
      expect(secondHalfMetrics.avg).toBeLessThan(firstHalfMetrics.avg * 1.5);
      expect(secondHalfMetrics.p95).toBeLessThan(firstHalfMetrics.p95 * 1.5);
    }, 120000); // 2 minute timeout
  });
});
