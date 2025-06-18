import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PrivacyIsolationService,
  DataAccessRequest,
} from '@/lib/multi-child/privacy-isolation';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    childAccount: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    conversation: {
      findMany: vi.fn(),
    },
    safetyEvent: {
      findMany: vi.fn(),
    },
    dailyUsage: {
      findMany: vi.fn(),
    },
    childMemory: {
      findMany: vi.fn(),
    },
  },
}));

const { prisma } = await import('@/lib/prisma');

describe('PrivacyIsolationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getChildPrivacySettings', () => {
    it('should return default privacy settings for existing child', async () => {
      // Mock child data
      (prisma.childAccount.findUnique as any).mockResolvedValue({
        id: 'child1',
        parentClerkUserId: 'parent1',
        visibilityLevel: 'full',
      });

      const settings =
        await PrivacyIsolationService.getChildPrivacySettings('child1');

      expect(settings).toEqual({
        childAccountId: 'child1',
        conversationPrivacy: 'strict',
        safetyEventPrivacy: 'parent_only',
        usageAnalyticsPrivacy: 'family_shared',
        memoryPrivacy: 'strict',
        preferencesPrivacy: 'strict',
        allowSiblingInteraction: false,
        parentVisibilityLevel: 'full',
      });
    });

    it('should throw error for non-existent child', async () => {
      (prisma.childAccount.findUnique as any).mockResolvedValue(null);

      await expect(
        PrivacyIsolationService.getChildPrivacySettings('nonexistent')
      ).rejects.toThrow('Child account not found');
    });
  });

  describe('isDataAccessAllowed', () => {
    const mockChild = {
      id: 'child1',
      parentClerkUserId: 'parent1',
      visibilityLevel: 'full',
    };

    beforeEach(() => {
      (prisma.childAccount.findFirst as any).mockResolvedValue(mockChild);
      (prisma.childAccount.findUnique as any).mockResolvedValue(mockChild);
    });

    it('should allow parent access to child data', async () => {
      const request: DataAccessRequest = {
        requestingParentId: 'parent1',
        targetChildId: 'child1',
        dataCategory: 'conversations',
        operation: 'read',
      };

      const result = await PrivacyIsolationService.isDataAccessAllowed(request);

      expect(result.allowed).toBe(true);
      expect(result.filteredAccess).toBe(true);
    });

    it('should reject access for non-owned child', async () => {
      (prisma.childAccount.findFirst as any).mockResolvedValue(null);

      const request: DataAccessRequest = {
        requestingParentId: 'parent1',
        targetChildId: 'child2',
        dataCategory: 'conversations',
        operation: 'read',
      };

      const result = await PrivacyIsolationService.isDataAccessAllowed(request);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not owned by requesting parent');
    });

    it('should reject sibling access when interaction disabled', async () => {
      const request: DataAccessRequest = {
        requestingParentId: 'parent1',
        requestingChildId: 'child2',
        targetChildId: 'child1',
        dataCategory: 'conversations',
        operation: 'read',
      };

      const result = await PrivacyIsolationService.isDataAccessAllowed(request);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Sibling interaction disabled');
    });

    it('should allow family_shared data for siblings with interaction enabled', async () => {
      // Mock privacy settings with sibling interaction enabled
      vi.spyOn(
        PrivacyIsolationService,
        'getChildPrivacySettings'
      ).mockResolvedValue({
        childAccountId: 'child1',
        conversationPrivacy: 'family_shared',
        safetyEventPrivacy: 'parent_only',
        usageAnalyticsPrivacy: 'family_shared',
        memoryPrivacy: 'strict',
        preferencesPrivacy: 'strict',
        allowSiblingInteraction: true,
        parentVisibilityLevel: 'full',
      });

      const request: DataAccessRequest = {
        requestingParentId: 'parent1',
        requestingChildId: 'child2',
        targetChildId: 'child1',
        dataCategory: 'usage_analytics',
        operation: 'read',
      };

      const result = await PrivacyIsolationService.isDataAccessAllowed(request);

      expect(result.allowed).toBe(true);
      expect(result.filteredAccess).toBe(true);
    });
  });

  describe('getFamilyDataWithIsolation', () => {
    beforeEach(() => {
      // Mock children
      (prisma.childAccount.findMany as any).mockResolvedValue([
        { id: 'child1', name: 'Alice', age: 8, visibilityLevel: 'full' },
        {
          id: 'child2',
          name: 'Bob',
          age: 10,
          visibilityLevel: 'summaries_only',
        },
      ]);

      // Mock conversation data
      (prisma.conversation.findMany as any).mockResolvedValue([
        {
          id: 'conv1',
          startedAt: new Date(),
          endedAt: new Date(),
          messageCount: 5,
          mood: 'happy',
          topics: ['gaming', 'school'],
          safetyLevel: 0,
        },
      ]);

      // Mock safety events
      (prisma.safetyEvent.findMany as any).mockResolvedValue([
        {
          id: 'safety1',
          eventType: 'inappropriate_language',
          severityLevel: 1,
          detectedAt: new Date(),
          status: 'resolved',
        },
      ]);

      // Mock daily usage
      (prisma.dailyUsage.findMany as any).mockResolvedValue([
        {
          date: new Date(),
          totalMinutes: 30,
          sessionCount: 2,
          messagesSent: 10,
          topicsDiscussed: ['gaming'],
          moodSummary: 'positive',
          engagementScore: 0.8,
        },
      ]);
    });

    it('should return family data with privacy isolation applied', async () => {
      const familyData =
        await PrivacyIsolationService.getFamilyDataWithIsolation('parent1', {
          dataCategories: ['conversations', 'safety_events', 'usage_analytics'],
          respectChildPrivacy: true,
        });

      expect(familyData).toHaveProperty('child1');
      expect(familyData).toHaveProperty('child2');
      expect(familyData.child1).toHaveProperty('childInfo');
      expect(familyData.child1).toHaveProperty('conversations');
      expect(familyData.child1).toHaveProperty('safety_events');
      expect(familyData.child1).toHaveProperty('usage_analytics');
    });

    it('should filter children when includeChildren is specified', async () => {
      const familyData =
        await PrivacyIsolationService.getFamilyDataWithIsolation('parent1', {
          includeChildren: ['child1'],
          respectChildPrivacy: true,
        });

      expect(familyData).toHaveProperty('child1');
      expect(familyData).not.toHaveProperty('child2');
    });

    it('should return raw data when privacy is not respected', async () => {
      const familyData =
        await PrivacyIsolationService.getFamilyDataWithIsolation('parent1', {
          respectChildPrivacy: false,
        });

      expect(familyData).toHaveProperty('child1');
      expect(familyData).toHaveProperty('child2');
    });
  });

  describe('filterDataForAccess', () => {
    it('should filter data based on access permissions', async () => {
      const mockData = [
        { id: 1, content: 'test1' },
        { id: 2, content: 'test2' },
      ];

      const request: DataAccessRequest = {
        requestingParentId: 'parent1',
        targetChildId: 'child1',
        dataCategory: 'conversations',
        operation: 'read',
      };

      // Mock access allowed
      vi.spyOn(
        PrivacyIsolationService,
        'isDataAccessAllowed'
      ).mockResolvedValue({
        allowed: true,
        filteredAccess: true,
      });

      const filteringRules = (item: any, isFiltered: boolean) => {
        if (isFiltered) {
          return { id: item.id, content: '[FILTERED]' };
        }
        return item;
      };

      const filteredData = await PrivacyIsolationService.filterDataForAccess(
        mockData,
        request,
        filteringRules
      );

      expect(filteredData).toHaveLength(2);
      expect(filteredData[0]).toEqual({ id: 1, content: '[FILTERED]' });
      expect(filteredData[1]).toEqual({ id: 2, content: '[FILTERED]' });
    });

    it('should return empty array when access is denied', async () => {
      const mockData = [{ id: 1, content: 'test1' }];

      const request: DataAccessRequest = {
        requestingParentId: 'parent1',
        targetChildId: 'child1',
        dataCategory: 'conversations',
        operation: 'read',
      };

      // Mock access denied
      vi.spyOn(
        PrivacyIsolationService,
        'isDataAccessAllowed'
      ).mockResolvedValue({
        allowed: false,
        reason: 'Access denied',
      });

      const filteringRules = (item: any) => item;

      const filteredData = await PrivacyIsolationService.filterDataForAccess(
        mockData,
        request,
        filteringRules
      );

      expect(filteredData).toHaveLength(0);
    });
  });

  describe('logPrivacyAccess', () => {
    it('should log privacy access without throwing', async () => {
      const request: DataAccessRequest = {
        requestingParentId: 'parent1',
        targetChildId: 'child1',
        dataCategory: 'conversations',
        operation: 'read',
      };

      // Should not throw
      await expect(
        PrivacyIsolationService.logPrivacyAccess(request, true, false)
      ).resolves.toBeUndefined();
    });
  });
});
