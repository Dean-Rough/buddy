/**
 * Parent Nudge Request Processing & Queuing System
 * Handles parent requests for natural conversation bridges with intelligent queuing
 */

import {
  ParentNudgeRequest,
  NudgeQueueStatus,
  // ParentNudgeInterface, // TODO: Used for parent interface definitions
  // ConversationContext, // TODO: Used for conversation context analysis
  BridgeAttempt,
} from './types';

interface NudgeQueue {
  childAccountId: string;
  requests: ParentNudgeRequest[];
  processing: boolean;
  lastProcessedAt?: Date;
  averageProcessingTime: number; // minutes
  successRate: number; // 0-1
}

interface NudgeValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  suggestions?: string[];
}

interface NudgeProcessingConfig {
  maxQueueSize: number;
  maxAttemptsPerRequest: number;
  cooldownBetweenAttempts: number; // minutes
  urgencyTimeouts: {
    immediate: number; // minutes before timeout
    high: number;
    medium: number;
    low: number;
  };
  batchProcessingEnabled: boolean;
  intelligentScheduling: boolean;
}

interface ProcessingResult {
  success: boolean;
  nudgeId: string;
  queuePosition?: number;
  estimatedDelay?: number;
  processingStarted?: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Nudge Manager
 * Sophisticated system for processing and queuing parent nudge requests
 */
export class NudgeManager {
  private queues: Map<string, NudgeQueue> = new Map();
  private processingCallbacks: Map<
    string,
    (nudge: ParentNudgeRequest) => Promise<boolean>
  > = new Map();

  private config: NudgeProcessingConfig = {
    maxQueueSize: 5,
    maxAttemptsPerRequest: 3,
    cooldownBetweenAttempts: 15, // 15 minutes
    urgencyTimeouts: {
      immediate: 30, // 30 minutes
      high: 120, // 2 hours
      medium: 480, // 8 hours
      low: 1440, // 24 hours
    },
    batchProcessingEnabled: true,
    intelligentScheduling: true,
  };

