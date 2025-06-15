import { validateSafety } from './client';
import { prisma } from '../prisma';
import { sendSafetyAlert } from '../notifications';
import {
  getCompiledSafetyPatterns,
  getSafetyResponseFromConfig,
} from '../config-loader';

export interface SafetyResult {
  isSafe: boolean;
  severity: number; // 0-3
  reason: string;
  action: 'allow' | 'warn' | 'block' | 'escalate';
  flaggedTerms: string[];
}

export interface SafetyContext {
  childAccountId: string;
  childAge: number;
  conversationId?: string;
  recentMessages?: string[];
}

/**
 * Comprehensive safety validation with context awareness
 */
export async function validateMessageSafety(
  message: string,
  context: SafetyContext
): Promise<SafetyResult> {
  try {
    // Build context string from recent messages
    const contextString = context.recentMessages?.slice(-3).join(' | ') || '';

    // Run AI safety validation (with mock fallback)
    const aiResult = await validateSafety(
      message,
      context.childAge,
      contextString
    );

    // Run additional rule-based checks
    const ruleBasedResult = runRuleBasedSafety(message, context.childAge);

    // Combine results - use most restrictive
    const combinedResult = combineResults(aiResult, ruleBasedResult);

    // Log safety event if concerning
    if (combinedResult.severity >= 2) {
      await logSafetyEvent(message, combinedResult, context);
    }

    // Escalate to parents if severity 3
    if (combinedResult.severity >= 3) {
      await escalateToParent(message, combinedResult, context);
    }

    return combinedResult;
  } catch (error) {
    console.error('Safety validation error:', error);

    // Fail-safe: block if safety validation fails
    return {
      isSafe: false,
      severity: 3,
      reason: 'Safety validation system error',
      action: 'block',
      flaggedTerms: [],
    };
  }
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
