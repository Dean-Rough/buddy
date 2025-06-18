import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SiblingInteractionManager } from '@/lib/multi-child/sibling-interaction';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    childAccount: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    conversation: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/multi-child/privacy-isolation', () => ({
  PrivacyIsolationService: {
    getChildPrivacySettings: vi.fn(),
  },
}));

const { prisma } = await import('@/lib/prisma');
const { PrivacyIsolationService } = await import(
  '@/lib/multi-child/privacy-isolation'
);

describe('SiblingInteractionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('detectSiblingInteraction', () => {
    const mockChild = {
      id: 'child1',
      name: 'Alice',
      age: 8,
      parentClerkUserId: 'parent1',
    };

    const mockSiblings = [
      { id: 'child2', name: 'Bob', age: 10 },
      { id: 'child3', name: 'Carol', age: 12 },
    ];

    beforeEach(() => {
      (prisma.childAccount.findUnique as any).mockResolvedValue(mockChild);
      (prisma.childAccount.findMany as any).mockResolvedValue(mockSiblings);

      // Mock the updateFamilyDynamics method to avoid database calls
      vi.spyOn(
        SiblingInteractionManager,
        'updateFamilyDynamics'
      ).mockResolvedValue({
        parentClerkUserId: 'parent1',
        totalChildren: 2,
        activeChildren: 2,
        commonInterests: ['minecraft', 'school'],
        sharedActivities: [],
        familyEngagementScore: 0.8,
        siblingCompatibilityMatrix: {},
        lastUpdated: new Date(),
      });
    });

    it('should detect direct sibling mention', async () => {
      const conversationContent = 'Bob is really good at minecraft';
      const topics = ['gaming', 'minecraft'];
      const contextMetadata = {
        messageCount: 5,
        mood: 'happy',
        timeOfDay: 'afternoon',
      };

      const interaction =
        await SiblingInteractionManager.detectSiblingInteraction(
          'child1',
          conversationContent,
          topics,
          contextMetadata
        );

      expect(interaction).toBeTruthy();
      expect(interaction?.interactionType).toBe('sibling_mention');
      expect(interaction?.childAccountIds).toContain('child1');
      expect(interaction?.childAccountIds).toContain('child2');
      expect(interaction?.familyBenefit).toBeGreaterThan(0.5);
    });

    it('should detect family activity mentions', async () => {
      const conversationContent = 'We had a family movie night yesterday';
      const topics = ['family', 'entertainment'];
      const contextMetadata = {
        messageCount: 3,
        mood: 'content',
        timeOfDay: 'evening',
      };

      const interaction =
        await SiblingInteractionManager.detectSiblingInteraction(
          'child1',
          conversationContent,
          topics,
          contextMetadata
        );

      expect(interaction).toBeTruthy();
      expect(interaction?.interactionType).toBe('family_activity_mention');
      expect(interaction?.familyBenefit).toBeGreaterThan(0.7);
      expect(interaction?.privacyRisk).toBeLessThan(0.3);
    });

    it('should detect shared topic discussions', async () => {
      const conversationContent = 'I love playing minecraft';
      const topics = ['minecraft', 'gaming'];
      const contextMetadata = {
        messageCount: 2,
        mood: 'excited',
        timeOfDay: 'afternoon',
      };

      const interaction =
        await SiblingInteractionManager.detectSiblingInteraction(
          'child1',
          conversationContent,
          topics,
          contextMetadata
        );

      expect(interaction).toBeTruthy();
      expect(interaction?.interactionType).toBe('shared_topic_discussion');
      expect(interaction?.childAccountIds.length).toBeGreaterThan(1);
    });

    it('should detect comparative behavior patterns', async () => {
      const conversationContent = 'Bob is better than me at football';
      const topics = ['sports', 'football'];
      const contextMetadata = {
        messageCount: 4,
        mood: 'frustrated',
        timeOfDay: 'afternoon',
      };

      const interaction =
        await SiblingInteractionManager.detectSiblingInteraction(
          'child1',
          conversationContent,
          topics,
          contextMetadata
        );

      expect(interaction).toBeTruthy();
      expect(interaction?.interactionType).toBe('comparative_behavior');
      expect(interaction?.safetyLevel).toBe('monitored');
      expect(interaction?.privacyRisk).toBeGreaterThan(0.5);
    });

    it('should flag negative comparisons for monitoring', async () => {
      const conversationContent = 'My sister is so annoying and stupid';
      const topics = ['family'];
      const contextMetadata = {
        messageCount: 1,
        mood: 'angry',
        timeOfDay: 'morning',
      };

      const interaction =
        await SiblingInteractionManager.detectSiblingInteraction(
          'child1',
          conversationContent,
          topics,
          contextMetadata
        );

      expect(interaction).toBeTruthy();
      expect(interaction?.safetyLevel).toBe('monitored');
      expect(interaction?.familyBenefit).toBeLessThan(0.3);
      expect(interaction?.privacyRisk).toBeGreaterThan(0.7);
    });

    it('should return null when no siblings exist', async () => {
      (prisma.childAccount.findMany as any).mockResolvedValue([]);

      const interaction =
        await SiblingInteractionManager.detectSiblingInteraction(
          'child1',
          'I love minecraft',
          ['gaming'],
          { messageCount: 1, timeOfDay: 'afternoon' }
        );

      expect(interaction).toBeNull();
    });

    it('should return null when no interaction patterns detected', async () => {
      const conversationContent = 'The weather is nice today';
      const topics = ['weather'];
      const contextMetadata = {
        messageCount: 1,
        timeOfDay: 'morning',
      };

      const interaction =
        await SiblingInteractionManager.detectSiblingInteraction(
          'child1',
          conversationContent,
          topics,
          contextMetadata
        );

      expect(interaction).toBeNull();
    });
  });

  describe('updateFamilyDynamics', () => {
    beforeEach(() => {
      // Mock children
      (prisma.childAccount.findMany as any).mockResolvedValue([
        { id: 'child1', name: 'Alice', age: 8, accountStatus: 'active' },
        { id: 'child2', name: 'Bob', age: 10, accountStatus: 'active' },
      ]);

      // Mock recent conversations
      (prisma.conversation.findMany as any).mockResolvedValue([
        {
          childAccountId: 'child1',
          topics: ['minecraft', 'school'],
          mood: 'happy',
        },
        {
          childAccountId: 'child2',
          topics: ['minecraft', 'football'],
          mood: 'excited',
        },
        {
          childAccountId: 'child1',
          topics: ['homework', 'school'],
          mood: 'neutral',
        },
      ]);
    });

    it('should update family dynamics with correct metrics', async () => {
      const dynamics =
        await SiblingInteractionManager.updateFamilyDynamics('parent1');

      expect(dynamics.parentClerkUserId).toBe('parent1');
      expect(dynamics.totalChildren).toBe(2);
      expect(dynamics.activeChildren).toBe(2);
      expect(dynamics.commonInterests).toContain('minecraft');
      expect(dynamics.commonInterests).toContain('school');
      expect(dynamics.familyEngagementScore).toBeGreaterThan(0);
      expect(dynamics.siblingCompatibilityMatrix).toHaveProperty('child1');
      expect(dynamics.siblingCompatibilityMatrix).toHaveProperty('child2');
    });

    it('should calculate sibling compatibility scores', async () => {
      const dynamics =
        await SiblingInteractionManager.updateFamilyDynamics('parent1');

      const child1ToChild2Compatibility =
        dynamics.siblingCompatibilityMatrix['child1']['child2'];
      const child2ToChild1Compatibility =
        dynamics.siblingCompatibilityMatrix['child2']['child1'];

      expect(child1ToChild2Compatibility).toBeGreaterThan(0);
      expect(child2ToChild1Compatibility).toBeGreaterThan(0);
      expect(child1ToChild2Compatibility).toBeLessThanOrEqual(1);
      expect(child2ToChild1Compatibility).toBeLessThanOrEqual(1);
    });
  });

  describe('getFamilyInteractionInsights', () => {
    beforeEach(() => {
      // Mock successful dynamics update
      vi.spyOn(
        SiblingInteractionManager,
        'updateFamilyDynamics'
      ).mockResolvedValue({
        parentClerkUserId: 'parent1',
        totalChildren: 2,
        activeChildren: 2,
        commonInterests: ['minecraft', 'school', 'football'],
        sharedActivities: [],
        familyEngagementScore: 0.8,
        siblingCompatibilityMatrix: {
          child1: { child2: 0.7 },
          child2: { child1: 0.7 },
        },
        lastUpdated: new Date(),
      });

      // Mock children data
      (prisma.childAccount.findMany as any).mockResolvedValue([
        { id: 'child1', name: 'Alice' },
        { id: 'child2', name: 'Bob' },
      ]);
    });

    it('should generate family interaction insights', async () => {
      const insights =
        await SiblingInteractionManager.getFamilyInteractionInsights(
          'parent1',
          7
        );

      expect(insights.totalInteractions).toBeGreaterThanOrEqual(0);
      expect(insights.interactionTypes).toHaveProperty(
        'shared_topic_discussion'
      );
      expect(insights.interactionTypes).toHaveProperty(
        'family_activity_mention'
      );
      expect(insights.familyBenefitScore).toBeGreaterThan(0);
      expect(insights.privacyRiskScore).toBeLessThan(1);
      expect(insights.recommendations).toBeInstanceOf(Array);
      expect(insights.siblingPairs).toBeInstanceOf(Array);
    });

    it('should include recommendations for low engagement families', async () => {
      // Mock low engagement
      vi.spyOn(
        SiblingInteractionManager,
        'updateFamilyDynamics'
      ).mockResolvedValue({
        parentClerkUserId: 'parent1',
        totalChildren: 2,
        activeChildren: 1,
        commonInterests: [],
        sharedActivities: [],
        familyEngagementScore: 0.2, // Low engagement
        siblingCompatibilityMatrix: {},
        lastUpdated: new Date(),
      });

      const insights =
        await SiblingInteractionManager.getFamilyInteractionInsights(
          'parent1',
          7
        );

      expect(insights.recommendations).toContain(
        'Consider encouraging more shared family activities'
      );
    });

    it('should highlight shared interests', async () => {
      const insights =
        await SiblingInteractionManager.getFamilyInteractionInsights(
          'parent1',
          7
        );

      expect(
        insights.recommendations.some(rec => rec.includes('share interests in'))
      ).toBe(true);
    });
  });

  describe('isSiblingInteractionAllowed', () => {
    beforeEach(() => {
      (
        PrivacyIsolationService.getChildPrivacySettings as any
      ).mockResolvedValue({
        allowSiblingInteraction: true,
      });
    });

    it('should return true when both children allow sibling interaction', async () => {
      const allowed =
        await SiblingInteractionManager.isSiblingInteractionAllowed(
          'child1',
          'child2'
        );

      expect(allowed).toBe(true);
    });

    it('should return false when one child disallows sibling interaction', async () => {
      (PrivacyIsolationService.getChildPrivacySettings as any)
        .mockResolvedValueOnce({ allowSiblingInteraction: true })
        .mockResolvedValueOnce({ allowSiblingInteraction: false });

      const allowed =
        await SiblingInteractionManager.isSiblingInteractionAllowed(
          'child1',
          'child2'
        );

      expect(allowed).toBe(false);
    });
  });

  describe('getSanitizedSiblingInfo', () => {
    beforeEach(() => {
      // Mock requesting child
      (prisma.childAccount.findUnique as any)
        .mockResolvedValueOnce({ parentClerkUserId: 'parent1' })
        .mockResolvedValueOnce({
          parentClerkUserId: 'parent1',
          name: 'Bob',
          age: 10,
        });

      // Mock sibling interaction allowed
      vi.spyOn(
        SiblingInteractionManager,
        'isSiblingInteractionAllowed'
      ).mockResolvedValue(true);

      // Mock family dynamics
      vi.spyOn(
        SiblingInteractionManager,
        'updateFamilyDynamics'
      ).mockResolvedValue({
        parentClerkUserId: 'parent1',
        totalChildren: 2,
        activeChildren: 2,
        commonInterests: ['minecraft', 'school'],
        sharedActivities: [],
        familyEngagementScore: 0.8,
        siblingCompatibilityMatrix: {},
        lastUpdated: new Date(),
      });
    });

    it('should return sanitized sibling information when interaction is allowed', async () => {
      const siblingInfo =
        await SiblingInteractionManager.getSanitizedSiblingInfo(
          'child1',
          'child2'
        );

      expect(siblingInfo).toBeTruthy();
      expect(siblingInfo?.name).toBe('Bob');
      expect(siblingInfo?.age).toBe(10);
      expect(siblingInfo?.sharedInterests).toContain('minecraft');
      expect(siblingInfo?.sharedInterests).toContain('school');
      expect(siblingInfo?.canInteract).toBe(true);
    });

    it('should return null when children are not siblings', async () => {
      // Mock different parents - need to clear previous mocks first
      vi.clearAllMocks();
      (prisma.childAccount.findUnique as any)
        .mockResolvedValueOnce({ parentClerkUserId: 'parent1' })
        .mockResolvedValueOnce({
          parentClerkUserId: 'parent2', // Different parent
          name: 'Bob',
          age: 10,
        });

      const siblingInfo =
        await SiblingInteractionManager.getSanitizedSiblingInfo(
          'child1',
          'child2'
        );

      expect(siblingInfo).toBeNull();
    });

    it('should return null when sibling interaction is not allowed', async () => {
      vi.spyOn(
        SiblingInteractionManager,
        'isSiblingInteractionAllowed'
      ).mockResolvedValue(false);

      const siblingInfo =
        await SiblingInteractionManager.getSanitizedSiblingInfo(
          'child1',
          'child2'
        );

      expect(siblingInfo).toBeNull();
    });
  });
});
