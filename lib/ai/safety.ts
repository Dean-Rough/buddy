import { validateSafety } from "./client";
import { prisma } from "../prisma";

export interface SafetyResult {
  isSafe: boolean;
  severity: number; // 0-3
  reason: string;
  action: 'allow' | 'warn' | 'block' | 'escalate';
  flaggedTerms: string[];
}

export interface SafetyContext {
  childId: string;
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
    const contextString = context.recentMessages?.slice(-3).join(" | ") || "";
    
    // Run AI safety validation
    const aiResult = await validateSafety(message, context.childAge, contextString);
    
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
    console.error("Safety validation error:", error);
    
    // Fail-safe: block if safety validation fails
    return {
      isSafe: false,
      severity: 3,
      reason: "Safety validation system error",
      action: "block",
      flaggedTerms: [],
    };
  }
}

/**
 * Rule-based safety checks for common patterns
 */
function runRuleBasedSafety(message: string, childAge: number): SafetyResult {
  const lowerMessage = message.toLowerCase();
  
  // High-severity patterns (immediate block)
  const criticalPatterns = [
    /\b(kill|murder|death|die|suicide)\b/i,
    /\b(address|phone.?number|where.?live)\b/i,
    /\b(secret|don'?t.?tell|hide.?from)\b/i,
    /\b(meet.?me|come.?over|visit.?me)\b/i,
  ];
  
  // Medium-severity patterns (warn/redirect)
  const warningPatterns = [
    /\b(stupid|dumb|hate|shut.?up)\b/i,
    /\b(scared|afraid|nightmare)\b/i,
    /\b(bleeding|hurt|pain)\b/i,
  ];
  
  // Check critical patterns
  for (const pattern of criticalPatterns) {
    if (pattern.test(message)) {
      return {
        isSafe: false,
        severity: 3,
        reason: "Message contains inappropriate content",
        action: "escalate",
        flaggedTerms: [pattern.source],
      };
    }
  }
  
  // Check warning patterns
  for (const pattern of warningPatterns) {
    if (pattern.test(message)) {
      return {
        isSafe: false,
        severity: 2,
        reason: "Message needs gentle redirection",
        action: "warn",
        flaggedTerms: [pattern.source],
      };
    }
  }
  
  // Check for ALL CAPS (might indicate shouting/upset)
  if (message.length > 10 && message === message.toUpperCase()) {
    return {
      isSafe: true,
      severity: 1,
      reason: "Message in all caps - child might be upset",
      action: "allow",
      flaggedTerms: ["ALL_CAPS"],
    };
  }
  
  return {
    isSafe: true,
    severity: 0,
    reason: "No safety concerns detected",
    action: "allow",
    flaggedTerms: [],
  };
}

/**
 * Combine AI and rule-based results (use most restrictive)
 */
function combineResults(aiResult: SafetyResult, ruleResult: SafetyResult): SafetyResult {
  const maxSeverity = Math.max(aiResult.severity, ruleResult.severity);
  const isSafe = aiResult.isSafe && ruleResult.isSafe;
  
  // Use result with higher severity
  const primaryResult = aiResult.severity >= ruleResult.severity ? aiResult : ruleResult;
  
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
        eventType: "message_flagged",
        severityLevel: result.severity,
        childId: context.childId,
        conversationId: context.conversationId,
        triggerContent: message,
        aiReasoning: result.reason,
        contextSummary: `Age: ${context.childAge}, Action: ${result.action}`,
        status: result.severity >= 3 ? "active" : "logged",
      },
    });
  } catch (error) {
    console.error("Failed to log safety event:", error);
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
    const child = await prisma.child.findUnique({
      where: { id: context.childId },
      include: { parent: true },
    });
    
    if (!child) return;
    
    // Create safety event
    const safetyEvent = await prisma.safetyEvent.create({
      data: {
        eventType: "escalated_content",
        severityLevel: result.severity,
        childId: context.childId,
        conversationId: context.conversationId,
        triggerContent: message,
        aiReasoning: result.reason,
        contextSummary: `Escalated: ${result.flaggedTerms.join(", ")}`,
        status: "active",
        parentNotifiedAt: new Date(),
      },
    });
    
    // Create parent notification
    await prisma.parentNotification.create({
      data: {
        parentId: child.parentId,
        childId: context.childId,
        notificationType: "safety_alert",
        subject: `Safety Alert: ${child.name}`,
        content: `Your child ${child.name} has shared content that requires your attention. Please review their recent conversation in your parent dashboard.`,
        deliveryMethod: "email",
        safetyEventId: safetyEvent.id,
        conversationId: context.conversationId,
      },
    });
    
    // TODO: Send actual email notification via Resend
    console.log(`Safety escalation created for child ${child.name} (${child.id})`);
    
  } catch (error) {
    console.error("Failed to escalate to parent:", error);
  }
}

/**
 * Get child-friendly safety response based on action
 */
export function getSafetyResponse(result: SafetyResult, childAge: number): string {
  switch (result.action) {
    case 'warn':
      if (childAge <= 8) {
        return "That's a good question, but maybe we could talk about something else? What's your favorite animal? 🐾";
      } else {
        return "I think that might be better to discuss with a grown-up you trust. How about we chat about something fun instead?";
      }
      
    case 'block':
      if (childAge <= 8) {
        return "Let's talk about something happier! What made you smile today? 😊";
      } else {
        return "That's something I can't help with, but a trusted adult definitely can! What else would you like to explore?";
      }
      
    case 'escalate':
      if (childAge <= 8) {
        return "That sounds like something important to share with a grown-up who takes care of you. They're really good at helping with big questions!";
      } else {
        return "That's definitely something to talk about with a parent, teacher, or another trusted adult. They'll know exactly how to help you.";
      }
      
    default:
      return "I want to make sure we have safe, fun conversations! Let's try talking about something else.";
  }
}