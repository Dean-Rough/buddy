/**
 * Calendar Webhook Manager
 * Handles real-time calendar updates with COPPA-compliant processing
 * Supports Google and Outlook webhook subscriptions (Apple uses polling)
 */

import {
  CalendarCredentials,
  CalendarWebhook,
  CalendarProvider,
  CalendarEvent,
} from './types';
import { CalendarPrivacyFilter } from './privacy-filter';
import { GoogleCalendarProvider } from './providers/google-calendar';
import { OutlookCalendarProvider } from './providers/outlook-calendar';
import { AppleCalendarProvider } from './providers/apple-calendar';

interface WebhookPayload {
  credentialsId: string;
  provider: CalendarProvider;
  changeType: 'created' | 'updated' | 'deleted';
  eventId: string;
  resourceId?: string;
  timestamp: Date;
}

interface WebhookSubscriptionResult {
  success: boolean;
  webhookId?: string;
  expirationDate?: Date;
  error?: string;
}

/**
 * Manages calendar webhook subscriptions for real-time updates
 */
export class CalendarWebhookManager {
  private googleProvider: GoogleCalendarProvider;
  private outlookProvider: OutlookCalendarProvider;
  private appleProvider: AppleCalendarProvider;

  // Webhook endpoint base URL (would be configured via environment)
  private readonly webhookBaseUrl =
    process.env.CALENDAR_WEBHOOK_BASE_URL ||
    'https://buddy-ai.app/api/calendar/webhooks';

  constructor() {
    this.googleProvider = new GoogleCalendarProvider();
    this.outlookProvider = new OutlookCalendarProvider();
    this.appleProvider = new AppleCalendarProvider();
  }

