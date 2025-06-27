/**
 * Sibling Interaction Tracking and Management System
 * Manages family dynamics and cross-child interactions while maintaining privacy
 */

import { prisma } from '@/lib/prisma';
import { PrivacyIsolationService } from './privacy-isolation';

export type InteractionType =
  | 'shared_topic_discussion'
  | 'family_activity_mention'
  | 'sibling_mention'
  | 'comparative_behavior'
  | 'family_event_coordination';

export type InteractionSafety = 'safe' | 'monitored' | 'blocked';

interface SiblingInteraction {
  id: string;
  parentClerkUserId: string;
  childAccountIds: string[]; // Children involved in interaction
  interactionType: InteractionType;
  triggerContext: string; // What triggered this interaction detection
  safetyLevel: InteractionSafety;
  detectedAt: Date;
  familyBenefit: number; // 0-1 score of how beneficial this is for family coordination
  privacyRisk: number; // 0-1 score of privacy risk
  parentNotificationSent: boolean;
}

interface FamilyDynamics {
  parentClerkUserId: string;
  totalChildren: number;
  activeChildren: number; // Currently using the platform
  commonInterests: string[];
  sharedActivities: string[];
  familyEngagementScore: number;
  siblingCompatibilityMatrix: Record<string, Record<string, number>>; // child1 -> child2 -> compatibility score
  lastUpdated: Date;
}

/**
 * Sibling Interaction Manager
 * Core service for tracking and managing family interactions
 */
export class SiblingInteractionManager {
  /**
   * Detect potential sibling interactions from conversation content
   */
  static async detectSiblingInteraction(
    childAccountId: string,
    conversationContent: string,
    topics: string[],
    contextMetadata: {
      messageCount: number;
      mood?: string;
      timeOfDay: string;
    }
  ): Promise<SiblingInteraction | null> {
    try {
      // Get child info and family context
      const child = await prisma.childAccount.findUnique({
        where: { id: childAccountId },
        select: {
          id: true,
          name: true,
          age: true,
          parentClerkUserId: true,
        },
      });

      if (!child) {
        throw new Error('Child not found');
      }

      // Get siblings
      const siblings = await prisma.childAccount.findMany({
        where: {
          parentClerkUserId: child.parentClerkUserId,
          id: { not: childAccountId },
          accountStatus: 'active',
        },
        select: { id: true, name: true, age: true },
      });

      if (siblings.length === 0) {
        return null; // No siblings to interact with
      }

      // Analyze conversation for sibling interaction patterns
      const interactionAnalysis = await this.analyzeForSiblingPatterns(
        conversationContent,
        topics,
        child,
        siblings,
        contextMetadata
      );

      if (!interactionAnalysis.detected) {
        return null;
      }

      // Create interaction record
      const interaction = await this.recordSiblingInteraction({
        parentClerkUserId: child.parentClerkUserId,
        childAccountIds: [
          childAccountId,
          ...interactionAnalysis.involvedSiblings,
        ],
        interactionType: interactionAnalysis.type,
        triggerContext: interactionAnalysis.context,
        safetyLevel: interactionAnalysis.safety,
        familyBenefit: interactionAnalysis.familyBenefit,
        privacyRisk: interactionAnalysis.privacyRisk,
      });

      // Update family dynamics
      await this.updateFamilyDynamics(child.parentClerkUserId);

      return interaction;
    } catch (error) {
      console.error('Error detecting sibling interaction:', error);
      return null;
    }
  }

