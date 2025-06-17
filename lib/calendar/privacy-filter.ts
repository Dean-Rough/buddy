/**
 * Calendar Privacy Filter
 * COPPA-compliant filtering for family calendar events
 * Ensures child-safe event information while maintaining utility
 */

import { CalendarEvent, PrivacyFilterRule } from './types';

interface PrivacyFilterOptions {
  childAge: number;
  parentClerkUserId: string;
  allowLocationSharing: boolean;
  eventLookaheadDays: number;
}

/**
 * Privacy filter for calendar events
 * Sanitizes event content for child safety and privacy compliance
 */
export class CalendarPrivacyFilter {
  // Sensitive keywords that should be filtered from child view
  private static SENSITIVE_KEYWORDS = [
    // Medical/health
    'doctor',
    'appointment',
    'medical',
    'therapy',
    'dentist',
    'hospital',
    'surgery',
    'checkup',
    'vaccination',
    'prescription',

    // Financial/legal
    'bank',
    'lawyer',
    'attorney',
    'legal',
    'court',
    'tax',
    'finance',
    'mortgage',
    'loan',
    'insurance',
    'budget',

    // Adult social/work
    'meeting',
    'conference',
    'interview',
    'presentation',
    'deadline',
    'client',
    'business',
    'work',
    'office',

    // Personal/private
    'private',
    'personal',
    'confidential',
    'date night',
    'anniversary',
    'counseling',
    'discussion',
    'review',

    // Location-sensitive
    'address',
    'home',
    'workplace',
    'clinic',
    'office building',
  ];

  // Child-friendly event categories
  private static CHILD_FRIENDLY_KEYWORDS = [
    // Family activities
    'family',
    'kids',
    'children',
    'playground',
    'park',
    'zoo',
    'museum',
    'library',
    'beach',
    'picnic',
    'vacation',
    'trip',

    // Educational/recreational
    'school',
    'class',
    'lesson',
    'practice',
    'game',
    'sport',
    'birthday',
    'party',
    'celebration',
    'holiday',
    'festival',

    // Entertainment
    'movie',
    'show',
    'concert',
    'play',
    'performance',
    'event',
    'fair',
    'carnival',
    'amusement',
    'adventure',
  ];

  /**
   * Filter calendar events for child safety and privacy
   */
  static filterEventsForChild(
    events: CalendarEvent[],
    options: PrivacyFilterOptions,
    customRules: PrivacyFilterRule[] = []
  ): CalendarEvent[] {
    const now = new Date();
    const lookaheadDate = new Date(
      now.getTime() + options.eventLookaheadDays * 24 * 60 * 60 * 1000
    );

    return events
      .filter(event => this.isEventInTimeRange(event, now, lookaheadDate))
      .map(event => this.sanitizeEventForChild(event, options, customRules))
      .filter(event => event.isChildRelevant);
  }

  /**
   * Check if event falls within allowed time range
   */
  private static isEventInTimeRange(
    event: CalendarEvent,
    startDate: Date,
    endDate: Date
  ): boolean {
    return event.startDate >= startDate && event.startDate <= endDate;
  }

