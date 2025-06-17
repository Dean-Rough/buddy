/**
 * Google Calendar API Integration
 * OAuth2-based integration with Google Calendar API v3
 * COPPA-compliant with privacy-first design
 */

import {
  CalendarEvent,
  CalendarSyncResult,
  GoogleCalendarEvent,
  OAuthConfig,
  CalendarCredentials,
} from '../types';

interface GoogleOAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GoogleCalendarListResponse {
  items: GoogleCalendarEvent[];
  nextPageToken?: string;
}

/**
 * Google Calendar provider implementation
 */
export class GoogleCalendarProvider {
  private static readonly BASE_URL = 'https://www.googleapis.com/calendar/v3';
  private static readonly OAUTH_URL =
    'https://accounts.google.com/o/oauth2/v2/auth';
  private static readonly TOKEN_URL = 'https://oauth2.googleapis.com/token';

  private config: OAuthConfig;

  constructor() {
    this.config = {
      clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI || '',
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      authorizationUrl: GoogleCalendarProvider.OAUTH_URL,
      tokenUrl: GoogleCalendarProvider.TOKEN_URL,
    };
  }

  /**
   * Generate OAuth2 authorization URL for parent consent
   */
  generateAuthUrl(parentClerkUserId: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: parentClerkUserId, // Track which parent is authorizing
    });

    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleOAuthTokens> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }

    return response.json();
  }

  /**
   * Refresh expired access token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleOAuthTokens> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh access token: ${error}`);
    }

    return response.json();
  }

  /**
   * Sync calendar events from Google Calendar
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
      provider: 'google',
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
      // Ensure we have a valid access token
      const accessToken = await this.ensureValidToken(credentials);

      // Get primary calendar events
      const events = await this.fetchCalendarEvents(accessToken, {
        maxResults: options.maxResults || 250,
        timeMin: options.timeMin || new Date(),
        timeMax:
          options.timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days ahead
      });

      // Convert Google events to our format
      const convertedEvents = events.map(event =>
        this.convertGoogleEventToCalendarEvent(event, credentials)
      );

      result.eventsProcessed = convertedEvents.length;
      result.eventsAdded = convertedEvents.length; // Simplified for initial implementation
      result.success = true;
    } catch (error) {
      console.error('Google Calendar sync failed:', error);
      result.errors.push(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    result.syncDuration = Date.now() - startTime;
    return result;
  }

  /**
   * Fetch calendar events from Google Calendar API
   */
  private async fetchCalendarEvents(
    accessToken: string,
    options: {
      maxResults: number;
      timeMin: Date;
      timeMax: Date;
    }
  ): Promise<GoogleCalendarEvent[]> {
    const url = new URL(
      `${GoogleCalendarProvider.BASE_URL}/calendars/primary/events`
    );
    url.searchParams.set('maxResults', options.maxResults.toString());
    url.searchParams.set('timeMin', options.timeMin.toISOString());
    url.searchParams.set('timeMax', options.timeMax.toISOString());
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch Google Calendar events: ${error}`);
    }

    const data: GoogleCalendarListResponse = await response.json();
    return data.items || [];
  }

  /**
   * Convert Google Calendar event to our format
   */
  private convertGoogleEventToCalendarEvent(
    googleEvent: GoogleCalendarEvent,
    credentials: CalendarCredentials
  ): Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'lastSyncAt'> {
    // Parse dates
    const startDate = this.parseGoogleDate(googleEvent.start);
    const endDate = this.parseGoogleDate(googleEvent.end);
    const isAllDay = !googleEvent.start.dateTime; // All-day events use 'date' instead of 'dateTime'

    return {
      calendarCredentialsId: credentials.id,
      externalEventId: googleEvent.id,
      provider: 'google',
      title: googleEvent.summary || 'Untitled Event',
      startDate,
      endDate,
      isAllDay,
      isChildRelevant: false, // Will be determined by privacy filter
      privacyLevel: 'private', // Default to private until filtered
      originalTitle: googleEvent.summary || 'Untitled Event',
      location: googleEvent.location,
      description: googleEvent.description,
    };
  }

  /**
   * Parse Google Calendar date/time format
   */
  private parseGoogleDate(
    dateObj: GoogleCalendarEvent['start'] | GoogleCalendarEvent['end']
  ): Date {
    if (dateObj.dateTime) {
      return new Date(dateObj.dateTime);
    } else if (dateObj.date) {
      return new Date(dateObj.date);
    }
    throw new Error('Invalid date format in Google Calendar event');
  }

  /**
   * Ensure we have a valid access token, refreshing if necessary
   */
  private async ensureValidToken(
    credentials: CalendarCredentials
  ): Promise<string> {
    // Check if token is expired
    if (credentials.tokenExpiry && credentials.tokenExpiry <= new Date()) {
      if (!credentials.refreshToken) {
        throw new Error('Access token expired and no refresh token available');
      }

      // Refresh the token
      const newTokens = await this.refreshAccessToken(credentials.refreshToken);

      // Note: In a real implementation, you would update the credentials in the database here
      // For now, we'll just use the new access token
      return newTokens.access_token;
    }

    return credentials.accessToken;
  }

  /**
   * Set up webhook for real-time calendar updates
   */
  async setupWebhook(
    credentials: CalendarCredentials,
    webhookUrl: string
  ): Promise<{ id: string; resourceId: string; expiration: Date }> {
    const accessToken = await this.ensureValidToken(credentials);

    const watchRequest = {
      id: `buddy-webhook-${credentials.id}-${Date.now()}`,
      type: 'web_hook',
      address: webhookUrl,
    };

    const response = await fetch(
      `${GoogleCalendarProvider.BASE_URL}/calendars/primary/events/watch`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(watchRequest),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to setup webhook: ${error}`);
    }

    const webhookResponse = await response.json();

    return {
      id: webhookResponse.id,
      resourceId: webhookResponse.resourceId,
      expiration: new Date(parseInt(webhookResponse.expiration)),
    };
  }

  /**
   * Revoke calendar access (for COPPA compliance - parent can revoke anytime)
   */
  async revokeAccess(accessToken: string): Promise<void> {
    const response = await fetch(
      `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to revoke access: ${error}`);
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
      const accessToken = await this.ensureValidToken(credentials);

      const response = await fetch(
        `${GoogleCalendarProvider.BASE_URL}/calendars/primary`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      const calendar = await response.json();
      return {
        success: true,
        calendarName: calendar.summary || 'Primary Calendar',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get available calendar scopes for transparency
   */
  getRequiredScopes(): string[] {
    return ['https://www.googleapis.com/auth/calendar.readonly'];
  }

  /**
   * Get privacy notice for parent consent
   */
  getPrivacyNotice(): string {
    return `
Google Calendar Integration Privacy Notice:

• We will only read your calendar events (read-only access)
• Events are filtered for child safety before any sharing
• We do not store sensitive personal information
• Calendar data is retained for maximum 90 days (COPPA compliance)
• You can revoke access at any time
• Location data is optional and can be disabled
• Private/sensitive events are automatically filtered out

This integration helps provide context for your child's conversations while maintaining strict privacy standards.
    `.trim();
  }
}
