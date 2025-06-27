/**
 * Multi-Child Privacy Isolation System
 * Enforces strict data boundaries between children in the same family
 */

import { prisma } from '@/lib/prisma';

export type PrivacyLevel = 'strict' | 'family_shared' | 'parent_only';
export type DataCategory =
  | 'conversations'
  | 'safety_events'
  | 'usage_analytics'
  | 'memories'
  | 'preferences';

interface ChildPrivacySettings {
  childAccountId: string;
  conversationPrivacy: PrivacyLevel;
  safetyEventPrivacy: PrivacyLevel;
  usageAnalyticsPrivacy: PrivacyLevel;
  memoryPrivacy: PrivacyLevel;
  preferencesPrivacy: PrivacyLevel;
  allowSiblingInteraction: boolean;
  parentVisibilityLevel: 'full' | 'summaries_only' | 'safety_only';
}

export interface DataAccessRequest {
  requestingChildId?: string; // Child requesting data about sibling
  requestingParentId: string;
  targetChildId: string;
  dataCategory: DataCategory;
  operation: 'read' | 'write' | 'delete' | 'export';
}

/**
 * Privacy Isolation Service
 * Core service for enforcing multi-child data boundaries
 */
export class PrivacyIsolationService {
  /**
   * Get privacy settings for a specific child
   */
  static async getChildPrivacySettings(
    childAccountId: string
  ): Promise<ChildPrivacySettings> {
    const child = await prisma.childAccount.findUnique({
      where: { id: childAccountId },
      select: {
        id: true,
        parentClerkUserId: true,
        visibilityLevel: true,
      },
    });

    if (!child) {
      throw new Error('Child account not found');
    }

    // For now, return default strict settings
    // In production, these would be stored in a separate privacy settings table
    return {
      childAccountId: child.id,
      conversationPrivacy: 'strict',
      safetyEventPrivacy: 'parent_only',
      usageAnalyticsPrivacy: 'family_shared',
      memoryPrivacy: 'strict',
      preferencesPrivacy: 'strict',
      allowSiblingInteraction: false,
      parentVisibilityLevel: child.visibilityLevel as
        | 'full'
        | 'summaries_only'
        | 'safety_only',
    };
  }

  /**
   * Check if a data access request is allowed
   */
  static async isDataAccessAllowed(request: DataAccessRequest): Promise<{
    allowed: boolean;
    reason?: string;
    filteredAccess?: boolean; // If true, return filtered/sanitized data
  }> {
    // Verify parent owns target child
    const child = await prisma.childAccount.findFirst({
      where: {
        id: request.targetChildId,
        parentClerkUserId: request.requestingParentId,
      },
    });

    if (!child) {
      return {
        allowed: false,
        reason: 'Child not found or not owned by requesting parent',
      };
    }

    const privacySettings = await this.getChildPrivacySettings(
      request.targetChildId
    );

    // Parent access logic
    if (!request.requestingChildId) {
      return this.evaluateParentAccess(request, privacySettings);
    }

    // Sibling access logic
    return this.evaluateSiblingAccess(request, privacySettings);
  }

  /**
   * Evaluate parent access to child data
   */
  private static evaluateParentAccess(
    request: DataAccessRequest,
    privacySettings: ChildPrivacySettings
  ): { allowed: boolean; reason?: string; filteredAccess?: boolean } {
    const categoryPrivacy = this.getCategoryPrivacy(
      request.dataCategory,
      privacySettings
    );

    // Parents always have some level of access, but it may be filtered
    switch (categoryPrivacy) {
      case 'strict':
        return {
          allowed: true,
          filteredAccess: true,
          reason: 'Access granted with privacy filtering applied',
        };
      case 'parent_only':
      case 'family_shared':
        return { allowed: true };
      default:
        return { allowed: false, reason: 'Unknown privacy level' };
    }
  }

