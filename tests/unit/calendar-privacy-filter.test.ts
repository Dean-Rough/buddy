/**
 * Calendar Privacy Filter Test Suite
 * Tests for COPPA-compliant privacy filtering
 */

import { describe, it, expect } from 'vitest';
import { CalendarPrivacyFilter } from '../../lib/calendar/privacy-filter';
import type {
  CalendarEvent,
  PrivacyFilterRule,
} from '../../lib/calendar/types';

describe('Calendar Privacy Filter', () => {
  const mockParentUserId = 'parent_123';

  const createMockEvent = (
    title: string,
    provider: 'google' | 'outlook' | 'apple' = 'google'
  ): CalendarEvent => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now

    return {
      id: `event_${Math.random()}`,
      calendarCredentialsId: 'cred_123',
      externalEventId: 'external_123',
      provider,
      title,
      startDate: futureDate,
      endDate: new Date(futureDate.getTime() + 6 * 60 * 60 * 1000), // 6 hours later
      isAllDay: false,
      isChildRelevant: false, // Will be determined by filter
      privacyLevel: 'private',
      originalTitle: title,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncAt: new Date(),
    };
  };

  const filterOptions = {
    childAge: 8,
    parentClerkUserId: mockParentUserId,
    allowLocationSharing: true,
    eventLookaheadDays: 7,
  };

  describe('Child-Friendly Event Detection', () => {
    it('should identify family-friendly events', () => {
      const familyEvents = [
        createMockEvent('Family Beach Trip'),
        createMockEvent('Kids Birthday Party'),
        createMockEvent('Zoo Visit with Children'),
        createMockEvent('Playground Time'),
      ];

      const filteredEvents = CalendarPrivacyFilter.filterEventsForChild(
        familyEvents,
        filterOptions
      );

      // Debug: Log the results to understand what's happening
      console.log('Family events filtered:', filteredEvents.length);
      familyEvents.forEach((event, i) => {
        const result = filteredEvents.find(e => e.id === event.id);
        console.log(
          `Event ${i}: "${event.title}" -> ${result ? 'included' : 'excluded'}`
        );
        if (result) {
          console.log(
            `  - isChildRelevant: ${result.isChildRelevant}, privacyLevel: ${result.privacyLevel}`
          );
        }
      });

      expect(filteredEvents.length).toBeGreaterThan(0);
      filteredEvents.forEach(event => {
        expect(event.isChildRelevant).toBe(true);
        expect(['family', 'public'].includes(event.privacyLevel)).toBe(true);
      });
    });

    it('should filter out sensitive events', () => {
      const sensitiveEvents = [
        createMockEvent('Doctor Appointment'),
        createMockEvent('Bank Meeting'),
        createMockEvent('Legal Consultation'),
        createMockEvent('Work Conference Call'),
      ];

      const filteredEvents = CalendarPrivacyFilter.filterEventsForChild(
        sensitiveEvents,
        filterOptions
      );

      // Sensitive events should be filtered out
      expect(filteredEvents.length).toBe(0);
    });

    it('should handle neutral events appropriately', () => {
      const neutralEvents = [
        createMockEvent('Lunch Plans'),
        createMockEvent('Grocery Shopping'),
        createMockEvent('Car Maintenance'),
      ];

      const filteredEvents = CalendarPrivacyFilter.filterEventsForChild(
        neutralEvents,
        filterOptions
      );

      // Neutral events may be included with generic titles
      filteredEvents.forEach(event => {
        if (event.isChildRelevant) {
          expect(event.sanitizedTitle).toBeDefined();
          expect(['public', 'filtered'].includes(event.privacyLevel)).toBe(
            true
          );
        }
      });
    });
  });

  describe('Age-Appropriate Filtering', () => {
    it('should adapt content for younger children (6-8)', () => {
      const events = [
        createMockEvent('Magic Show Performance'),
        createMockEvent('Story Time at Library'),
        createMockEvent('Puppet Theater'),
      ];

      const youngChildOptions = { ...filterOptions, childAge: 6 };
      const filteredEvents = CalendarPrivacyFilter.filterEventsForChild(
        events,
        youngChildOptions
      );

      expect(filteredEvents.length).toBeGreaterThan(0);
      filteredEvents.forEach(event => {
        expect(event.isChildRelevant).toBe(true);
      });
    });

    it('should adapt content for older children (9-12)', () => {
      const events = [
        createMockEvent('Soccer Team Practice'),
        createMockEvent('Youth Group Meeting'),
        createMockEvent('Science Club Activity'),
      ];

      const olderChildOptions = { ...filterOptions, childAge: 11 };
      const filteredEvents = CalendarPrivacyFilter.filterEventsForChild(
        events,
        olderChildOptions
      );

      expect(filteredEvents.length).toBeGreaterThan(0);
      filteredEvents.forEach(event => {
        expect(event.isChildRelevant).toBe(true);
      });
    });
  });

  describe('Custom Filter Rules', () => {
    it('should apply keyword blocking rules', () => {
      const events = [createMockEvent('Beach Trip with Family')];

      const blockingRules: PrivacyFilterRule[] = [
        {
          id: 'rule_1',
          parentClerkUserId: mockParentUserId,
          ruleType: 'keyword_block',
          pattern: 'beach',
          isActive: true,
          createdAt: new Date(),
        },
      ];

      const filteredEvents = CalendarPrivacyFilter.filterEventsForChild(
        events,
        filterOptions,
        blockingRules
      );

      // Should be blocked by custom rule
      expect(filteredEvents.length).toBe(0);
    });

    it('should apply keyword allowing rules', () => {
      const events = [createMockEvent('Work Meeting Discussion')];

      const allowingRules: PrivacyFilterRule[] = [
        {
          id: 'rule_2',
          parentClerkUserId: mockParentUserId,
          ruleType: 'keyword_allow',
          pattern: 'work',
          isActive: true,
          createdAt: new Date(),
        },
      ];

      const filteredEvents = CalendarPrivacyFilter.filterEventsForChild(
        events,
        filterOptions,
        allowingRules
      );

      // Should be allowed by custom rule
      expect(filteredEvents.length).toBe(1);
      expect(filteredEvents[0].isChildRelevant).toBe(true);
      expect(filteredEvents[0].privacyLevel).toBe('family');
    });

    it('should respect inactive rules', () => {
      const events = [createMockEvent('Beach Trip')];

      const inactiveRules: PrivacyFilterRule[] = [
        {
          id: 'rule_3',
          parentClerkUserId: mockParentUserId,
          ruleType: 'keyword_block',
          pattern: 'beach',
          isActive: false, // Inactive rule
          createdAt: new Date(),
        },
      ];

      const filteredEvents = CalendarPrivacyFilter.filterEventsForChild(
        events,
        filterOptions,
        inactiveRules
      );

      // Should not be blocked by inactive rule
      expect(filteredEvents.length).toBe(1);
    });
  });

  describe('Privacy and Safety', () => {
    it('should remove location data when disabled', () => {
      const events = [
        {
          ...createMockEvent('Family Picnic'),
          location: 'Central Park',
        },
      ];

      const noLocationOptions = {
        ...filterOptions,
        allowLocationSharing: false,
      };
      const filteredEvents = CalendarPrivacyFilter.filterEventsForChild(
        events,
        noLocationOptions
      );

      filteredEvents.forEach(event => {
        expect(event.location).toBeUndefined();
      });
    });

    it('should sanitize sensitive location information', () => {
      const events = [
        {
          ...createMockEvent('Family Event'),
          location: 'Medical Clinic Building',
        },
      ];

      const filteredEvents = CalendarPrivacyFilter.filterEventsForChild(
        events,
        filterOptions
      );

      filteredEvents.forEach(event => {
        if (event.location) {
          expect(event.location).not.toContain('clinic');
        }
      });
    });

    it('should remove event descriptions for privacy', () => {
      const events = [
        {
          ...createMockEvent('Family Activity'),
          description: 'Fun family time with detailed information',
        },
      ];

      const filteredEvents = CalendarPrivacyFilter.filterEventsForChild(
        events,
        filterOptions
      );

      filteredEvents.forEach(event => {
        expect(event.description).toBeUndefined();
      });
    });
  });

  describe('Time Range Filtering', () => {
    it('should only include events within lookahead period', () => {
      const now = new Date();
      const futureEvent = createMockEvent('Future Family Event');
      futureEvent.startDate = new Date(
        now.getTime() + 10 * 24 * 60 * 60 * 1000
      ); // 10 days ahead

      const shortLookaheadOptions = { ...filterOptions, eventLookaheadDays: 7 }; // 7 days

      const filteredEvents = CalendarPrivacyFilter.filterEventsForChild(
        [futureEvent],
        shortLookaheadOptions
      );

      // Should be filtered out due to being beyond lookahead period
      expect(filteredEvents.length).toBe(0);
    });

    it('should include events within lookahead period', () => {
      const now = new Date();
      const nearEvent = createMockEvent('Near Family Event');
      nearEvent.startDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days ahead

      const filteredEvents = CalendarPrivacyFilter.filterEventsForChild(
        [nearEvent],
        filterOptions
      );

      // Should be included as it's within 7-day lookahead
      expect(filteredEvents.length).toBe(1);
    });
  });

  describe('COPPA Compliance Validation', () => {
    it('should validate compliant events', () => {
      const compliantEvents = [
        {
          ...createMockEvent('Family Beach Day'),
          sanitizedTitle: 'Family Beach Day',
          isChildRelevant: true,
          privacyLevel: 'family' as const,
        },
      ];

      const validation =
        CalendarPrivacyFilter.validateCOPPACompliance(compliantEvents);

      expect(validation.isCompliant).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });

    it('should detect PII in sanitized content', () => {
      const eventsWithPII = [
        {
          ...createMockEvent('Event Title'),
          sanitizedTitle: 'Meeting with john@example.com',
          isChildRelevant: true,
          privacyLevel: 'family' as const,
        },
      ];

      const validation =
        CalendarPrivacyFilter.validateCOPPACompliance(eventsWithPII);

      expect(validation.isCompliant).toBe(false);
      expect(validation.violations.length).toBeGreaterThan(0);
      expect(validation.violations[0]).toContain('PII');
    });

    it('should detect inconsistent privacy classifications', () => {
      const inconsistentEvents = [
        {
          ...createMockEvent('Event Title'),
          isChildRelevant: true, // Marked as relevant
          privacyLevel: 'private' as const, // But private level
        },
      ];

      const validation =
        CalendarPrivacyFilter.validateCOPPACompliance(inconsistentEvents);

      expect(validation.isCompliant).toBe(false);
      expect(validation.violations.length).toBeGreaterThan(0);
      expect(validation.violations[0]).toContain(
        'Inconsistent privacy classification'
      );
    });

    it('should detect sensitive location data', () => {
      const eventsWithSensitiveLocation = [
        {
          ...createMockEvent('Event Title'),
          location: 'Private Medical Clinic',
          isChildRelevant: true,
          privacyLevel: 'family' as const,
        },
      ];

      const validation = CalendarPrivacyFilter.validateCOPPACompliance(
        eventsWithSensitiveLocation
      );

      expect(validation.isCompliant).toBe(false);
      expect(validation.violations.length).toBeGreaterThan(0);
      expect(validation.violations[0]).toContain(
        'Location contains sensitive information'
      );
    });
  });

  describe('Title Sanitization', () => {
    it('should create generic titles for filtered events', () => {
      const events = [createMockEvent('Private Adult Meeting')];

      const filteredEvents = CalendarPrivacyFilter.filterEventsForChild(
        events,
        filterOptions
      );

      // Should either be filtered out or have generic title
      if (filteredEvents.length > 0) {
        filteredEvents.forEach(event => {
          expect(event.sanitizedTitle).toMatch(/Family|Activity|Event|Time/);
        });
      }
    });

    it('should preserve appropriate event titles', () => {
      const events = [createMockEvent('Family Zoo Visit')];

      const filteredEvents = CalendarPrivacyFilter.filterEventsForChild(
        events,
        filterOptions
      );

      expect(filteredEvents.length).toBe(1);
      expect(filteredEvents[0].sanitizedTitle).toBe('Family Zoo Visit');
    });
  });
});
