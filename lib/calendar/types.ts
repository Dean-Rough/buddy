/**
 * Calendar Integration Types
 * COPPA-compliant family calendar integration with privacy-first design
 */

export type CalendarProvider = 'google' | 'apple' | 'outlook';

export interface CalendarCredentials {
  id: string;
  parentClerkUserId: string;
  provider: CalendarProvider;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  encryptedCredentials: string; // Encrypted for security
  lastSyncAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEvent {
  id: string;
  calendarCredentialsId: string;
  externalEventId: string;
  provider: CalendarProvider;

  // Event details (privacy-filtered)
  title: string; // May be sanitized for privacy
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;

  // Privacy and child safety
  isChildRelevant: boolean; // Determined by privacy filter
  privacyLevel: 'public' | 'family' | 'private' | 'filtered';
  sanitizedTitle?: string; // Child-safe version of title

  // Metadata
  originalTitle: string; // Encrypted, for parent reference only
  location?: string; // Optional, privacy-filtered
  description?: string; // Optional, privacy-filtered

  // System fields
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt: Date;
}

export interface CalendarSyncResult {
  success: boolean;
  provider: CalendarProvider;
  credentialsId: string;
  eventsProcessed: number;
  eventsAdded: number;
  eventsUpdated: number;
  eventsRemoved: number;
  syncDuration: number; // milliseconds
  errors: string[];
  lastSyncAt: Date;
}

export interface CalendarWebhook {
  id: string;
  calendarCredentialsId: string;
  provider: CalendarProvider;
  webhookUrl: string;
  externalWebhookId: string;
  isActive: boolean;
  lastTriggeredAt?: Date;
  createdAt: Date;
}

export interface PrivacyFilterRule {
  id: string;
  parentClerkUserId: string;
  ruleType:
    | 'keyword_block'
    | 'keyword_allow'
    | 'time_filter'
    | 'location_filter';
  pattern: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CalendarIntegrationConfig {
  maxEventsPerSync: number;
  syncIntervalMinutes: number;
  privacyFilterEnabled: boolean;
  retentionDays: number; // COPPA compliance - max 90 days
  encryptionEnabled: boolean;
  webhooksEnabled: boolean;
}

// API Response types for external calendar services
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  description?: string;
  status: string;
  visibility?: string;
}

export interface OutlookCalendarEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  bodyPreview?: string;
  isAllDay: boolean;
  sensitivity: string;
}

export interface AppleCalendarEvent {
  uid: string;
  summary: string;
  dtstart: string;
  dtend: string;
  location?: string;
  description?: string;
  class?: string; // privacy classification
}

// OAuth2 configuration
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authorizationUrl: string;
  tokenUrl: string;
}

// Family context for calendar integration
export interface FamilyCalendarContext {
  parentClerkUserId: string;
  childAccountIds: string[];
  sharedEvents: CalendarEvent[];
  privacySettings: {
    shareUpcomingEvents: boolean;
    eventLookaheadDays: number;
    filterPrivateEvents: boolean;
    allowLocationSharing: boolean;
  };
}
