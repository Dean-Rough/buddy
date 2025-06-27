/**
 * Google Calendar Integration Service
 * COPPA-compliant family calendar integration with privacy filtering
 */

import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/prisma';
import { CalendarEvent, CalendarCredentials } from '@prisma/client';
import { encrypt, decrypt } from '@/lib/encryption'; // We'll need to create this

export interface CalendarServiceConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface CalendarSyncResult {
  success: boolean;
  eventsProcessed: number;
  eventsAdded: number;
  eventsUpdated: number;
  eventsRemoved: number;
  errors: string[];
  syncDuration: number;
}

/**
 * Google Calendar Service
 * Handles OAuth2 authentication and calendar synchronization
 */
export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private config: CalendarServiceConfig;

  constructor(config?: Partial<CalendarServiceConfig>) {
    this.config = {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4288/api/calendar/callback',
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly',
      ],
      ...config,
    };

    this.oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );
  }

  /**
   * Generate OAuth2 authorization URL
   */
  generateAuthUrl(parentClerkUserId: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.config.scopes,
      state: parentClerkUserId, // Pass parent ID for callback
      prompt: 'consent', // Always get refresh token
    });
  }

  /**
   * Handle OAuth2 callback and store credentials
   */
  async handleCallback(
    code: string,
    parentClerkUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Missing tokens in OAuth response');
      }

      // Encrypt tokens for storage
      const encryptedAccess = await encrypt(tokens.access_token);
      const encryptedRefresh = await encrypt(tokens.refresh_token);
      const encryptedCredentials = await encrypt(JSON.stringify(tokens));

      // Store or update credentials
      await prisma.calendarCredentials.upsert({
        where: {
          parentClerkUserId_provider: {
            parentClerkUserId,
            provider: 'google',
          },
        },
        update: {
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          encryptedCredentials,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          parentClerkUserId,
          provider: 'google',
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          encryptedCredentials,
          isActive: true,
        },
      });

      // Initial sync
      await this.syncCalendarEvents(parentClerkUserId);

      return { success: true };
    } catch (error) {
      console.error('OAuth callback error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Sync calendar events for a parent
   */
  async syncCalendarEvents(parentClerkUserId: string): Promise<CalendarSyncResult> {
    const startTime = Date.now();
    const result: CalendarSyncResult = {
      success: false,
      eventsProcessed: 0,
      eventsAdded: 0,
      eventsUpdated: 0,
      eventsRemoved: 0,
      errors: [],
      syncDuration: 0,
    };

    try {
      // Get credentials
      const credentials = await prisma.calendarCredentials.findFirst({
        where: {
          parentClerkUserId,
          provider: 'google',
          isActive: true,
        },
      });

      if (!credentials) {
        throw new Error('No active Google Calendar credentials found');
      }

      // Decrypt and set tokens
      const accessToken = await decrypt(credentials.accessToken);
      const refreshToken = credentials.refreshToken ? await decrypt(credentials.refreshToken) : undefined;
      
      this.oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
        expiry_date: credentials.tokenExpiry?.getTime(),
      });

      // Initialize calendar API
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      // Get events for the next 30 days
      const timeMin = new Date();
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 30);

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250, // Reasonable limit for family calendars
      });

      const events = response.data.items || [];
      result.eventsProcessed = events.length;

      // Get existing events for comparison
      const existingEvents = await prisma.calendarEvent.findMany({
        where: {
          calendarCredentialsId: credentials.id,
          startDate: {
            gte: timeMin,
            lte: timeMax,
          },
        },
      });

      const existingEventMap = new Map(
        existingEvents.map(e => [e.externalEventId, e])
      );

      // Process each event
      for (const event of events) {
        if (!event.id || (!event.start?.dateTime && !event.start?.date)) {
          result.errors.push(`Invalid event: ${event.summary || 'No title'}`);
          continue;
        }

        const startDate = new Date(event.start.dateTime || event.start.date!);
        const endDate = event.end 
          ? new Date(event.end.dateTime || event.end.date!)
          : startDate;

        // Apply privacy filters
        const { isChildRelevant, privacyLevel, sanitizedTitle } = 
          await this.applyPrivacyFilters(event, parentClerkUserId);

        const eventData = {
          calendarCredentialsId: credentials.id,
          externalEventId: event.id,
          provider: 'google',
          title: sanitizedTitle || event.summary || 'Untitled Event',
          startDate,
          endDate,
          isAllDay: !event.start.dateTime,
          isChildRelevant,
          privacyLevel,
          sanitizedTitle,
          originalTitle: await encrypt(event.summary || 'Untitled Event'),
          location: event.location,
          description: event.description,
          lastSyncAt: new Date(),
        };

        try {
          if (existingEventMap.has(event.id)) {
            // Update existing event
            await prisma.calendarEvent.update({
              where: { id: existingEventMap.get(event.id)!.id },
              data: eventData,
            });
            result.eventsUpdated++;
          } else {
            // Create new event
            await prisma.calendarEvent.create({
              data: eventData,
            });
            result.eventsAdded++;
          }
          existingEventMap.delete(event.id);
        } catch (error) {
          result.errors.push(`Failed to process event ${event.summary}: ${error}`);
        }
      }

      // Remove events that no longer exist
      for (const [_, oldEvent] of existingEventMap) {
        await prisma.calendarEvent.delete({
          where: { id: oldEvent.id },
        });
        result.eventsRemoved++;
      }

      // Update last sync time
      await prisma.calendarCredentials.update({
        where: { id: credentials.id },
        data: { lastSyncAt: new Date() },
      });

      // Record sync metrics
      await prisma.calendarSyncMetric.create({
        data: {
          credentialsId: credentials.id,
          provider: 'google',
          syncDuration: Date.now() - startTime,
          eventsProcessed: result.eventsProcessed,
          eventsAdded: result.eventsAdded,
          eventsUpdated: result.eventsUpdated,
          eventsRemoved: result.eventsRemoved,
          errorCount: result.errors.length,
          syncStarted: new Date(startTime),
          syncCompleted: new Date(),
        },
      });

      // Create compliance audit log
      await prisma.calendarComplianceAudit.create({
        data: {
          parentClerkUserId,
          childAccountIds: [], // Will be populated when family context is set up
          action: 'sync',
          dataType: 'calendar_event',
          dataIds: events.map(e => e.id!),
          complianceStatus: 'compliant',
          violationCount: 0,
        },
      });

      result.success = true;
    } catch (error) {
      console.error('Calendar sync error:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    result.syncDuration = Date.now() - startTime;
    return result;
  }

  /**
   * Apply COPPA-compliant privacy filters to calendar events
   */
  private async applyPrivacyFilters(
    event: calendar_v3.Schema$Event,
    parentClerkUserId: string
  ): Promise<{
    isChildRelevant: boolean;
    privacyLevel: string;
    sanitizedTitle: string | null;
  }> {
    // Get parent's privacy rules
    const privacyRules = await prisma.calendarPrivacyRule.findMany({
      where: {
        parentClerkUserId,
        isActive: true,
      },
    });

    let isChildRelevant = false;
    let privacyLevel = 'family'; // Default to family-safe
    let sanitizedTitle = event.summary || '';

    // Check privacy rules
    for (const rule of privacyRules) {
      const regex = new RegExp(rule.pattern, 'i');
      
      switch (rule.ruleType) {
        case 'keyword_block':
          if (regex.test(event.summary || '') || regex.test(event.description || '')) {
            privacyLevel = 'private';
            sanitizedTitle = 'Family Event';
            isChildRelevant = false;
          }
          break;
          
        case 'keyword_allow':
          if (regex.test(event.summary || '')) {
            isChildRelevant = true;
            privacyLevel = 'public';
          }
          break;
      }
    }

    // Apply default child-relevance heuristics
    const childKeywords = [
      'school', 'homework', 'practice', 'lesson', 'playdate', 
      'birthday', 'sports', 'club', 'camp', 'class'
    ];
    
    const adultKeywords = [
      'meeting', 'work', 'conference', 'appointment', 'doctor',
      'dentist', 'therapy', 'date night', 'adult'
    ];

    const titleLower = (event.summary || '').toLowerCase();
    
    if (childKeywords.some(keyword => titleLower.includes(keyword))) {
      isChildRelevant = true;
    }
    
    if (adultKeywords.some(keyword => titleLower.includes(keyword))) {
      isChildRelevant = false;
      if (privacyLevel !== 'private') {
        privacyLevel = 'filtered';
        sanitizedTitle = this.sanitizeTitle(event.summary || '');
      }
    }

    return {
      isChildRelevant,
      privacyLevel,
      sanitizedTitle: sanitizedTitle !== event.summary ? sanitizedTitle : null,
    };
  }

  /**
   * Sanitize event title for child safety
   */
  private sanitizeTitle(title: string): string {
    // Remove potentially sensitive information
    const sanitized = title
      .replace(/\b(doctor|dr\.|therapist|counselor|therapy)\b/gi, 'Appointment')
      .replace(/\b(meeting|conference|work)\b/gi, 'Parent Activity')
      .replace(/\b\d{3,}\b/g, '***') // Hide phone numbers
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***'); // Hide emails

    return sanitized;
  }

  /**
   * Get child-relevant events for conversation context
   */
  async getChildRelevantEvents(
    parentClerkUserId: string,
    childAccountId: string,
    daysAhead: number = 7
  ): Promise<CalendarEvent[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    const events = await prisma.calendarEvent.findMany({
      where: {
        credentials: {
          parentClerkUserId,
          isActive: true,
        },
        isChildRelevant: true,
        privacyLevel: {
          in: ['public', 'family'],
        },
        startDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    // Log access for COPPA compliance
    await prisma.calendarComplianceAudit.create({
      data: {
        parentClerkUserId,
        childAccountIds: [childAccountId],
        action: 'view',
        dataType: 'calendar_event',
        dataIds: events.map(e => e.id),
        complianceStatus: 'compliant',
        violationCount: 0,
      },
    });

    return events;
  }

  /**
   * Disconnect calendar integration
   */
  async disconnect(parentClerkUserId: string): Promise<void> {
    await prisma.calendarCredentials.updateMany({
      where: {
        parentClerkUserId,
        provider: 'google',
      },
      data: {
        isActive: false,
      },
    });

    // Create audit log
    await prisma.calendarComplianceAudit.create({
      data: {
        parentClerkUserId,
        childAccountIds: [],
        action: 'delete',
        dataType: 'credentials',
        dataIds: ['google_calendar_disconnect'],
        complianceStatus: 'compliant',
        violationCount: 0,
      },
    });
  }
}

// Singleton instance
export const googleCalendarService = new GoogleCalendarService();