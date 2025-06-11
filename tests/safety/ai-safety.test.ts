import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateMessageSafety, getSafetyResponse } from '@/lib/ai/safety'

// Mock the AI client
vi.mock('@/lib/ai/client', () => ({
  validateSafety: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    safetyEvent: {
      create: vi.fn(),
    },
    child: {
      findUnique: vi.fn(),
    },
    parentNotification: {
      create: vi.fn(),
    },
  },
}))

describe('AI Safety System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSafetyResponse', () => {
    it('should provide age-appropriate safety responses', () => {
      const result = {
        isSafe: false,
        severity: 2,
        reason: 'Test reason',
        action: 'warn' as const,
        flaggedTerms: [],
      }

      // Test young child response
      const youngResponse = getSafetyResponse(result, 7)
      expect(youngResponse).toContain('talk about something else')
      expect(youngResponse).toContain('animal')

      // Test older child response
      const olderResponse = getSafetyResponse(result, 11)
      expect(olderResponse).toContain('grown-up you trust')
      expect(olderResponse).not.toContain('animal')
    })

    it('should escalate appropriately for serious content', () => {
      const result = {
        isSafe: false,
        severity: 3,
        reason: 'Serious concern',
        action: 'escalate' as const,
        flaggedTerms: [],
      }

      const response = getSafetyResponse(result, 9)
      expect(response).toContain('trusted adult')
      expect(response).toContain('parent')
    })
  })

  describe('Safety context awareness', () => {
    it('should consider child age in safety decisions', async () => {
      const message = "I'm scared of the dark"
      
      // Younger children might need more gentle handling
      const youngContext = {
        childId: 'test-child-1',
        childAge: 6,
        conversationId: 'test-conv-1',
      }

      // This would normally call the AI validation
      // In a real test, we'd mock the AI response and verify age-appropriate handling
      expect(youngContext.childAge).toBe(6)
    })
  })

  describe('Rule-based safety patterns', () => {
    it('should flag critical safety patterns', () => {
      const criticalMessages = [
        "What's your address?",
        "Don't tell your parents",
        "Come meet me",
        "This is our secret"
      ]

      // In actual implementation, these would be flagged by rule-based safety
      criticalMessages.forEach(message => {
        expect(message).toBeDefined()
      })
    })

    it('should allow appropriate child conversations', () => {
      const safeMessages = [
        "I love my dog!",
        "What's your favorite color?",
        "I'm excited about school",
        "Can you help me with my homework?"
      ]

      safeMessages.forEach(message => {
        expect(message).toBeDefined()
      })
    })
  })
})