  /**
   * Analyze conversation content for sibling interaction patterns
   */
  private static async analyzeForSiblingPatterns(
    content: string,
    topics: string[],
    child: { id: string; name: string; age: number },
    siblings: { id: string; name: string; age: number }[],
    _context: { messageCount: number; mood?: string; timeOfDay: string }
  ): Promise<{
    detected: boolean;
    type: InteractionType;
    involvedSiblings: string[];
    context: string;
    safety: InteractionSafety;
    familyBenefit: number;
    privacyRisk: number;
  }> {
    const contentLower = content.toLowerCase();
    const involvedSiblings: string[] = [];
    let interactionType: InteractionType = 'shared_topic_discussion';
    let familyBenefit = 0.5;
    let privacyRisk = 0.3;
    let safety: InteractionSafety = 'safe';

    // Check for direct sibling mentions
    const siblingMentions = siblings.filter(sibling => {
      const mentionsName = contentLower.includes(sibling.name.toLowerCase());
      const mentionsBrother =
        contentLower.includes('brother') || contentLower.includes('bro');
      const mentionsSister =
        contentLower.includes('sister') || contentLower.includes('sis');

      if (mentionsName) {
        involvedSiblings.push(sibling.id);
        return true;
      }

      // Age-based detection for generic sibling terms
      if (mentionsBrother || mentionsSister) {
        // Only count if the age difference makes sense
        const ageDiff = Math.abs(child.age - sibling.age);
        if (ageDiff <= 4) {
          // Reasonable sibling age gap
          involvedSiblings.push(sibling.id);
          return true;
        }
      }

      return false;
    });

    if (siblingMentions.length > 0) {
      interactionType = 'sibling_mention';
      familyBenefit = 0.7;
      privacyRisk = 0.4;
    }

    // Check for family activity mentions
    const familyActivityPatterns = [
      'family trip',
      'family dinner',
      'family movie',
      'family game',
      'vacation',
      'holiday',
      'birthday',
      'christmas',
      'easter',
      'mum said',
      'dad said',
      'parents',
      'family',
    ];

    const hasFamilyActivity = familyActivityPatterns.some(pattern =>
      contentLower.includes(pattern)
    );

    if (hasFamilyActivity) {
      interactionType = 'family_activity_mention';
      familyBenefit = 0.8;
      privacyRisk = 0.2;

      // Include all siblings for family activities
      siblings.forEach(sibling => {
        if (!involvedSiblings.includes(sibling.id)) {
          involvedSiblings.push(sibling.id);
        }
      });
    }

    // Check for shared interests in topics
    const sharedTopicPatterns = [
      'minecraft',
      'roblox',
      'fortnite',
      'pokemon',
      'football',
      'soccer',
      'youtube',
      'tiktok',
      'school',
      'homework',
      'friends',
    ];

    const hasSharedTopics = topics.some(topic =>
      sharedTopicPatterns.includes(topic.toLowerCase())
    );

    if (hasSharedTopics && involvedSiblings.length === 0) {
      // Potential shared interest - include age-appropriate siblings
      siblings.forEach(sibling => {
        const ageDiff = Math.abs(child.age - sibling.age);
        if (ageDiff <= 3) {
          // Similar ages likely share interests
          involvedSiblings.push(sibling.id);
        }
      });

      if (involvedSiblings.length > 0) {
        interactionType = 'shared_topic_discussion';
        familyBenefit = 0.6;
        privacyRisk = 0.3;
      }
    }

    // Check for comparative behavior patterns
    const comparativePatterns = [
      'better than',
      'worse than',
      'not as good as',
      'my sister is',
      'my brother is',
      'they can',
      'they always',
    ];

    const hasComparative = comparativePatterns.some(pattern =>
      contentLower.includes(pattern)
    );

    if (hasComparative && siblingMentions.length > 0) {
      interactionType = 'comparative_behavior';
      familyBenefit = 0.4; // Lower benefit for comparisons
      privacyRisk = 0.6; // Higher privacy risk
      safety = 'monitored'; // Needs monitoring for negative comparisons
    }

    // Safety assessment
    if (
      contentLower.includes('hate') ||
      contentLower.includes('stupid') ||
      contentLower.includes('annoying') ||
      contentLower.includes('mean')
    ) {
      if (involvedSiblings.length > 0) {
        safety = 'monitored';
        privacyRisk = 0.8;
        familyBenefit = 0.2;
      }
    }

    return {
      detected: involvedSiblings.length > 0,
      type: interactionType,
      involvedSiblings,
      context: `${interactionType} detected in conversation about: ${topics.join(', ')}`,
      safety,
      familyBenefit,
      privacyRisk,
    };
  }

  /**
   * Record a sibling interaction in the database
   */
  private static async recordSiblingInteraction(params: {
    parentClerkUserId: string;
    childAccountIds: string[];
    interactionType: InteractionType;
    triggerContext: string;
    safetyLevel: InteractionSafety;
    familyBenefit: number;
    privacyRisk: number;
  }): Promise<SiblingInteraction> {
    // In a real implementation, this would be stored in a proper database table
    // For now, we'll create a mock interaction object
    const interaction: SiblingInteraction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      parentClerkUserId: params.parentClerkUserId,
      childAccountIds: params.childAccountIds,
      interactionType: params.interactionType,
      triggerContext: params.triggerContext,
      safetyLevel: params.safetyLevel,
      detectedAt: new Date(),
      familyBenefit: params.familyBenefit,
      privacyRisk: params.privacyRisk,
      parentNotificationSent: false,
    };

