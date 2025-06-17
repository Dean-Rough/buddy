/**
 * Apple Calendar (iCloud) Integration
 * CalDAV-based integration with Apple iCloud Calendar
 * COPPA-compliant with privacy-first design
 *
 * Note: Apple doesn't provide OAuth2 for calendar access like Google/Microsoft.
 * This implementation uses CalDAV protocol with app-specific passwords.
 */

import {
  CalendarEvent,
  CalendarSyncResult,
  CalendarCredentials,
  // AppleCalendarEvent, // TODO: Used for Apple-specific event formatting
} from '../types';

interface AppleCalendarConfig {
  username: string; // Apple ID
  appPassword: string; // App-specific password
  calendarUrl: string; // CalDAV URL
}

interface CalDAVEvent {
  uid: string;
  summary: string;
  dtstart: string;
  dtend: string;
  location?: string;
  description?: string;
  class?: string;
  rrule?: string; // Recurrence rule
}

/**
 * Apple Calendar (iCloud) provider implementation using CalDAV
 */
export class AppleCalendarProvider {
  private static readonly CALDAV_BASE_URL = 'https://caldav.icloud.com';

  constructor() {}

  /**
   * Generate setup instructions for Apple Calendar integration
   * Apple requires app-specific passwords rather than OAuth2
   */
  generateSetupInstructions(): {
    instructions: string[];
    appPasswordUrl: string;
  } {
    return {
      instructions: [
        '1. Go to appleid.apple.com and sign in',
        '2. Navigate to "Sign-In and Security" > "App-Specific Passwords"',
        '3. Click "Generate an app-specific password"',
        '4. Enter "Buddy AI" as the label',
        '5. Copy the generated password and enter it below',
        '6. We will use this to securely access your calendar (read-only)',
      ],
      appPasswordUrl:
        'https://appleid.apple.com/account/manage/section/security',
    };
  }