  /**
   * Evaluate sibling access to child data
   */
  private static evaluateSiblingAccess(
    request: DataAccessRequest,
    privacySettings: ChildPrivacySettings
  ): { allowed: boolean; reason?: string; filteredAccess?: boolean } {
    // Verify requesting child is a sibling
    if (!request.requestingChildId) {
      return { allowed: false, reason: 'No requesting child specified' };
    }

    // Check if sibling interaction is allowed
    if (!privacySettings.allowSiblingInteraction) {
      return {
        allowed: false,
        reason: 'Sibling interaction disabled for this child',
      };
    }

    const categoryPrivacy = this.getCategoryPrivacy(
      request.dataCategory,
      privacySettings
    );

    switch (categoryPrivacy) {
      case 'family_shared':
        return {
          allowed: true,
          filteredAccess: true,
          reason: 'Family shared data with safety filtering',
        };
      case 'strict':
      case 'parent_only':
        return {
          allowed: false,
          reason: 'Data not accessible to siblings',
        };
      default:
        return { allowed: false, reason: 'Unknown privacy level' };
    }
  }

  /**
   * Get privacy level for a specific data category
   */
  private static getCategoryPrivacy(
    category: DataCategory,
    settings: ChildPrivacySettings
  ): PrivacyLevel {
    switch (category) {
      case 'conversations':
        return settings.conversationPrivacy;
      case 'safety_events':
        return settings.safetyEventPrivacy;
      case 'usage_analytics':
        return settings.usageAnalyticsPrivacy;
      case 'memories':
        return settings.memoryPrivacy;
      case 'preferences':
        return settings.preferencesPrivacy;
      default:
        return 'strict';
    }
  }

  /**
   * Filter data based on privacy settings and request context
   */
  static async filterDataForAccess<T>(
    data: T[],
    request: DataAccessRequest,
    filteringRules: (item: T, isFiltered: boolean) => T | null
  ): Promise<T[]> {
    const accessResult = await this.isDataAccessAllowed(request);

    if (!accessResult.allowed) {
      return [];
    }

    return data
      .map(item => filteringRules(item, accessResult.filteredAccess || false))
      .filter((item): item is T => item !== null);
  }

  /**
   * Log privacy access for audit trail
   */
  static async logPrivacyAccess(
    request: DataAccessRequest,
    accessGranted: boolean,
    filteredAccess: boolean = false
  ): Promise<void> {
    try {
      // In production, this would log to a proper audit table
      console.log('Privacy Access Log:', {
        timestamp: new Date().toISOString(),
        requestingParent: request.requestingParentId,
        requestingChild: request.requestingChildId,
        targetChild: request.targetChildId,
        dataCategory: request.dataCategory,
        operation: request.operation,
        accessGranted,
        filteredAccess,
      });
    } catch (error) {
      console.error('Failed to log privacy access:', error);
    }
  }

  /**
   * Get family data with proper isolation applied
   */
  static async getFamilyDataWithIsolation(
    parentClerkUserId: string,
    options: {
      includeChildren?: string[]; // Specific children to include
      dataCategories?: DataCategory[];
      respectChildPrivacy?: boolean;
    } = {}
  ) {
    const {
      includeChildren,
      dataCategories = ['conversations', 'safety_events', 'usage_analytics'],
      respectChildPrivacy = true,
    } = options;

    // Get all children for this parent
    let children = await prisma.childAccount.findMany({
      where: { parentClerkUserId },
      select: {
        id: true,
        name: true,
        age: true,
        visibilityLevel: true,
      },
    });

    // Filter to specific children if requested
    if (includeChildren) {
      children = children.filter(child => includeChildren.includes(child.id));
    }

    const familyData: Record<string, any> = {};

    for (const child of children) {
      const childData: Record<string, any> = {
        childInfo: {
          id: child.id,
          name: child.name,
          age: child.age,
        },
      };

      // Get data for each requested category
      for (const category of dataCategories) {
        try {
          const accessRequest: DataAccessRequest = {
            requestingParentId: parentClerkUserId,
            targetChildId: child.id,
            dataCategory: category,
            operation: 'read',
          };

          const categoryData = await this.getCategoryData(
            child.id,
            category,
            accessRequest,
            respectChildPrivacy
          );

          childData[category] = categoryData;
        } catch (error) {
          console.error(
            `Error getting ${category} data for child ${child.id}:`,
            error
          );
          childData[category] = null;
        }
      }

      familyData[child.id] = childData;
    }

    return familyData;
  }

