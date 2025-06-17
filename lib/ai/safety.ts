import { validateSafety } from './client';
import { prisma } from '../prisma';
import { sendSafetyAlert } from '../notifications';
import {
  getCompiledSafetyPatterns,
  getSafetyResponseFromConfig,
} from '../config-loader';
import { safetyCache } from './safety-cache';
import { safetyFallback } from './safety-fallback';
import fs from 'fs';
import path from 'path';

export interface SafetyResult {
  isSafe: boolean;
  severity: number; // 0-3
  reason: string;
  action: 'allow' | 'warn' | 'block' | 'escalate';
  flaggedTerms: string[];
  processingTime?: number;
  cacheHit?: boolean;
  fallbackUsed?: boolean;
}

export interface SafetyContext {
  childAccountId: string;
  childAge: number;
  conversationId?: string;
  recentMessages?: string[];
}

/**
 * Optimized safety validation with parallel processing, caching, and fallbacks
 */
export async function validateMessageSafety(
  message: string,
  context: SafetyContext
): Promise<SafetyResult> {
  const startTime = Date.now();

  try {
    // Check cache first for performance
    const contextString = context.recentMessages?.slice(-2).join(' | ') || '';
    const cachedResult = safetyCache.get(
      message,
      context.childAge,
      contextString
    );

    if (cachedResult) {
      return {
        ...cachedResult,
        processingTime: Date.now() - startTime,
        cacheHit: true,
      };
    }

    // Determine if we should use fallback
    const useFallback = safetyFallback.shouldUseFallback();

    let aiResult: SafetyResult;
    let ruleBasedResult: SafetyResult;

    if (useFallback) {
      // Use enhanced fallback system
      ruleBasedResult = safetyFallback.validateWithFallback(message, context);
      aiResult = ruleBasedResult; // Use same result to avoid conflicts
    } else {
      // Run AI and rule-based checks in parallel for better performance
      const [aiPromise, rulePromise] = await Promise.allSettled([
        validateSafetyWithOptimizedPrompt(
          message,
          context.childAge,
          contextString
        ),
        Promise.resolve(runRuleBasedSafety(message, context.childAge)),
      ]);

      // Handle AI result
      if (aiPromise.status === 'fulfilled') {
        aiResult = aiPromise.value;
        safetyFallback.setAIServiceStatus(false); // AI is working
      } else {
        console.warn(
          'AI safety validation failed, using fallback:',
          aiPromise.reason
        );
        safetyFallback.setAIServiceStatus(true);
        aiResult = safetyFallback.validateWithFallback(message, context);
        // Mark that we used fallback
        aiResult.fallbackUsed = true;
      }

      // Handle rule-based result
      ruleBasedResult =
        rulePromise.status === 'fulfilled'
          ? rulePromise.value
          : getFailSafeResult('Rule-based validation error');
    }

    // Combine results - use most restrictive
    const combinedResult = combineResults(aiResult, ruleBasedResult);

    // Add performance metadata
    const finalResult: SafetyResult = {
      ...combinedResult,
      processingTime: Date.now() - startTime,
      cacheHit: false,
      fallbackUsed: useFallback,
    };

    // Cache result for future use (excluding high-severity results)
    if (finalResult.severity < 3) {
      safetyCache.set(message, context.childAge, finalResult, contextString);
    }

    // Log safety event if concerning
    if (finalResult.severity >= 2) {
      await logSafetyEvent(message, finalResult, context);
    }

    // Escalate to parents if severity 3
    if (finalResult.severity >= 3) {
      await escalateToParent(message, finalResult, context);
    }

    return finalResult;
  } catch (error) {
    console.error('Safety validation error:', error);

    // Fail-safe: use enhanced fallback
    const fallbackResult = safetyFallback.validateWithFallback(
      message,
      context
    );
    return {
      ...fallbackResult,
      processingTime: Date.now() - startTime,
      cacheHit: false,
      fallbackUsed: true,
    };
  }
}

/**
 * Optimized AI safety validation with faster prompts
 */
async function validateSafetyWithOptimizedPrompt(
  message: string,
  childAge: number,
  context: string
): Promise<SafetyResult> {
  try {
    // Call AI with optimized settings
    const result = await validateSafety(message, childAge, context);

    return result;
  } catch (error) {
    console.error('Optimized AI validation failed:', error);
    throw error;
  }
}

/**
 * Load optimized prompt configuration
 * TODO: Used for future performance optimizations - will be integrated in next iteration
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _loadOptimizedPrompts() {
  try {
    const configPath = path.join(
      process.cwd(),
      'config',
      'optimized-safety-prompts.json'
    );
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Failed to load optimized prompts:', error);
    // Return minimal fallback config
    return {
      fast_validation_prompt:
        'Safety check for child age {age}: \'{message}\'. JSON: {"isSafe": true, "severity": 0, "reason": "fallback", "flaggedTerms": []}',
      performance_optimizations: {
        max_tokens: 150,
        temperature: 0.1,
        timeout_ms: 5000,
      },
    };
  }
}

/**
 * Get fail-safe result for error conditions
 */