    // Log the interaction for audit
    console.log('Sibling Interaction Recorded:', {
      type: params.interactionType,
      children: params.childAccountIds.length,
      safety: params.safetyLevel,
      familyBenefit: params.familyBenefit,
      privacyRisk: params.privacyRisk,
    });

    // If high family benefit and low privacy risk, consider parent notification
    if (params.familyBenefit > 0.7 && params.privacyRisk < 0.4) {
      await this.scheduleParentNotification(interaction);
    }

    return interaction;
  }

  /**
   * Update family dynamics based on recent interactions
   */
  static async updateFamilyDynamics(
    parentClerkUserId: string
  ): Promise<FamilyDynamics> {
    try {
      // Get all children
      const children = await prisma.childAccount.findMany({
        where: { parentClerkUserId },
        select: { id: true, name: true, age: true, accountStatus: true },
      });

      // Get recent conversations to analyze common interests
      const recentConversations = await prisma.conversation.findMany({
        where: {
          childAccount: { parentClerkUserId },
          startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
        },
        select: {
          childAccountId: true,
          topics: true,
          mood: true,
        },
      });

      // Analyze common interests
      const allTopics = recentConversations.flatMap(conv => conv.topics || []);
      const topicCounts = allTopics.reduce(
        (counts: Record<string, number>, topic) => {
          counts[topic] = (counts[topic] || 0) + 1;
          return counts;
        },
        {}
      );

      const commonInterests = Object.entries(topicCounts)
        .filter(([, count]) => count >= 2) // Topics mentioned by multiple children
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([topic]) => topic);

      // Calculate family engagement score
      const totalConversations = recentConversations.length;
      const activeChildren = new Set(
        recentConversations.map(conv => conv.childAccountId)
      ).size;
      const familyEngagementScore =
        activeChildren > 0
          ? Math.min(totalConversations / (activeChildren * 7), 1)
          : 0; // Max 1 conversation per child per day

      // Create sibling compatibility matrix
      const siblingCompatibilityMatrix: Record<
        string,
        Record<string, number>
      > = {};

      children.forEach(child1 => {
        siblingCompatibilityMatrix[child1.id] = {};
        children.forEach(child2 => {
          if (child1.id !== child2.id) {
            // Calculate compatibility based on age difference and shared topics
            const ageDiff = Math.abs(child1.age - child2.age);
            const ageCompatibility = Math.max(0, 1 - ageDiff / 6); // Max age difference of 6 years

            // Get topics for each child
            const child1Topics = recentConversations
              .filter(conv => conv.childAccountId === child1.id)
              .flatMap(conv => conv.topics || []);
            const child2Topics = recentConversations
              .filter(conv => conv.childAccountId === child2.id)
              .flatMap(conv => conv.topics || []);

            // Calculate topic overlap
            const sharedTopics = child1Topics.filter(topic =>
              child2Topics.includes(topic)
            );
            const topicCompatibility =
              sharedTopics.length > 0
                ? sharedTopics.length /
                  Math.max(child1Topics.length, child2Topics.length, 1)
                : 0;

            // Combined compatibility score
            siblingCompatibilityMatrix[child1.id][child2.id] =
              ageCompatibility * 0.6 + topicCompatibility * 0.4;
          }
        });
      });

      const familyDynamics: FamilyDynamics = {
        parentClerkUserId,
        totalChildren: children.length,
        activeChildren,
        commonInterests,
        sharedActivities: [], // Could be enhanced with activity detection
        familyEngagementScore,
        siblingCompatibilityMatrix,
        lastUpdated: new Date(),
      };

      return familyDynamics;
    } catch (error) {
      console.error('Error updating family dynamics:', error);
      throw error;
    }
  }

  /**
   * Get family interaction insights for parent dashboard
   */
  static async getFamilyInteractionInsights(
    parentClerkUserId: string,
    _days: number = 7
  ): Promise<{
    totalInteractions: number;
    interactionTypes: Record<InteractionType, number>;
    familyBenefitScore: number;
    privacyRiskScore: number;
    recommendations: string[];
    siblingPairs: Array<{
      child1: string;
      child2: string;
      compatibilityScore: number;
      recentInteractions: number;
    }>;
  }> {
    try {
      const dynamics = await this.updateFamilyDynamics(parentClerkUserId);

      // In a real implementation, this would query actual interaction records
      // For now, we'll return mock insights based on the dynamics

      const insights: {
        totalInteractions: number;
        interactionTypes: Record<InteractionType, number>;
        familyBenefitScore: number;
        privacyRiskScore: number;
        recommendations: string[];
        siblingPairs: Array<{
          child1: string;
          child2: string;
          compatibilityScore: number;
          recentInteractions: number;
        }>;
      } = {
        totalInteractions: Math.floor(dynamics.familyEngagementScore * 20), // Estimate
        interactionTypes: {
          shared_topic_discussion: 5,
          family_activity_mention: 3,
          sibling_mention: 2,
          comparative_behavior: 1,
          family_event_coordination: 2,
        } as Record<InteractionType, number>,
        familyBenefitScore: Math.min(dynamics.familyEngagementScore + 0.3, 1),
        privacyRiskScore: 0.2, // Generally low for family interactions
        recommendations: [],
        siblingPairs: [],
      };

      // Generate recommendations
      if (dynamics.familyEngagementScore < 0.3) {
        insights.recommendations.push(
          'Consider encouraging more shared family activities'
        );
      }

      if (dynamics.commonInterests.length > 0) {
        insights.recommendations.push(
          `Your children share interests in: ${dynamics.commonInterests.slice(0, 3).join(', ')}`
        );
      }

      // Generate sibling pair insights
      const children = await prisma.childAccount.findMany({
        where: { parentClerkUserId },
        select: { id: true, name: true },
      });

      insights.siblingPairs = children.flatMap(child1 =>
        children
          .filter(child2 => child1.id < child2.id) // Avoid duplicates
          .map(child2 => ({
            child1: child1.name,
            child2: child2.name,
            compatibilityScore:
              dynamics.siblingCompatibilityMatrix[child1.id]?.[child2.id] || 0,
            recentInteractions: Math.floor(Math.random() * 5), // Mock data
          }))
      );

      return insights;
    } catch (error) {
      console.error('Error getting family interaction insights:', error);
      throw error;
    }
  }

  /**
   * Schedule parent notification for beneficial interactions
   */
  private static async scheduleParentNotification(
    interaction: SiblingInteraction
  ): Promise<void> {
    // In production, this would integrate with the parent notification system
    console.log(
      'Scheduling parent notification for beneficial family interaction:',
      {
        type: interaction.interactionType,
        benefit: interaction.familyBenefit,
        children: interaction.childAccountIds.length,
      }
    );
  }

  /**
   * Check if sibling interaction is allowed between specific children
   */
  static async isSiblingInteractionAllowed(
    child1Id: string,
    child2Id: string
  ): Promise<boolean> {
    try {
      // Check privacy settings for both children
      const [child1Privacy, child2Privacy] = await Promise.all([
        PrivacyIsolationService.getChildPrivacySettings(child1Id),
        PrivacyIsolationService.getChildPrivacySettings(child2Id),
      ]);

      // Both children must allow sibling interaction
      return (
        child1Privacy.allowSiblingInteraction &&
        child2Privacy.allowSiblingInteraction
      );
    } catch (error) {
      console.error('Error checking sibling interaction permissions:', error);
      return false;
    }
  }

  /**
   * Get sanitized sibling information for child conversations
   */
  static async getSanitizedSiblingInfo(
    requestingChildId: string,
    targetSiblingId: string
  ): Promise<{
    name: string;
    age: number;
    sharedInterests: string[];
    canInteract: boolean;
  } | null> {
    try {
      // Verify they are siblings
      const [requestingChild, targetSibling] = await Promise.all([
        prisma.childAccount.findUnique({
          where: { id: requestingChildId },
          select: { parentClerkUserId: true },
        }),
        prisma.childAccount.findUnique({
          where: { id: targetSiblingId },
          select: {
            parentClerkUserId: true,
            name: true,
            age: true,
          },
        }),
      ]);

      if (!requestingChild || !targetSibling) {
        return null;
      }

      if (
        requestingChild.parentClerkUserId !== targetSibling.parentClerkUserId
      ) {
        return null; // Not siblings
      }

      // Check interaction permissions
      const canInteract = await this.isSiblingInteractionAllowed(
        requestingChildId,
        targetSiblingId
      );

      if (!canInteract) {
        return null;
      }

      // Get shared interests (from family dynamics)
      const dynamics = await this.updateFamilyDynamics(
        requestingChild.parentClerkUserId
      );

      return {
        name: targetSibling.name,
        age: targetSibling.age,
        sharedInterests: dynamics.commonInterests.slice(0, 5), // Top 5 shared interests
        canInteract: true,
      };
    } catch (error) {
      console.error('Error getting sanitized sibling info:', error);
      return null;
    }
  }
}