  /**
   * Sanitize individual event for child consumption
   */
  private static sanitizeEventForChild(
    event: CalendarEvent,
    options: PrivacyFilterOptions,
    customRules: PrivacyFilterRule[]
  ): CalendarEvent {
    const sanitizedEvent = { ...event };

    // Apply custom parent rules first
    const customFiltered = this.applyCustomRules(sanitizedEvent, customRules);

    // If custom rules explicitly blocked this event, return it as blocked
    if (customFiltered.isChildRelevant === false) {
      return customFiltered;
    }

    // Determine if event is child-relevant
    const isChildFriendly = this.isChildFriendlyEvent(
      event.title,
      options.childAge
    );
    const hasSensitiveContent = this.hasSensitiveContent(event.title);

    // If custom rules explicitly allowed it, keep it allowed
    if (
      customFiltered.isChildRelevant === true &&
      customFiltered.privacyLevel === 'family'
    ) {
      sanitizedEvent.isChildRelevant = true;
      sanitizedEvent.privacyLevel = 'family';
      sanitizedEvent.sanitizedTitle = this.sanitizeEventTitle(
        event.title,
        options.childAge
      );
    }
    // Otherwise apply default filtering logic
    else if (hasSensitiveContent && !isChildFriendly) {
      sanitizedEvent.isChildRelevant = false;
      sanitizedEvent.privacyLevel = 'private';
      return sanitizedEvent;
    }
    // Event passes basic filtering
    else {
      sanitizedEvent.isChildRelevant = true;
      sanitizedEvent.sanitizedTitle = this.sanitizeEventTitle(
        event.title,
        options.childAge
      );

      // Determine privacy level
      if (isChildFriendly) {
        sanitizedEvent.privacyLevel = 'family';
      } else if (this.isNeutralEvent(event.title)) {
        sanitizedEvent.privacyLevel = 'public';
        sanitizedEvent.sanitizedTitle = this.generalizeEventTitle(event.title);
      } else {
        sanitizedEvent.privacyLevel = 'filtered';
        sanitizedEvent.sanitizedTitle = this.createGenericTitle(
          event.startDate
        );
      }
    }

    // Handle location privacy
    if (
      !options.allowLocationSharing ||
      this.hasLocationSensitivity(event.location || '')
    ) {
      sanitizedEvent.location = undefined;
    }

    // Remove description for privacy
    sanitizedEvent.description = undefined;

    return sanitizedEvent;
  }

  /**
   * Apply custom parent-defined filtering rules
   */
  private static applyCustomRules(
    event: CalendarEvent,
    rules: PrivacyFilterRule[]
  ): CalendarEvent {
    const result = { ...event };
    let hasAllowRule = false;

    for (const rule of rules.filter(r => r.isActive)) {
      const pattern = new RegExp(rule.pattern, 'i');

      switch (rule.ruleType) {
        case 'keyword_block':
          if (
            pattern.test(event.title) ||
            pattern.test(event.description || '')
          ) {
            result.isChildRelevant = false;
            result.privacyLevel = 'private';
            return result;
          }
          break;

        case 'keyword_allow':
          if (pattern.test(event.title)) {
            result.isChildRelevant = true;
            result.privacyLevel = 'family';
            hasAllowRule = true;
          }
          break;

        case 'time_filter':
          // Could implement time-based filtering here
          break;

        case 'location_filter':
          if (event.location && pattern.test(event.location)) {
            result.location = undefined;
          }
          break;
      }
    }

    // If no explicit allow rule was triggered, maintain original child relevance
    if (!hasAllowRule) {
      result.isChildRelevant = event.isChildRelevant;
    }

    return result;
  }

  /**
   * Check if event is explicitly child-friendly
   */
  private static isChildFriendlyEvent(
    title: string,
    childAge: number
  ): boolean {
    const lowerTitle = title.toLowerCase();

    // Check for child-friendly keywords
    const hasChildFriendlyKeywords = this.CHILD_FRIENDLY_KEYWORDS.some(
      keyword => lowerTitle.includes(keyword)
    );

    // Age-specific adjustments
    const ageSpecificKeywords = this.getAgeSpecificKeywords(childAge);
    const hasAgeAppropriate = ageSpecificKeywords.some(keyword =>
      lowerTitle.includes(keyword)
    );

    return hasChildFriendlyKeywords || hasAgeAppropriate;
  }

  /**
   * Check if event contains sensitive content
   */
  private static hasSensitiveContent(title: string): boolean {
    const lowerTitle = title.toLowerCase();
    return this.SENSITIVE_KEYWORDS.some(keyword =>
      lowerTitle.includes(keyword)
    );
  }

  /**
   * Check if event is neutral (neither sensitive nor explicitly child-friendly)
   */
  private static isNeutralEvent(title: string): boolean {
    return (
      !this.hasSensitiveContent(title) && !this.isChildFriendlyEvent(title, 10)
    );
  }