  /**
   * Get data for a specific category with privacy filtering
   */
  private static async getCategoryData(
    childId: string,
    category: DataCategory,
    accessRequest: DataAccessRequest,
    respectPrivacy: boolean
  ) {
    if (!respectPrivacy) {
      // Admin/debug mode - return raw data
      return await this.getRawCategoryData(childId, category);
    }

    const accessResult = await this.isDataAccessAllowed(accessRequest);

    if (!accessResult.allowed) {
      return null;
    }

    const rawData = await this.getRawCategoryData(childId, category);

    if (accessResult.filteredAccess) {
      return this.applyCategoryFiltering(rawData, category);
    }

    return rawData;
  }

  /**
   * Get raw data for a category without privacy filtering
   */
  private static async getRawCategoryData(
    childId: string,
    category: DataCategory
  ) {
    switch (category) {
      case 'conversations':
        return await prisma.conversation.findMany({
          where: { childAccountId: childId },
          select: {
            id: true,
            startedAt: true,
            endedAt: true,
            messageCount: true,
            mood: true,
            topics: true,
            safetyLevel: true,
          },
          orderBy: { startedAt: 'desc' },
          take: 10,
        });

      case 'safety_events':
        return await prisma.safetyEvent.findMany({
          where: { childAccountId: childId },
          select: {
            id: true,
            eventType: true,
            severityLevel: true,
            detectedAt: true,
            status: true,
          },
          orderBy: { detectedAt: 'desc' },
          take: 10,
        });

      case 'usage_analytics':
        return await prisma.dailyUsage.findMany({
          where: { childAccountId: childId },
          select: {
            date: true,
            totalMinutes: true,
            sessionCount: true,
            messagesSent: true,
            topicsDiscussed: true,
            moodSummary: true,
            engagementScore: true,
          },
          orderBy: { date: 'desc' },
          take: 7,
        });

      case 'memories':
        return await prisma.childMemory.findMany({
          where: { childAccountId: childId },
          select: {
            id: true,
            memoryType: true,
            key: true,
            confidence: true,
            lastReferenced: true,
          },
          orderBy: { lastReferenced: 'desc' },
          take: 10,
        });

      default:
        return null;
    }
  }

  /**
   * Apply privacy filtering to category data
   */
  private static applyCategoryFiltering(data: any, category: DataCategory) {
    if (!data) return null;

    switch (category) {
      case 'conversations':
        return data.map((conv: any) => ({
          id: conv.id,
          date: conv.startedAt,
          duration: conv.endedAt
            ? Math.floor(
                (new Date(conv.endedAt).getTime() -
                  new Date(conv.startedAt).getTime()) /
                  60000
              )
            : null,
          messageCount: conv.messageCount,
          mood: conv.mood,
          topicCount: conv.topics?.length || 0,
          safetyLevel: conv.safetyLevel,
        }));

      case 'safety_events':
        return data.map((event: any) => ({
          id: event.id,
          type: event.eventType,
          severity: event.severityLevel,
          date: event.detectedAt,
          resolved: event.status === 'resolved',
        }));

      case 'usage_analytics':
        // Usage analytics can be shared with minimal filtering
        return data;

      case 'memories':
        return data.map((memory: any) => ({
          id: memory.id,
          type: memory.memoryType,
          topic: memory.key,
          confidence: memory.confidence,
          lastUsed: memory.lastReferenced,
        }));

      default:
        return data;
    }
  }
}