  /**
   * Submit new parent nudge request
   */
  async submitNudgeRequest(
    request: Omit<
      ParentNudgeRequest,
      'id' | 'createdAt' | 'currentAttempts' | 'status'
    >
  ): Promise<ProcessingResult> {
    try {
      // Create full nudge request
      const nudgeRequest: ParentNudgeRequest = {
        id: `nudge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        currentAttempts: 0,
        status: 'pending',
        ...request,
      };

      // Validate the request
      const validation = this.validateNudgeRequest(nudgeRequest);
      if (!validation.isValid) {
        return {
          success: false,
          nudgeId: nudgeRequest.id,
          error: validation.error,
          warnings: validation.warnings,
        };
      }

      // Get or create queue for child
      const queue = this.getOrCreateQueue(request.childAccountId);

      // Check queue capacity
      if (queue.requests.length >= this.config.maxQueueSize) {
        return {
          success: false,
          nudgeId: nudgeRequest.id,
          error:
            'Queue is full. Please wait for pending nudges to complete or cancel some requests.',
        };
      }

      // Check for duplicate requests
      const duplicate = this.findDuplicateRequest(queue, nudgeRequest);
      if (duplicate) {
        return {
          success: false,
          nudgeId: nudgeRequest.id,
          error: `Similar nudge already exists: "${duplicate.naturalPhrasing}"`,
          warnings: [
            'Consider updating the existing nudge instead of creating a new one.',
          ],
        };
      }

      // Add to queue with intelligent positioning
      const queuePosition = await this.addToQueue(queue, nudgeRequest);

      // Calculate estimated delay
      const estimatedDelay = this.calculateEstimatedDelay(queue, queuePosition);

      // Store the updated queue
      this.queues.set(request.childAccountId, queue);

      // Log the submission
      await this.logNudgeSubmission(nudgeRequest);

      // Start processing if queue wasn't busy
      if (!queue.processing) {
        this.processQueue(request.childAccountId);
      }

      return {
        success: true,
        nudgeId: nudgeRequest.id,
        queuePosition,
        estimatedDelay,
        processingStarted: !queue.processing,
        warnings: validation.warnings,
      };
    } catch (error) {
      console.error('Failed to submit nudge request:', error);
      return {
        success: false,
        nudgeId: 'unknown',
        error: 'Internal error processing nudge request',
      };
    }
  }

  /**
   * Cancel a pending nudge request
   */
  async cancelNudgeRequest(
    childAccountId: string,
    nudgeId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const queue = this.queues.get(childAccountId);
      if (!queue) {
        return { success: false, error: 'No queue found for child' };
      }

      const requestIndex = queue.requests.findIndex(r => r.id === nudgeId);
      if (requestIndex === -1) {
        return { success: false, error: 'Nudge request not found' };
      }

      const request = queue.requests[requestIndex];

      // Can't cancel if already in progress
      if (request.status === 'in_progress') {
        return {
          success: false,
          error: 'Cannot cancel nudge that is currently being processed',
        };
      }

      // Remove from queue
      queue.requests.splice(requestIndex, 1);
      request.status = 'cancelled';

      // Log the cancellation
      await this.logNudgeCancellation(request);

      return { success: true };
    } catch (error) {
      console.error('Failed to cancel nudge request:', error);
      return { success: false, error: 'Internal error' };
    }
  }

  /**
   * Update nudge request details
   */
  async updateNudgeRequest(
    childAccountId: string,
    nudgeId: string,
    updates: Partial<
      Pick<
        ParentNudgeRequest,
        'naturalPhrasing' | 'urgency' | 'scheduledFor' | 'context'
      >
    >
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const queue = this.queues.get(childAccountId);
      if (!queue) {
        return { success: false, error: 'No queue found for child' };
      }

      const request = queue.requests.find(r => r.id === nudgeId);
      if (!request) {
        return { success: false, error: 'Nudge request not found' };
      }

      // Can't update if already completed or failed
      if (['completed', 'failed'].includes(request.status)) {
        return {
          success: false,
          error: 'Cannot update completed or failed nudge',
        };
      }

      // Apply updates
      Object.assign(request, updates);

      // Re-validate after updates
      const validation = this.validateNudgeRequest(request);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Re-sort queue if urgency changed
      if (updates.urgency) {
        this.sortQueueByPriority(queue);
      }

      // Log the update
      await this.logNudgeUpdate(request, updates);

      return { success: true };
    } catch (error) {
      console.error('Failed to update nudge request:', error);
      return { success: false, error: 'Internal error' };
    }
  }

  /**
   * Get current queue status for a child
   */
  async getQueueStatus(childAccountId: string): Promise<NudgeQueueStatus> {
    const queue = this.getOrCreateQueue(childAccountId);
    const recentAttempts = await this.getRecentBridgeAttempts(childAccountId);

    const queueHealth = this.assessQueueHealth(queue, recentAttempts);
    const recommendations = this.generateRecommendations(
      queue,
      recentAttempts,
      queueHealth
    );

    return {
      pendingNudges: queue.requests.filter(r => r.status === 'pending'),
      recentAttempts,
      queueHealth,
      recommendations,
      estimatedProcessingTime: this.calculateTotalEstimatedTime(queue),
      successRate: queue.successRate,
    };
  }

  /**
   * Process next item in queue for a child
   */
  async processQueue(childAccountId: string): Promise<void> {
    const queue = this.queues.get(childAccountId);
    if (!queue || queue.processing) {
      return;
    }

    queue.processing = true;

    try {
      while (queue.requests.length > 0) {
        const nextRequest = this.getNextProcessableRequest(queue);
        if (!nextRequest) {
          break; // No processable requests right now
        }

        // Check if it's the right time to process this request
        if (!this.isOptimalProcessingTime(nextRequest)) {
          break; // Wait for better timing
        }

        // Mark as in progress
        nextRequest.status = 'in_progress';
        nextRequest.currentAttempts++;

        // Get processing callback
        const processor = this.processingCallbacks.get(childAccountId);
        if (!processor) {
          console.warn(
            'No processing callback registered for child:',
            childAccountId
          );
          break;
        }

        try {
          // Process the nudge
          const success = await processor(nextRequest);

          if (success) {
            nextRequest.status = 'completed';
            queue.requests = queue.requests.filter(
              r => r.id !== nextRequest.id
            );
          } else {
            // Handle failure
            if (nextRequest.currentAttempts >= nextRequest.maxAttempts) {
              nextRequest.status = 'failed';
              queue.requests = queue.requests.filter(
                r => r.id !== nextRequest.id
              );
            } else {
              nextRequest.status = 'pending';
              // Add cooldown before next attempt
              nextRequest.scheduledFor = new Date(
                Date.now() + this.config.cooldownBetweenAttempts * 60 * 1000
              );
            }
          }

          // Update queue metrics
          this.updateQueueMetrics(queue, success);
        } catch (processingError) {
          console.error('Error processing nudge:', processingError);
          nextRequest.status = 'failed';
          queue.requests = queue.requests.filter(r => r.id !== nextRequest.id);
        }

        // Brief pause between processing
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Clean up expired requests
      this.cleanupExpiredRequests(queue);
    } finally {
      queue.processing = false;
      queue.lastProcessedAt = new Date();
    }
  }

  /**
   * Register processing callback for a child
   */
  registerProcessingCallback(
    childAccountId: string,
    callback: (nudge: ParentNudgeRequest) => Promise<boolean>
  ): void {
    this.processingCallbacks.set(childAccountId, callback);
  }

  /**
   * Get processing statistics for analytics
   */
  async getProcessingStatistics(childAccountId: string): Promise<{
    totalProcessed: number;
    successRate: number;
    averageProcessingTime: number;
    queueThroughput: number; // requests per hour
    mostSuccessfulTopics: string[];
    recommendedOptimalTimes: string[];
  }> {
    const attempts = await this.getRecentBridgeAttempts(childAccountId, 100); // Last 100 attempts

    const totalProcessed = attempts.length;
    const successfulAttempts = attempts.filter(a => a.success).length;
    const successRate =
      totalProcessed > 0 ? successfulAttempts / totalProcessed : 0;

    // Calculate average processing time
    const processingTimes = attempts
      .map(a => a.responseTime || 0)
      .filter(t => t > 0);
    const averageProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((sum, t) => sum + t, 0) /
          processingTimes.length
        : 0;

    // Calculate throughput (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAttempts = attempts.filter(a => a.attemptedAt > last24Hours);
    const queueThroughput = recentAttempts.length;

    // Most successful topics
    const topicSuccess = new Map<
      string,
      { total: number; successful: number }
    >();
    attempts.forEach(a => {
      const existing = topicSuccess.get(a.targetTopic) || {
        total: 0,
        successful: 0,
      };
      existing.total++;
      if (a.success) existing.successful++;
      topicSuccess.set(a.targetTopic, existing);
    });

    const mostSuccessfulTopics = Array.from(topicSuccess.entries())
      .map(([topic, stats]) => ({
        topic,
        rate: stats.successful / stats.total,
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3)
      .map(item => item.topic);

    // Recommended optimal times (simplified - would use more sophisticated analysis)
    const timeSuccess = new Map<
      number,
      { total: number; successful: number }
    >();
    attempts.forEach(a => {
      const hour = a.attemptedAt.getHours();
      const existing = timeSuccess.get(hour) || { total: 0, successful: 0 };
      existing.total++;
      if (a.success) existing.successful++;
      timeSuccess.set(hour, existing);
    });

    const optimalHours = Array.from(timeSuccess.entries())
      .map(([hour, stats]) => ({
        hour,
        rate: stats.total > 2 ? stats.successful / stats.total : 0,
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3)
      .map(item => `${item.hour}:00`);

    return {
      totalProcessed,
      successRate,
      averageProcessingTime,
      queueThroughput,
      mostSuccessfulTopics,
      recommendedOptimalTimes: optimalHours,
    };
  }

  // Private helper methods

  private validateNudgeRequest(
    request: ParentNudgeRequest
  ): NudgeValidationResult {
    const warnings: string[] = [];

    // Required fields
    if (!request.targetTopic?.trim()) {
      return { isValid: false, error: 'Target topic is required' };
    }

    if (!request.naturalPhrasing?.trim()) {
      return { isValid: false, error: 'Natural phrasing is required' };
    }

    // Validate max attempts
    if (request.maxAttempts < 1 || request.maxAttempts > 5) {
      return { isValid: false, error: 'Max attempts must be between 1 and 5' };
    }

    // Validate urgency
    if (!['low', 'medium', 'high', 'immediate'].includes(request.urgency)) {
      return { isValid: false, error: 'Invalid urgency level' };
    }

    // Check natural phrasing quality
    if (request.naturalPhrasing.length < 10) {
      warnings.push(
        'Very short phrasing might not feel natural in conversation'
      );
    }

    if (request.naturalPhrasing.length > 150) {
      warnings.push('Long phrasing might be difficult to integrate naturally');
    }

    // Check for obvious forced phrasing
    const forcedPhrases = [
      'tell your child',
      'make sure to mention',
      'you need to',
      'remember to',
    ];
    if (
      forcedPhrases.some(phrase =>
        request.naturalPhrasing.toLowerCase().includes(phrase)
      )
    ) {
      warnings.push(
        'Phrasing might sound forced. Try making it more conversational.'
      );
    }

    // Check urgency vs scheduling conflict
    if (
      request.urgency === 'immediate' &&
      request.scheduledFor &&
      request.scheduledFor > new Date()
    ) {
      warnings.push('Immediate urgency conflicts with future scheduling');
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  private getOrCreateQueue(childAccountId: string): NudgeQueue {
    let queue = this.queues.get(childAccountId);

    if (!queue) {
      queue = {
        childAccountId,
        requests: [],
        processing: false,
        averageProcessingTime: 15, // 15 minutes default
        successRate: 0.8, // 80% default
      };
      this.queues.set(childAccountId, queue);
    }

    return queue;
  }

  private findDuplicateRequest(
    queue: NudgeQueue,
    newRequest: ParentNudgeRequest
  ): ParentNudgeRequest | null {
    return (
      queue.requests.find(existing => {
        // Check for similar target topic and phrasing
        const topicMatch =
          existing.targetTopic.toLowerCase() ===
          newRequest.targetTopic.toLowerCase();
        const phrasingSimilarity = this.calculatePhrasingSimilarity(
          existing.naturalPhrasing,
          newRequest.naturalPhrasing
        );

        return topicMatch && phrasingSimilarity > 0.8;
      }) || null
    );
  }

  private calculatePhrasingSimilarity(
    phrase1: string,
    phrase2: string
  ): number {
    // Simple word-based similarity calculation
    const words1 = new Set(phrase1.toLowerCase().split(/\s+/));
    const words2 = new Set(phrase2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  private async addToQueue(
    queue: NudgeQueue,
    request: ParentNudgeRequest
  ): Promise<number> {
    queue.requests.push(request);
    this.sortQueueByPriority(queue);

    return queue.requests.findIndex(r => r.id === request.id) + 1;
  }

  private sortQueueByPriority(queue: NudgeQueue): void {
    const urgencyPriority = { immediate: 4, high: 3, medium: 2, low: 1 };

    queue.requests.sort((a, b) => {
      // First by urgency
      const urgencyDiff =
        urgencyPriority[b.urgency] - urgencyPriority[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;

      // Then by scheduled time (if any)
      if (a.scheduledFor && b.scheduledFor) {
        return a.scheduledFor.getTime() - b.scheduledFor.getTime();
      }
      if (a.scheduledFor) return -1;
      if (b.scheduledFor) return 1;

      // Finally by creation time
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  private calculateEstimatedDelay(queue: NudgeQueue, position: number): number {
    const baseDelay = (position - 1) * queue.averageProcessingTime;
    const urgencyFactor = queue.requests
      .slice(0, position - 1)
      .reduce(
        (factor, req) => factor + (req.urgency === 'immediate' ? 0.5 : 1),
        0
      );

    return Math.round(baseDelay * urgencyFactor);
  }

  private getNextProcessableRequest(
    queue: NudgeQueue
  ): ParentNudgeRequest | null {
    const now = new Date();

    return (
      queue.requests.find(request => {
        // Must be pending
        if (request.status !== 'pending') return false;

        // Check if scheduled for future
        if (request.scheduledFor && request.scheduledFor > now) return false;

        // Check timeout for urgency
        const timeoutMinutes = this.config.urgencyTimeouts[request.urgency];
        const timeoutDate = new Date(
          request.createdAt.getTime() + timeoutMinutes * 60 * 1000
        );
        if (now > timeoutDate) {
          request.status = 'failed';
          return false;
        }

        return true;
      }) || null
    );
  }

  private isOptimalProcessingTime(request: ParentNudgeRequest): boolean {
    // Simplified - would use more sophisticated timing analysis
    const hour = new Date().getHours();

    // Generally good times for child conversation
    if (hour >= 7 && hour <= 9) return true; // Morning
    if (hour >= 15 && hour <= 18) return true; // After school
    if (hour >= 19 && hour <= 20) return true; // Early evening

    // Immediate urgency overrides timing
    return request.urgency === 'immediate';
  }

  private updateQueueMetrics(queue: NudgeQueue, success: boolean): void {
    // Update success rate with exponential moving average
    const alpha = 0.1; // Learning rate
    queue.successRate =
      alpha * (success ? 1 : 0) + (1 - alpha) * queue.successRate;

    // Update average processing time (simplified)
    if (queue.lastProcessedAt) {
      const processingTime =
        (Date.now() - queue.lastProcessedAt.getTime()) / (60 * 1000);
      queue.averageProcessingTime =
        alpha * processingTime + (1 - alpha) * queue.averageProcessingTime;
    }
  }

  private cleanupExpiredRequests(queue: NudgeQueue): void {
    const now = new Date();

    queue.requests = queue.requests.filter(request => {
      const timeoutMinutes = this.config.urgencyTimeouts[request.urgency];
      const timeoutDate = new Date(
        request.createdAt.getTime() + timeoutMinutes * 60 * 1000
      );

      if (now > timeoutDate && request.status === 'pending') {
        request.status = 'failed';
        return false;
      }

      return true;
    });
  }

  private calculateTotalEstimatedTime(queue: NudgeQueue): number {
    return queue.requests.length * queue.averageProcessingTime;
  }

  private assessQueueHealth(
    queue: NudgeQueue,
    recentAttempts: BridgeAttempt[]
  ): 'healthy' | 'backed_up' | 'stalled' {
    if (queue.requests.length > 3) return 'backed_up';

    if (recentAttempts.length > 5) {
      const failureRate =
        recentAttempts.filter(a => !a.success).length / recentAttempts.length;
      if (failureRate > 0.7) return 'stalled';
    }

    return 'healthy';
  }

  private generateRecommendations(
    queue: NudgeQueue,
    recentAttempts: BridgeAttempt[],
    health: 'healthy' | 'backed_up' | 'stalled'
  ): string[] {
    const recommendations: string[] = [];

    if (health === 'backed_up') {
      recommendations.push('Consider reducing the frequency of nudge requests');
      recommendations.push('Focus on your highest priority topics');
      recommendations.push('Try combining related topics into single nudges');
    }

    if (health === 'stalled') {
      recommendations.push("Recent nudges haven't been very successful");
      recommendations.push(
        'Try rephrasing your nudges to be more conversational'
      );
      recommendations.push(
        'Consider waiting for more natural conversation opportunities'
      );
      recommendations.push('Review the suggested optimal times for nudges');
    }

    if (health === 'healthy' && queue.requests.length === 0) {
      recommendations.push(
        'Your nudge queue is clear - great timing for new requests!'
      );
    }

    return recommendations;
  }

  // Database/logging methods (would be implemented with actual persistence)

  private async logNudgeSubmission(request: ParentNudgeRequest): Promise<void> {
    console.log('Nudge submitted:', {
      id: request.id,
      topic: request.targetTopic,
      urgency: request.urgency,
    });
  }

  private async logNudgeCancellation(
    request: ParentNudgeRequest
  ): Promise<void> {
    console.log('Nudge cancelled:', {
      id: request.id,
      topic: request.targetTopic,
    });
  }

  private async logNudgeUpdate(
    request: ParentNudgeRequest,
    updates: any
  ): Promise<void> {
    console.log('Nudge updated:', { id: request.id, updates });
  }

  private async getRecentBridgeAttempts(
    childAccountId: string,
    _limit: number = 20
  ): Promise<BridgeAttempt[]> {
    // Would fetch from database
    return [];
  }
}