  /**
   * Check if location contains sensitive information
   */
  private static hasLocationSensitivity(location: string): boolean {
    const lowerLocation = location.toLowerCase();
    const sensitiveLocationKeywords = [
      'clinic',
      'hospital',
      'office',
      'work',
      'bank',
      'legal',
      'private',
      'confidential',
      'address',
      'home',
    ];

    return sensitiveLocationKeywords.some(keyword =>
      lowerLocation.includes(keyword)
    );
  }

  /**
   * Get age-appropriate keywords
   */
  private static getAgeSpecificKeywords(childAge: number): string[] {
    if (childAge <= 8) {
      return ['playground', 'story time', 'cartoon', 'toy', 'puppet', 'magic'];
    } else if (childAge <= 11) {
      return ['sport', 'team', 'club', 'lesson', 'camp', 'adventure'];
    } else {
      return ['youth', 'teen', 'group', 'activity', 'volunteer', 'project'];
    }
  }

  /**
   * Sanitize event title for child consumption
   */
  private static sanitizeEventTitle(title: string, childAge: number): string {
    // Remove potentially sensitive information
    let sanitized = title
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '') // Remove phone numbers
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '') // Remove emails
      .replace(
        /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd)\b/gi,
        ''
      ) // Remove addresses
      .trim();

    // Age-appropriate language adjustments
    if (childAge <= 8) {
      sanitized = sanitized
        .replace(/\b(appointment|meeting)\b/gi, 'visit')
        .replace(/\b(conference|presentation)\b/gi, 'event');
    }

    return sanitized || this.createGenericTitle(new Date());
  }

  /**
   * Generalize event title while keeping it informative
   */
  private static generalizeEventTitle(title: string): string {
    const generalizations = {
      meeting: 'Family Planning',
      appointment: 'Family Activity',
      conference: 'Family Event',
      interview: 'Family Meeting',
      call: 'Family Check-in',
    };

    let generalized = title;
    Object.entries(generalizations).forEach(([specific, general]) => {
      generalized = generalized.replace(new RegExp(specific, 'gi'), general);
    });

    return generalized;
  }

  /**
   * Create generic child-safe title
   */
  private static createGenericTitle(date: Date): string {
    const timeOfDay = this.getTimeOfDay(date);
    const genericTitles = [
      `${timeOfDay} Family Time`,
      `${timeOfDay} Activity`,
      `${timeOfDay} Event`,
      `Family ${timeOfDay}`,
    ];

    return genericTitles[Math.floor(Math.random() * genericTitles.length)];
  }

  /**
   * Get time of day description
   */
  private static getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    if (hour < 20) return 'Evening';
    return 'Night';
  }

  /**
   * Validate that filtered events meet COPPA requirements
   */
  static validateCOPPACompliance(events: CalendarEvent[]): {
    isCompliant: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    events.forEach((event, index) => {
      // Check for PII in sanitized content
      if (event.sanitizedTitle && this.containsPII(event.sanitizedTitle)) {
        violations.push(`Event ${index}: Sanitized title contains PII`);
      }

      // Check for sensitive location data
      if (event.location && this.hasLocationSensitivity(event.location)) {
        violations.push(
          `Event ${index}: Location contains sensitive information`
        );
      }

      // Check privacy level assignment
      if (event.isChildRelevant && event.privacyLevel === 'private') {
        violations.push(`Event ${index}: Inconsistent privacy classification`);
      }
    });

    return {
      isCompliant: violations.length === 0,
      violations,
    };
  }

  /**
   * Check for personally identifiable information
   */
  private static containsPII(text: string): boolean {
    const piiPatterns = [
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
      /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd)\b/i, // Addresses
      /\b\d{9}\b/, // SSN-like patterns
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card patterns
    ];

    return piiPatterns.some(pattern => pattern.test(text));
  }
}