function getFailSafeResult(reason: string): SafetyResult {
  return {
    isSafe: false,
    severity: 2,
    reason,
    action: 'warn',
    flaggedTerms: ['system_error'],
  };
}

/**
 * Batch safety validation for multiple messages
 */
export async function validateMessagesSafety(
  messages: Array<{ message: string; context: SafetyContext }>,
  options: { parallel?: boolean; batchSize?: number } = {}
): Promise<SafetyResult[]> {
  const { parallel = true, batchSize = 5 } = options;

  if (!parallel) {
    // Sequential processing
    const results: SafetyResult[] = [];
    for (const { message, context } of messages) {
      results.push(await validateMessageSafety(message, context));
    }
    return results;
  }

  // Parallel batch processing
  const results: SafetyResult[] = [];
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const batchPromises = batch.map(({ message, context }) =>
      validateMessageSafety(message, context)
    );

    const batchResults = await Promise.allSettled(batchPromises);

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        const fallbackResult = getFailSafeResult('Batch validation error');
        fallbackResult.fallbackUsed = true;
        results.push(fallbackResult);
      }
    }
  }

  return results;
}

/**
 * Get safety system performance metrics
 */
export function getSafetyMetrics() {
  const cacheStats = safetyCache.getStats();
  const fallbackStatus = safetyFallback.getStatus();

  return {
    cache: cacheStats,
    fallback: fallbackStatus,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Rule-based safety checks using modular configuration
 */
function runRuleBasedSafety(message: string, _childAge: number): SafetyResult {
  try {
    const patterns = getCompiledSafetyPatterns();

    // Check critical patterns (immediate escalation)
    for (const pattern of patterns.critical) {
      if (pattern.regex.test(message)) {
        return {
          isSafe: false,
          severity: 3,
          reason: pattern.reason,
          action: 'escalate',
          flaggedTerms: [pattern.category],
        };
      }
    }

    // Check emotional support patterns (allow but offer support)
    for (const pattern of patterns.emotionalSupport) {
      if (pattern.regex.test(message)) {
        return {
          isSafe: true,
          severity: 1,
          reason: pattern.reason,
          action: 'allow',
          flaggedTerms: [pattern.supportResponse || 'emotional_support_needed'],
        };
      }
    }

    // Check high concern patterns (Level 2)
    for (const pattern of patterns.highConcern) {
      if (pattern.regex.test(message)) {
        return {
          isSafe: false,
          severity: 2,
          reason: pattern.reason,
          action: 'warn',
          flaggedTerms: [pattern.category],
        };
      }
    }

    // Check contextual guidance patterns (gentle guidance)
    for (const pattern of patterns.contextualGuidance) {
      if (pattern.regex.test(message)) {
        return {
          isSafe: false,
          severity: 2,
          reason: pattern.reason,
          action: 'warn',
          flaggedTerms: [pattern.category],
        };
      }
    }

    // Check youth culture patterns (monitoring)
    for (const pattern of patterns.youthCulture) {
      if (pattern.regex.test(message)) {
        return {
          isSafe: true,
          severity: 1,
          reason: pattern.reason,
          action: 'allow',
          flaggedTerms: [pattern.category],
        };
      }
    }

    // Check gaming patterns (monitoring)
    for (const pattern of patterns.gaming) {
      if (pattern.regex.test(message)) {
        return {
          isSafe: true,
          severity: 1,
          reason: pattern.reason,
          action: 'allow',
          flaggedTerms: [pattern.category],
        };
      }
    }

    // Check school patterns (monitoring)
    for (const pattern of patterns.school) {
      if (pattern.regex.test(message)) {
        return {
          isSafe: true,
          severity: 1,
          reason: pattern.reason,
          action: 'allow',
          flaggedTerms: [pattern.category],
        };
      }
    }

    return {
      isSafe: true,
      severity: 0,
      reason: 'No safety concerns detected',
      action: 'allow',
      flaggedTerms: [],
    };
  } catch (error) {
    console.error('Error loading safety patterns:', error);
    // Fallback to safe mode if config loading fails
    return {
      isSafe: false,
      severity: 2,
      reason: 'Safety configuration error - using safe defaults',
      action: 'warn',
      flaggedTerms: ['config_error'],
    };
  }
}

/**
 * Combine AI and rule-based results (use most restrictive)
 */
function combineResults(
  aiResult: SafetyResult,
  ruleResult: SafetyResult
): SafetyResult {
  const maxSeverity = Math.max(aiResult.severity, ruleResult.severity);
  const isSafe = aiResult.isSafe && ruleResult.isSafe;

  // Use result with higher severity
  const primaryResult =
    aiResult.severity >= ruleResult.severity ? aiResult : ruleResult;

  return {
    isSafe,
    severity: maxSeverity,
    reason: primaryResult.reason,
    action: primaryResult.action,
    flaggedTerms: [...aiResult.flaggedTerms, ...ruleResult.flaggedTerms],
    fallbackUsed: aiResult.fallbackUsed || ruleResult.fallbackUsed,
  };
}

/**
 * Log safety event to database
 */
async function logSafetyEvent(
  message: string,
  result: SafetyResult,
  context: SafetyContext
): Promise<void> {
  try {
    await prisma.safetyEvent.create({
      data: {
        eventType: 'message_flagged',
        severityLevel: result.severity,
        childAccountId: context.childAccountId,
        conversationId: context.conversationId,
        triggerContent: message,
        aiReasoning: result.reason,
        contextSummary: `Age: ${context.childAge}, Action: ${result.action}`,
        status: result.severity >= 3 ? 'active' : 'logged',
      },
    });
  } catch (error) {
    console.error('Failed to log safety event:', error);
  }
}

/**
 * Escalate concerning content to parents
 */
async function escalateToParent(
  message: string,
  result: SafetyResult,
  context: SafetyContext
): Promise<void> {
  try {
    // Get child and parent info
    const child = await prisma.childAccount.findUnique({
      where: { id: context.childAccountId },
      include: { parent: true },
    });

    if (!child) return;

    // Create safety event
    const safetyEvent = await prisma.safetyEvent.create({
      data: {
        eventType: 'escalated_content',
        severityLevel: result.severity,
        childAccountId: context.childAccountId,
        conversationId: context.conversationId,
        triggerContent: message,
        aiReasoning: result.reason,
        contextSummary: `Escalated: ${result.flaggedTerms.join(', ')}`,
        status: 'active',
        parentNotifiedAt: new Date(),
      },
    });

    // Generate AI response for context in email
    const aiResponse = getSafetyResponse(result, context.childAge);

    // Create parent notification
    const notification = await prisma.parentNotification.create({
      data: {
        parentClerkUserId: child.parentClerkUserId,
        childAccountId: context.childAccountId,
        notificationType: 'safety_alert',
        subject: `Safety Alert: ${child.name}`,
        content: `Your child ${child.name} has shared content that requires your attention. Please review their recent conversation in your parent dashboard.`,
        deliveryMethod: 'email',
        safetyEventId: safetyEvent.id,
        conversationId: context.conversationId,
        status: 'pending',
      },
    });

    // Send actual email notification via Resend
    const emailSent = await sendSafetyAlert(
      child.parent.email,
      child.name,
      result.severity,
      message,
      aiResponse
    );

    // Update notification status based on email delivery
    await prisma.parentNotification.update({
      where: { id: notification.id },
      data: {
        status: emailSent ? 'sent' : 'failed',
        sentAt: emailSent ? new Date() : undefined,
      },
    });

    console.log(
      `Safety escalation processed for child ${child.name} (${child.id}) - Email ${emailSent ? 'sent' : 'failed'}`
    );
  } catch (error) {
    console.error('Failed to escalate to parent:', error);
  }
}

/**
 * Get child-friendly safety response using modular configuration
 */
export function getSafetyResponse(
  result: SafetyResult,
  childAge: number
): string {
  try {
    // Handle emotional support scenarios specially
    if (result.flaggedTerms.includes('emotional_support_needed')) {
      return getSafetyResponseFromConfig('emotional_support', childAge);
    }

    // Check for specific categories that have custom responses
    const flaggedCategories = result.flaggedTerms;

    // Handle swearing with fun responses
    if (flaggedCategories.includes('swearing')) {
      return getSafetyResponseFromConfig('swearing_response', childAge);
    }

    // Handle inappropriate content
    if (
      flaggedCategories.some(term =>
        ['development', 'substances', 'identity'].includes(term)
      )
    ) {
      return getSafetyResponseFromConfig('inappropriate_content', childAge);
    }

    // Default action-based responses
    switch (result.action) {
      case 'warn':
        return getSafetyResponseFromConfig('gentle_redirect', childAge);

      case 'block':
        return getSafetyResponseFromConfig('block_response', childAge);

      case 'escalate':
        return getSafetyResponseFromConfig('escalate_response', childAge);

      default:
        return "i want to make sure we have good conversations! what's going on?";
    }
  } catch (error) {
    console.error('Error loading safety response config:', error);
    // Fallback responses if config fails
    return "i want to make sure we have good conversations! what's going on?";
  }
}