  /**
   * Validate Apple Calendar credentials
   */
  async validateCredentials(config: AppleCalendarConfig): Promise<{
    success: boolean;
    error?: string;
    calendarUrl?: string;
  }> {
    try {
      // Discover CalDAV URL for the user
      const calendarUrl = await this.discoverCalendarUrl(
        config.username,
        config.appPassword
      );

      // Test connection by fetching calendar properties
      const response = await fetch(calendarUrl, {
        method: 'PROPFIND',
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.username}:${config.appPassword}`).toString('base64')}`,
          'Content-Type': 'application/xml',
          Depth: '0',
        },
        body: `<?xml version="1.0" encoding="utf-8" ?>
               <propfind xmlns="DAV:">
                 <prop>
                   <displayname />
                   <calendar-description xmlns="urn:ietf:params:xml:ns:caldav" />
                 </prop>
               </propfind>`,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Authentication failed: ${response.status} ${response.statusText}`,
        };
      }

      return { success: true, calendarUrl };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Discover CalDAV URL for Apple iCloud calendar
   */
  private async discoverCalendarUrl(
    username: string,
    appPassword: string
  ): Promise<string> {
    // Apple iCloud CalDAV discovery
    const wellKnownUrl = `${AppleCalendarProvider.CALDAV_BASE_URL}/.well-known/caldav`;

    const response = await fetch(wellKnownUrl, {
      method: 'PROPFIND',
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
        'Content-Type': 'application/xml',
        Depth: '0',
      },
      body: `<?xml version="1.0" encoding="utf-8" ?>
             <propfind xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
               <prop>
                 <C:calendar-home-set />
               </prop>
             </propfind>`,
    });

    if (!response.ok) {
      throw new Error(`CalDAV discovery failed: ${response.status}`);
    }

    // Parse XML response to extract calendar URL
    const xmlText = await response.text();
    const calendarHomeMatch = xmlText.match(/<C:href[^>]*>([^<]+)<\/C:href>/);

    if (!calendarHomeMatch) {
      throw new Error('Could not discover calendar URL from CalDAV response');
    }

    return calendarHomeMatch[1];
  }

  /**
   * Sync calendar events from Apple Calendar
   */
  async syncCalendarEvents(
    credentials: CalendarCredentials,
    options: {
      maxResults?: number;
      timeMin?: Date;
      timeMax?: Date;
    } = {}
  ): Promise<CalendarSyncResult> {
    const startTime = Date.now();
    const result: CalendarSyncResult = {
      success: false,
      provider: 'apple',
      credentialsId: credentials.id,
      eventsProcessed: 0,
      eventsAdded: 0,
      eventsUpdated: 0,
      eventsRemoved: 0,
      syncDuration: 0,
      errors: [],
      lastSyncAt: new Date(),
    };

    try {
      // Decode credentials (they would be encrypted in production)
      const config = this.decodeCredentials(credentials);

      // Fetch calendar events using CalDAV
      const events = await this.fetchCalendarEvents(config, {
        timeMin: options.timeMin || new Date(),
        timeMax:
          options.timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days ahead
      });

      // Convert Apple events to our format
      const convertedEvents = events.map(event =>
        this.convertAppleEventToCalendarEvent(event, credentials)
      );

      result.eventsProcessed = convertedEvents.length;
      result.eventsAdded = convertedEvents.length; // Simplified for initial implementation
      result.success = true;
    } catch (error) {
      console.error('Apple Calendar sync failed:', error);
      result.errors.push(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    result.syncDuration = Date.now() - startTime;
    return result;
  }

  /**
   * Fetch calendar events using CalDAV protocol
   */
  private async fetchCalendarEvents(
    config: AppleCalendarConfig,
    options: {
      timeMin: Date;
      timeMax: Date;
    }
  ): Promise<CalDAVEvent[]> {
    const timeMinStr = this.formatCalDAVDate(options.timeMin);
    const timeMaxStr = this.formatCalDAVDate(options.timeMax);

    const calendarQueryBody = `<?xml version="1.0" encoding="utf-8" ?>
      <C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
        <D:prop>
          <D:getetag />
          <C:calendar-data />
        </D:prop>
        <C:filter>
          <C:comp-filter name="VCALENDAR">
            <C:comp-filter name="VEVENT">
              <C:time-range start="${timeMinStr}" end="${timeMaxStr}" />
            </C:comp-filter>
          </C:comp-filter>
        </C:filter>
      </C:calendar-query>`;

    const response = await fetch(config.calendarUrl, {
      method: 'REPORT',
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.username}:${config.appPassword}`).toString('base64')}`,
        'Content-Type': 'application/xml',
        Depth: '1',
      },
      body: calendarQueryBody,
    });

    if (!response.ok) {
      throw new Error(
        `CalDAV query failed: ${response.status} ${response.statusText}`
      );
    }

    const xmlText = await response.text();
    return this.parseCalDAVResponse(xmlText);
  }

  /**
   * Parse CalDAV XML response and extract events
   */
  private parseCalDAVResponse(xmlText: string): CalDAVEvent[] {
    const events: CalDAVEvent[] = [];

    // Extract VEVENT components from the XML
    const calendarDataMatches = xmlText.match(
      /<C:calendar-data[^>]*>([\s\S]*?)<\/C:calendar-data>/g
    );

    if (!calendarDataMatches) {
      return events;
    }

    for (const calendarData of calendarDataMatches) {
      // Extract the iCalendar data
      const icalData = calendarData.replace(/<[^>]*>/g, '').trim();

      // Parse iCalendar VEVENT
      const event = this.parseVEvent(icalData);
      if (event) {
        events.push(event);
      }
    }

    return events;
  }

  /**
   * Parse individual VEVENT from iCalendar data
   */
  private parseVEvent(icalData: string): CalDAVEvent | null {
    const lines = icalData.split('\n').map(line => line.trim());
    const event: Partial<CalDAVEvent> = {};

    for (const line of lines) {
      if (line.startsWith('UID:')) {
        event.uid = line.substring(4);
      } else if (line.startsWith('SUMMARY:')) {
        event.summary = line.substring(8);
      } else if (line.startsWith('DTSTART')) {
        const dateValue = this.extractDateFromICalLine(line);
        if (dateValue) event.dtstart = dateValue;
      } else if (line.startsWith('DTEND')) {
        const dateValue = this.extractDateFromICalLine(line);
        if (dateValue) event.dtend = dateValue;
      } else if (line.startsWith('LOCATION:')) {
        event.location = line.substring(9);
      } else if (line.startsWith('DESCRIPTION:')) {
        event.description = line.substring(12);
      } else if (line.startsWith('CLASS:')) {
        event.class = line.substring(6);
      }
    }

    // Validate required fields
    if (event.uid && event.dtstart && event.dtend) {
      return event as CalDAVEvent;
    }

    return null;
  }

  /**
   * Extract date value from iCalendar date line
   */
  private extractDateFromICalLine(line: string): string | null {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return null;

    return line.substring(colonIndex + 1);
  }

  /**
   * Convert Apple Calendar event to our format
   */
  private convertAppleEventToCalendarEvent(
    appleEvent: CalDAVEvent,
    credentials: CalendarCredentials
  ): Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'lastSyncAt'> {
    // Parse iCalendar dates
    const startDate = this.parseICalDate(appleEvent.dtstart);
    const endDate = this.parseICalDate(appleEvent.dtend);
    const isAllDay = appleEvent.dtstart.length === 8; // YYYYMMDD format for all-day

    return {
      calendarCredentialsId: credentials.id,
      externalEventId: appleEvent.uid,
      provider: 'apple',
      title: appleEvent.summary || 'Untitled Event',
      startDate,
      endDate,
      isAllDay,
      isChildRelevant: false, // Will be determined by privacy filter
      privacyLevel: this.mapClassToPrivacyLevel(appleEvent.class),
      originalTitle: appleEvent.summary || 'Untitled Event',
      location: appleEvent.location,
      description: appleEvent.description,
    };
  }

  /**
   * Parse iCalendar date format
   */
  private parseICalDate(dateStr: string): Date {
    // Handle various iCalendar date formats
    if (dateStr.includes('T')) {
      // DateTime format: YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
      const cleanDate = dateStr.replace(/[TZ]/g, '');
      const year = parseInt(cleanDate.substring(0, 4));
      const month = parseInt(cleanDate.substring(4, 6)) - 1;
      const day = parseInt(cleanDate.substring(6, 8));
      const hour = parseInt(cleanDate.substring(8, 10)) || 0;
      const minute = parseInt(cleanDate.substring(10, 12)) || 0;
      const second = parseInt(cleanDate.substring(12, 14)) || 0;

      return new Date(year, month, day, hour, minute, second);
    } else {
      // Date format: YYYYMMDD
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));

      return new Date(year, month, day);
    }
  }

  /**
   * Format date for CalDAV queries
   */
  private formatCalDAVDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  /**
   * Map Apple Calendar class to our privacy levels
   */
  private mapClassToPrivacyLevel(
    classValue?: string
  ): 'public' | 'family' | 'private' | 'filtered' {
    switch (classValue?.toLowerCase()) {
      case 'public':
        return 'public';
      case 'private':
        return 'private';
      case 'confidential':
        return 'private';
      default:
        return 'family';
    }
  }

  /**
   * Decode encrypted credentials (simplified for demo)
   */
  private decodeCredentials(
    credentials: CalendarCredentials
  ): AppleCalendarConfig {
    // In production, this would decrypt the encryptedCredentials field
    // For now, we'll assume the credentials are stored in a parseable format
    try {
      const decoded = JSON.parse(credentials.encryptedCredentials);
      return {
        username: decoded.username,
        appPassword: decoded.appPassword,
        calendarUrl: decoded.calendarUrl,
      };
    } catch {
      throw new Error('Invalid Apple Calendar credentials format');
    }
  }

  /**
   * Test calendar connection
   */
  async testConnection(credentials: CalendarCredentials): Promise<{
    success: boolean;
    calendarName?: string;
    error?: string;
  }> {
    try {
      const config = this.decodeCredentials(credentials);
      const validation = await this.validateCredentials(config);

      if (validation.success) {
        return {
          success: true,
          calendarName: 'iCloud Calendar',
        };
      } else {
        return {
          success: false,
          error: validation.error,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get privacy notice for parent consent
   */
  getPrivacyNotice(): string {
    return `
Apple iCloud Calendar Integration Privacy Notice:

• We use app-specific passwords (not your Apple ID password) for secure access
• We will only read your calendar events (read-only access via CalDAV)
• Events are filtered for child safety before any sharing
• We respect Apple Calendar's privacy classifications
• Calendar data is retained for maximum 90 days (COPPA compliance)
• You can revoke access by deleting the app-specific password
• Location data is optional and can be disabled
• Private/confidential events are automatically filtered out

This integration helps provide context for your child's conversations while maintaining strict privacy standards.
    `.trim();
  }

  /**
   * Note: Apple Calendar doesn't support webhooks like Google/Outlook
   * Real-time updates would require periodic polling
   */
  async setupWebhook(): Promise<{ supported: false; message: string }> {
    return {
      supported: false,
      message:
        'Apple Calendar does not support webhooks. Calendar sync will use periodic polling instead.',
    };
  }

  /**
   * Revoke calendar access
   */
  async revokeAccess(): Promise<void> {
    // For Apple Calendar, access is revoked by deleting the app-specific password
    // This needs to be done manually by the user at appleid.apple.com
    console.warn(
      'Apple Calendar access revocation requires manual deletion of app-specific password at appleid.apple.com'
    );
  }
}
