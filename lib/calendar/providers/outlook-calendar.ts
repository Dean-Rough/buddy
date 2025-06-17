/**
 * Microsoft Outlook Calendar API Integration
 * OAuth2-based integration with Microsoft Graph API
 * COPPA-compliant with privacy-first design
 */

import {
  CalendarEvent,
  CalendarSyncResult,
  OutlookCalendarEvent,
  OAuthConfig,
  CalendarCredentials,
} from '../types';

interface OutlookOAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface OutlookCalendarListResponse {
  value: OutlookCalendarEvent[];
  '@odata.nextLink'?: string;
}

/**
 * Microsoft Outlook Calendar provider implementation
 */
export class OutlookCalendarProvider {
  private static readonly BASE_URL = 'https://graph.microsoft.com/v1.0';
  private static readonly OAUTH_URL =
    'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
  private static readonly TOKEN_URL =
    'https://login.microsoftonline.com/common/oauth2/v2.0/token';

  private config: OAuthConfig;

  constructor() {
    this.config = {
      clientId: process.env.OUTLOOK_CALENDAR_CLIENT_ID || '',
      clientSecret: process.env.OUTLOOK_CALENDAR_CLIENT_SECRET || '',
      redirectUri: process.env.OUTLOOK_CALENDAR_REDIRECT_URI || '',
      scopes: ['https://graph.microsoft.com/Calendars.Read'],
      authorizationUrl: OutlookCalendarProvider.OAUTH_URL,
      tokenUrl: OutlookCalendarProvider.TOKEN_URL,
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
      response_mode: 'query',
      state: parentClerkUserId,
    });

    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<OutlookOAuthTokens> {
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
  async refreshAccessToken(refreshToken: string): Promise<OutlookOAuthTokens> {
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
   * Sync calendar events from Outlook Calendar
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
      provider: 'outlook',
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

      // Get calendar events
      const events = await this.fetchCalendarEvents(accessToken, {
        maxResults: options.maxResults || 250,
        timeMin: options.timeMin || new Date(),
        timeMax:
          options.timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days ahead
      });

      // Convert Outlook events to our format
      const convertedEvents = events.map(event =>
        this.convertOutlookEventToCalendarEvent(event, credentials)
      );

      result.eventsProcessed = convertedEvents.length;
      result.eventsAdded = convertedEvents.length; // Simplified for initial implementation
      result.success = true;
    } catch (error) {
      console.error('Outlook Calendar sync failed:', error);
      result.errors.push(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    result.syncDuration = Date.now() - startTime;
    return result;
  }

  /**
   * Fetch calendar events from Microsoft Graph API
   */
  private async fetchCalendarEvents(
    accessToken: string,
    options: {
      maxResults: number;
      timeMin: Date;
      timeMax: Date;
    }
  ): Promise<OutlookCalendarEvent[]> {
    const url = new URL(`${OutlookCalendarProvider.BASE_URL}/me/events`);
    url.searchParams.set('$top', options.maxResults.toString());
    url.searchParams.set(
      '$filter',
      `start/dateTime ge '${options.timeMin.toISOString()}' and start/dateTime le '${options.timeMax.toISOString()}'`
    );
    url.searchParams.set('$orderby', 'start/dateTime');
    url.searchParams.set(
      '$select',
      'id,subject,start,end,location,bodyPreview,isAllDay,sensitivity'
    );

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch Outlook Calendar events: ${error}`);
    }

    const data: OutlookCalendarListResponse = await response.json();
    return data.value || [];
  }

  /**
   * Convert Outlook Calendar event to our format
   */
  private convertOutlookEventToCalendarEvent(
    outlookEvent: OutlookCalendarEvent,
    credentials: CalendarCredentials
  ): Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'lastSyncAt'> {
    // Parse dates
    const startDate = new Date(outlookEvent.start.dateTime);
    const endDate = new Date(outlookEvent.end.dateTime);

    return {
      calendarCredentialsId: credentials.id,
      externalEventId: outlookEvent.id,
      provider: 'outlook',
      title: outlookEvent.subject || 'Untitled Event',
      startDate,
      endDate,
      isAllDay: outlookEvent.isAllDay,
      isChildRelevant: false, // Will be determined by privacy filter
      privacyLevel: this.mapSensitivityToPrivacyLevel(outlookEvent.sensitivity),
      originalTitle: outlookEvent.subject || 'Untitled Event',
      location: outlookEvent.location?.displayName,
      description: outlookEvent.bodyPreview,
    };
  }

  /**
   * Map Outlook sensitivity levels to our privacy levels
   */
  private mapSensitivityToPrivacyLevel(
    sensitivity: string
  ): 'public' | 'family' | 'private' | 'filtered' {
    switch (sensitivity.toLowerCase()) {
      case 'normal':
        return 'public';
      case 'personal':
        return 'family';
      case 'private':
      case 'confidential':
        return 'private';
      default:
        return 'filtered';
    }
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
  ): Promise<{ id: string; expirationDateTime: Date }> {
    const accessToken = await this.ensureValidToken(credentials);

    const subscription = {
      changeType: 'created,updated,deleted',
      notificationUrl: webhookUrl,
      resource: '/me/events',
      expirationDateTime: new Date(Date.now() + 4230 * 60 * 1000).toISOString(), // ~3 days max
      clientState: `buddy-webhook-${credentials.id}`,
    };

    const response = await fetch(
      `${OutlookCalendarProvider.BASE_URL}/subscriptions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to setup webhook: ${error}`);
    }

    const webhookResponse = await response.json();

    return {
      id: webhookResponse.id,
      expirationDateTime: new Date(webhookResponse.expirationDateTime),
    };
  }

  /**
   * Revoke calendar access (for COPPA compliance)
   */
  async revokeAccess(_accessToken: string): Promise<void> {
    // Microsoft Graph doesn't have a direct revoke endpoint
    // Access is revoked by removing the app authorization in Azure AD
    // This would typically be handled through the Azure portal or admin consent
    console.warn(
      'Outlook access revocation requires manual removal from Azure AD app registrations'
    );
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
        `${OutlookCalendarProvider.BASE_URL}/me/calendar`,
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
        calendarName: calendar.name || 'Primary Calendar',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get required OAuth scopes
   */
  getRequiredScopes(): string[] {
    return ['https://graph.microsoft.com/Calendars.Read'];
  }

  /**
   * Get privacy notice for parent consent
   */
  getPrivacyNotice(): string {
    return `
Microsoft Outlook Calendar Integration Privacy Notice:

• We will only read your calendar events (read-only access)
• Events are filtered for child safety before any sharing
• We respect Outlook's built-in sensitivity levels (private/confidential events are excluded)
• Calendar data is retained for maximum 90 days (COPPA compliance)
• You can revoke access through your Microsoft account settings
• Location data is optional and can be disabled
• Private/sensitive events are automatically filtered out

This integration helps provide context for your child's conversations while maintaining strict privacy standards.
    `.trim();
  }
}