  /**
   * Setup webhook subscription for calendar provider
   */
  async setupWebhookSubscription(
    credentials: CalendarCredentials,
    _parentClerkUserId: string
  ): Promise<WebhookSubscriptionResult> {
    try {
      const webhookUrl = `${this.webhookBaseUrl}/${credentials.provider}/${credentials.id}`;

      switch (credentials.provider) {
        case 'google':
          const googleResult = await this.googleProvider.setupWebhook(
            credentials,
            webhookUrl
          );

          await this.storeWebhookSubscription({
            calendarCredentialsId: credentials.id,
            provider: 'google',
            webhookUrl,
            externalWebhookId: googleResult.id,
            isActive: true,
          });

          return {
            success: true,
            webhookId: googleResult.id,
            expirationDate: googleResult.expiration,
          };

        case 'outlook':
          const outlookResult = await this.outlookProvider.setupWebhook(
            credentials,
            webhookUrl
          );

          await this.storeWebhookSubscription({
            calendarCredentialsId: credentials.id,
            provider: 'outlook',
            webhookUrl,
            externalWebhookId: outlookResult.id,
            isActive: true,
          });

          return {
            success: true,
            webhookId: outlookResult.id,
            expirationDate: outlookResult.expirationDateTime,
          };

        case 'apple':
          // Apple Calendar doesn't support webhooks, use polling instead
          const appleResult = await this.appleProvider.setupWebhook();

          return {
            success: false,
            error: appleResult.message,
          };

        default:
          return {
            success: false,
            error: `Unsupported provider: ${credentials.provider}`,
          };
      }
    } catch (error) {
      console.error('Failed to setup webhook subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process incoming webhook notification
   */
  async processWebhookNotification(
    provider: CalendarProvider,
    credentialsId: string,
    payload: any
  ): Promise<{
    success: boolean;
    eventsProcessed: number;
    error?: string;
  }> {
    try {
      // Validate webhook source
      const isValid = await this.validateWebhookSource(
        provider,
        credentialsId,
        payload
      );
      if (!isValid) {
        return {
          success: false,
          eventsProcessed: 0,
          error: 'Invalid webhook source',
        };
      }

      // Get calendar credentials
      const credentials = await this.getCalendarCredentials(credentialsId);
      if (!credentials) {
        return {
          success: false,
          eventsProcessed: 0,
          error: 'Calendar credentials not found',
        };
      }

      // Parse webhook payload based on provider
      const webhookData = this.parseWebhookPayload(provider, payload);

      // Process the calendar change
      const result = await this.processCalendarChange(credentials, webhookData);

      // Update webhook last triggered timestamp
      await this.updateWebhookLastTriggered(credentialsId);

      return result;
    } catch (error) {
      console.error('Failed to process webhook notification:', error);
      return {
        success: false,
        eventsProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Parse webhook payload based on provider format
   */
  private parseWebhookPayload(
    provider: CalendarProvider,
    payload: any
  ): WebhookPayload {
    const timestamp = new Date();

    switch (provider) {
      case 'google':
        // Google Calendar webhook format
        return {
          credentialsId: payload.resourceId || '',
          provider: 'google',
          changeType: 'updated', // Google sends generic updates
          eventId: payload.resourceId || '',
          resourceId: payload.resourceId,
          timestamp,
        };

      case 'outlook':
        // Microsoft Graph webhook format
        return {
          credentialsId: payload.clientState || '',
          provider: 'outlook',
          changeType: payload.changeType || 'updated',
          eventId: payload.resourceData?.id || '',
          timestamp,
        };

      default:
        throw new Error(`Unsupported webhook provider: ${provider}`);
    }
  }

  /**
   * Process calendar change from webhook
   */
  private async processCalendarChange(
    credentials: CalendarCredentials,
    _webhookData: WebhookPayload
  ): Promise<{ success: boolean; eventsProcessed: number; error?: string }> {
    try {
      // Sync recent events to capture the change
      const syncOptions = {
        maxResults: 50,
        timeMin: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Next 90 days
      };

      let syncResult;
      switch (credentials.provider) {
        case 'google':
          syncResult = await this.googleProvider.syncCalendarEvents(
            credentials,
            syncOptions
          );
          break;
        case 'outlook':
          syncResult = await this.outlookProvider.syncCalendarEvents(
            credentials,
            syncOptions
          );
          break;
        default:
          throw new Error(`Unsupported provider: ${credentials.provider}`);
      }

      if (!syncResult.success) {
        return {
          success: false,
          eventsProcessed: 0,
          error: syncResult.errors.join(', '),
        };
      }

      // Apply privacy filtering to new/updated events
      await this.reapplyPrivacyFiltering(credentials.parentClerkUserId);

      return {
        success: true,
        eventsProcessed: syncResult.eventsProcessed,
      };
    } catch (error) {
      return {
        success: false,
        eventsProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reapply privacy filtering after calendar changes
   */
  private async reapplyPrivacyFiltering(
    parentClerkUserId: string
  ): Promise<void> {
    try {
      // Get all events for this parent
      const events = await this.getAllParentEvents(parentClerkUserId);

      // Get family context for filtering options
      const familyContext = await this.getFamilyContext(parentClerkUserId);

      if (!familyContext) {
        console.warn('No family context found for privacy filtering');
        return;
      }

      // Apply privacy filtering
      const filteredEvents = CalendarPrivacyFilter.filterEventsForChild(
        events,
        {
          childAge: 10, // Would get from child account
          parentClerkUserId,
          allowLocationSharing:
            familyContext.privacySettings.allowLocationSharing,
          eventLookaheadDays: familyContext.privacySettings.eventLookaheadDays,
        }
      );

      // Update family calendar context with filtered events
      await this.updateFamilyCalendarContext(parentClerkUserId, filteredEvents);
    } catch (error) {
      console.error('Failed to reapply privacy filtering:', error);
    }
  }

  /**
   * Validate webhook source authenticity
   */
  private async validateWebhookSource(
    provider: CalendarProvider,
    credentialsId: string,
    payload: any
  ): Promise<boolean> {
    try {
      // Check if webhook subscription exists and is active
      const webhook = await this.getWebhookSubscription(credentialsId);

      if (!webhook || !webhook.isActive) {
        return false;
      }

      // Provider-specific validation
      switch (provider) {
        case 'google':
          // Google sends resource ID that should match our stored webhook
          return payload.resourceId === webhook.externalWebhookId;

        case 'outlook':
          // Outlook sends client state that should match our credentials ID
          return payload.clientState === `buddy-webhook-${credentialsId}`;

        default:
          return false;
      }
    } catch (error) {
      console.error('Webhook validation error:', error);
      return false;
    }
  }

  /**
   * Renew expiring webhook subscriptions
   */
  async renewExpiringWebhooks(): Promise<{
    renewed: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      renewed: 0,
      failed: 0,
      errors: [] as string[],
    };

    try {
      // Get webhooks expiring in the next 24 hours
      const expiringWebhooks = await this.getExpiringWebhooks();

      for (const webhook of expiringWebhooks) {
        try {
          const credentials = await this.getCalendarCredentials(
            webhook.calendarCredentialsId
          );

          if (!credentials) {
            result.failed++;
            result.errors.push(
              `Credentials not found for webhook ${webhook.id}`
            );
            continue;
          }

          // Setup new webhook subscription
          const renewResult = await this.setupWebhookSubscription(
            credentials,
            credentials.parentClerkUserId
          );

          if (renewResult.success) {
            // Deactivate old webhook
            await this.deactivateWebhook(webhook.id);
            result.renewed++;
          } else {
            result.failed++;
            result.errors.push(
              `Failed to renew webhook ${webhook.id}: ${renewResult.error}`
            );
          }
        } catch (error) {
          result.failed++;
          result.errors.push(
            `Error renewing webhook ${webhook.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      console.log(
        `Webhook renewal completed: ${result.renewed} renewed, ${result.failed} failed`
      );
      return result;
    } catch (error) {
      console.error('Webhook renewal process failed:', error);
      result.errors.push(
        error instanceof Error ? error.message : 'Unknown error'
      );
      return result;
    }
  }

  /**
   * Cleanup inactive webhook subscriptions
   */
  async cleanupInactiveWebhooks(): Promise<{
    cleaned: number;
    errors: string[];
  }> {
    const result = {
      cleaned: 0,
      errors: [] as string[],
    };

    try {
      const inactiveWebhooks = await this.getInactiveWebhooks();

      for (const webhook of inactiveWebhooks) {
        try {
          // Remove webhook subscription from provider
          await this.removeWebhookFromProvider(webhook);

          // Delete from database
          await this.deleteWebhookSubscription(webhook.id);

          result.cleaned++;
        } catch (error) {
          result.errors.push(
            `Failed to cleanup webhook ${webhook.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      return result;
    } catch (error) {
      console.error('Webhook cleanup failed:', error);
      result.errors.push(
        error instanceof Error ? error.message : 'Unknown error'
      );
      return result;
    }
  }

  // Database interaction methods (would be implemented with actual database)

  private async storeWebhookSubscription(
    webhook: Omit<CalendarWebhook, 'id' | 'createdAt' | 'lastTriggeredAt'>
  ): Promise<void> {
    console.log('Storing webhook subscription:', webhook);
  }

  private async getWebhookSubscription(
    _credentialsId: string
  ): Promise<CalendarWebhook | null> {
    return null; // Database lookup
  }

  private async getCalendarCredentials(
    _credentialsId: string
  ): Promise<CalendarCredentials | null> {
    return null; // Database lookup
  }

  private async updateWebhookLastTriggered(
    credentialsId: string
  ): Promise<void> {
    console.log('Updating webhook last triggered:', credentialsId);
  }

  private async getAllParentEvents(
    _parentClerkUserId: string
  ): Promise<CalendarEvent[]> {
    return []; // Database lookup
  }

  private async getFamilyContext(_parentClerkUserId: string): Promise<any> {
    return null; // Database lookup
  }

  private async updateFamilyCalendarContext(
    parentClerkUserId: string,
    events: CalendarEvent[]
  ): Promise<void> {
    console.log(
      'Updating family calendar context:',
      parentClerkUserId,
      events.length
    );
  }

  private async getExpiringWebhooks(): Promise<CalendarWebhook[]> {
    return []; // Database lookup for webhooks expiring in 24 hours
  }

  private async getInactiveWebhooks(): Promise<CalendarWebhook[]> {
    return []; // Database lookup for inactive webhooks
  }

  private async deactivateWebhook(webhookId: string): Promise<void> {
    console.log('Deactivating webhook:', webhookId);
  }

  private async deleteWebhookSubscription(webhookId: string): Promise<void> {
    console.log('Deleting webhook subscription:', webhookId);
  }

  private async removeWebhookFromProvider(
    webhook: CalendarWebhook
  ): Promise<void> {
    // Provider-specific webhook deletion logic
    console.log(
      'Removing webhook from provider:',
      webhook.provider,
      webhook.externalWebhookId
    );
  }
}
