/**
 * COPPA Compliance Manager for Calendar Integration
 * Ensures all calendar data handling meets COPPA requirements
 * Implements data minimization, retention limits, and parental controls
 */

import { CalendarEvent, PrivacyFilterRule } from './types';

interface COPPAComplianceConfig {
  maxDataRetentionDays: number; // Maximum 90 days for child data
  encryptionRequired: boolean;
  parentConsentRequired: boolean;
  dataMinimizationEnabled: boolean;
  auditLoggingEnabled: boolean;
}

interface DataRetentionPolicy {
  calendarEvents: number; // Days to retain calendar events
  syncLogs: number; // Days to retain sync logs
  auditLogs: number; // Days to retain audit logs (longer for compliance)
  credentials: number; // Days to retain inactive credentials
}

interface COPPAViolation {
  type:
    | 'data_retention'
    | 'pii_exposure'
    | 'parental_consent'
    | 'data_minimization';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedRecords: string[];
  detectedAt: Date;
  requiresAction: boolean;
}

interface COPPAAuditEntry {
  id: string;
  parentClerkUserId: string;
  childAccountIds: string[];
  action: string;
  dataType: 'calendar_event' | 'credentials' | 'privacy_filter' | 'consent';
  dataIds: string[];
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string; // Hashed for privacy
  complianceNotes?: string;
}

/**
 * COPPA Compliance Manager
 * Enforces child privacy protection laws for calendar integration
 */
export class COPPAComplianceManager {
  private config: COPPAComplianceConfig = {
    maxDataRetentionDays: 90,
    encryptionRequired: true,
    parentConsentRequired: true,
    dataMinimizationEnabled: true,
    auditLoggingEnabled: true,
  };

  private retentionPolicy: DataRetentionPolicy = {
    calendarEvents: 90, // COPPA maximum
    syncLogs: 30,
    auditLogs: 2555, // 7 years for legal compliance
    credentials: 30, // Inactive credentials
  };

  /**
   * Validate calendar integration setup for COPPA compliance
   */
  async validateCalendarSetup(
    parentClerkUserId: string,
    childAccountIds: string[],
    _calendarProvider: string
  ): Promise<{
    isCompliant: boolean;
    violations: COPPAViolation[];
    requiredActions: string[];
  }> {
    const violations: COPPAViolation[] = [];
    const requiredActions: string[] = [];

    try {
      // Check parental consent
      const hasConsent = await this.verifyParentalConsent(
        parentClerkUserId,
        _calendarProvider
      );
      if (!hasConsent) {
        violations.push({
          type: 'parental_consent',
          severity: 'critical',
          description: 'Parental consent not recorded for calendar integration',
          affectedRecords: [parentClerkUserId],
          detectedAt: new Date(),
          requiresAction: true,
        });
        requiredActions.push(
          'Obtain explicit parental consent before enabling calendar integration'
        );
      }

      // Validate child account ages
      for (const childAccountId of childAccountIds) {
        const childAge = await this.getChildAge(childAccountId);
        if (childAge !== null && childAge < 13) {
          // Additional protection for children under 13
          const hasEnhancedConsent = await this.verifyEnhancedParentalConsent(
            parentClerkUserId,
            childAccountId
          );
          if (!hasEnhancedConsent) {
            violations.push({
              type: 'parental_consent',
              severity: 'critical',
              description: `Enhanced parental consent required for child under 13 (age: ${childAge})`,
              affectedRecords: [childAccountId],
              detectedAt: new Date(),
              requiresAction: true,
            });
            requiredActions.push(
              `Obtain enhanced parental consent for child account ${childAccountId}`
            );
          }
        }
      }

      // Check data minimization
      const privacyRules = await this.getPrivacyFilterRules(parentClerkUserId);
      if (!this.validateDataMinimization(privacyRules)) {
        violations.push({
          type: 'data_minimization',
          severity: 'medium',
          description:
            'Privacy filtering rules do not meet data minimization requirements',
          affectedRecords: [parentClerkUserId],
          detectedAt: new Date(),
          requiresAction: true,
        });
        requiredActions.push(
          'Enable stricter privacy filtering to minimize child data exposure'
        );
      }

      return {
        isCompliant: violations.length === 0,
        violations,
        requiredActions,
      };
    } catch (error) {
      console.error('COPPA validation failed:', error);
      violations.push({
        type: 'data_retention',
        severity: 'high',
        description: 'Unable to complete COPPA compliance validation',
        affectedRecords: [parentClerkUserId],
        detectedAt: new Date(),
        requiresAction: true,
      });

      return {
        isCompliant: false,
        violations,
        requiredActions: ['Complete COPPA compliance validation'],
      };
    }
  }

  /**
   * Audit calendar events for COPPA compliance
   */
  async auditCalendarEvents(
    events: CalendarEvent[],
    _parentClerkUserId: string
  ): Promise<{
    compliantEvents: CalendarEvent[];
    violations: COPPAViolation[];
    sanitizedEvents: CalendarEvent[];
  }> {
    const violations: COPPAViolation[] = [];
    const compliantEvents: CalendarEvent[] = [];
    const sanitizedEvents: CalendarEvent[] = [];

    for (const event of events) {
      const auditResult = await this.auditSingleEvent(
        event,
        _parentClerkUserId
      );

      if (auditResult.isCompliant) {
        compliantEvents.push(event);
      } else {
        violations.push(...auditResult.violations);

        // Attempt to sanitize the event
        const sanitized = await this.sanitizeEventForCompliance(event);
        if (sanitized) {
          sanitizedEvents.push(sanitized);
        }
      }
    }

    // Log audit activity
    await this.logAuditActivity({
      parentClerkUserId: _parentClerkUserId,
      childAccountIds: [], // Would be populated with actual child IDs
      action: 'calendar_events_audit',
      dataType: 'calendar_event',
      dataIds: events.map(e => e.id),
      timestamp: new Date(),
      complianceNotes: `Audited ${events.length} events, found ${violations.length} violations`,
    });

    return {
      compliantEvents,
      violations,
      sanitizedEvents,
    };
  }

  /**
   * Enforce data retention policies
   */
  async enforceDataRetention(): Promise<{
    deletedEvents: number;
    deletedCredentials: number;
    deletedLogs: number;
    violations: COPPAViolation[];
  }> {
    const result = {
      deletedEvents: 0,
      deletedCredentials: 0,
      deletedLogs: 0,
      violations: [] as COPPAViolation[],
    };

    try {
      // Delete expired calendar events
      const eventCutoff = new Date(
        Date.now() - this.retentionPolicy.calendarEvents * 24 * 60 * 60 * 1000
      );
      result.deletedEvents = await this.deleteExpiredEvents(eventCutoff);

      // Delete expired credentials
      const credentialsCutoff = new Date(
        Date.now() - this.retentionPolicy.credentials * 24 * 60 * 60 * 1000
      );
      result.deletedCredentials =
        await this.deleteExpiredCredentials(credentialsCutoff);

      // Delete expired sync logs (but keep audit logs longer)
      const syncLogsCutoff = new Date(
        Date.now() - this.retentionPolicy.syncLogs * 24 * 60 * 60 * 1000
      );
      result.deletedLogs = await this.deleteExpiredSyncLogs(syncLogsCutoff);

      // Check for retention violations
      const retentionViolations = await this.checkRetentionViolations();
      result.violations = retentionViolations;

      // Log retention enforcement
      await this.logAuditActivity({
        parentClerkUserId: 'system',
        childAccountIds: [],
        action: 'data_retention_enforcement',
        dataType: 'calendar_event',
        dataIds: [],
        timestamp: new Date(),
        complianceNotes: `Deleted ${result.deletedEvents} events, ${result.deletedCredentials} credentials, ${result.deletedLogs} logs`,
      });

      return result;
    } catch (error) {
      console.error('Data retention enforcement failed:', error);
      result.violations.push({
        type: 'data_retention',
        severity: 'high',
        description: 'Failed to enforce data retention policies',
        affectedRecords: [],
        detectedAt: new Date(),
        requiresAction: true,
      });

      return result;
    }
  }

  /**
   * Handle parental data access request (COPPA requirement)
   */
  async handleParentalDataRequest(
    parentClerkUserId: string,
    requestType: 'view' | 'export' | 'delete',
    _childAccountIds?: string[]
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // Verify parental authorization
      const isAuthorized =
        await this.verifyParentalAuthorization(parentClerkUserId);
      if (!isAuthorized) {
        return {
          success: false,
          error: 'Unauthorized: Parent verification required',
        };
      }

      switch (requestType) {
        case 'view':
          const childData = await this.getChildCalendarData(
            parentClerkUserId,
            _childAccountIds
          );
          return {
            success: true,
            data: {
              calendarEvents: childData.events,
              privacySettings: childData.settings,
              syncHistory: childData.syncHistory,
            },
          };

        case 'export':
          const exportData = await this.exportChildCalendarData(
            parentClerkUserId,
            _childAccountIds
          );
          return {
            success: true,
            data: exportData,
          };

        case 'delete':
          const deleteResult = await this.deleteChildCalendarData(
            parentClerkUserId,
            _childAccountIds
          );
          return {
            success: true,
            data: {
              deletedEvents: deleteResult.events,
              deletedCredentials: deleteResult.credentials,
              deletedLogs: deleteResult.logs,
            },
          };

        default:
          return {
            success: false,
            error: 'Invalid request type',
          };
      }
    } catch (error) {
      console.error('Parental data request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate COPPA compliance report
   */
  async generateComplianceReport(_parentClerkUserId?: string): Promise<{
    overallCompliance: 'compliant' | 'minor_issues' | 'major_violations';
    violations: COPPAViolation[];
    dataRetentionStatus: any;
    consentStatus: any;
    recommendations: string[];
  }> {
    try {
      // Check data retention compliance
      const retentionStatus = await this.checkRetentionCompliance();

      // Check consent status
      const consentStatus =
        await this.checkConsentCompliance(_parentClerkUserId);

      // Get all violations
      const allViolations = await this.getAllViolations(_parentClerkUserId);

      // Determine overall compliance status
      const criticalViolations = allViolations.filter(
        v => v.severity === 'critical'
      );
      const highViolations = allViolations.filter(v => v.severity === 'high');

      let overallCompliance: 'compliant' | 'minor_issues' | 'major_violations';
      if (criticalViolations.length > 0 || highViolations.length > 2) {
        overallCompliance = 'major_violations';
      } else if (allViolations.length > 0) {
        overallCompliance = 'minor_issues';
      } else {
        overallCompliance = 'compliant';
      }

      // Generate recommendations
      const recommendations = this.generateRecommendations(allViolations);

      return {
        overallCompliance,
        violations: allViolations,
        dataRetentionStatus: retentionStatus,
        consentStatus,
        recommendations,
      };
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      return {
        overallCompliance: 'major_violations',
        violations: [
          {
            type: 'data_retention',
            severity: 'critical',
            description: 'Unable to generate compliance report',
            affectedRecords: [],
            detectedAt: new Date(),
            requiresAction: true,
          },
        ],
        dataRetentionStatus: null,
        consentStatus: null,
        recommendations: [
          'Complete system health check',
          'Verify COPPA compliance systems',
        ],
      };
    }
  }

  // Private helper methods

  private async auditSingleEvent(
    event: CalendarEvent,
    _parentClerkUserId: string
  ): Promise<{
    isCompliant: boolean;
    violations: COPPAViolation[];
  }> {
    const violations: COPPAViolation[] = [];

    // Check for PII in event data
    if (
      this.containsPII(event.title) ||
      this.containsPII(event.description || '')
    ) {
      violations.push({
        type: 'pii_exposure',
        severity: 'high',
        description:
          'Calendar event contains personally identifiable information',
        affectedRecords: [event.id],
        detectedAt: new Date(),
        requiresAction: true,
      });
    }

    // Check data age
    const eventAge = Date.now() - event.createdAt.getTime();
    const maxAge = this.retentionPolicy.calendarEvents * 24 * 60 * 60 * 1000;

    if (eventAge > maxAge) {
      violations.push({
        type: 'data_retention',
        severity: 'medium',
        description: 'Calendar event exceeds maximum retention period',
        affectedRecords: [event.id],
        detectedAt: new Date(),
        requiresAction: true,
      });
    }

    return {
      isCompliant: violations.length === 0,
      violations,
    };
  }

  private async sanitizeEventForCompliance(
    _event: CalendarEvent
  ): Promise<CalendarEvent | null> {
    try {
      const sanitized = { ..._event };

      // Remove PII
      sanitized.title = this.removePII(sanitized.title);
      sanitized.description = sanitized.description
        ? this.removePII(sanitized.description)
        : undefined;
      sanitized.location = undefined; // Remove location for privacy

      // Update privacy level
      sanitized.privacyLevel = 'filtered';
      sanitized.isChildRelevant = false; // Mark as not child-relevant if had violations

      return sanitized;
    } catch (error) {
      console.error('Failed to sanitize event:', error);
      return null;
    }
  }

  private containsPII(text: string): boolean {
    const piiPatterns = [
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
      /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd)\b/i, // Addresses
      /\b\d{9}\b/, // SSN-like patterns
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card patterns
    ];

    return piiPatterns.some(pattern => pattern.test(text));
  }

  private removePII(text: string): string {
    return text
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]')
      .replace(
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        '[EMAIL]'
      )
      .replace(
        /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd)\b/gi,
        '[ADDRESS]'
      )
      .replace(/\b\d{9}\b/g, '[SSN]')
      .replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, '[CARD]');
  }

  private generateRecommendations(_violations: COPPAViolation[]): string[] {
    const recommendations: string[] = [];

    if (_violations.some(v => v.type === 'parental_consent')) {
      recommendations.push('Implement enhanced parental consent verification');
    }

    if (_violations.some(v => v.type === 'data_retention')) {
      recommendations.push('Implement automated data retention enforcement');
    }

    if (_violations.some(v => v.type === 'pii_exposure')) {
      recommendations.push('Enhance PII detection and filtering systems');
    }

    if (_violations.some(v => v.type === 'data_minimization')) {
      recommendations.push('Strengthen privacy filtering rules');
    }

    return recommendations;
  }

  // Database interaction methods (would be implemented with actual database)

  private async verifyParentalConsent(
    _parentClerkUserId: string,
    _provider: string
  ): Promise<boolean> {
    return true; // Database lookup
  }

  private async verifyEnhancedParentalConsent(
    _parentClerkUserId: string,
    _childAccountId: string
  ): Promise<boolean> {
    return true; // Database lookup
  }

  private async getChildAge(_childAccountId: string): Promise<number | null> {
    return null; // Database lookup
  }

  private async getPrivacyFilterRules(
    _parentClerkUserId: string
  ): Promise<PrivacyFilterRule[]> {
    return []; // Database lookup
  }

  private validateDataMinimization(_rules: PrivacyFilterRule[]): boolean {
    return _rules.length > 0 && _rules.some(rule => rule.isActive);
  }

  private async logAuditActivity(
    _entry: Omit<COPPAAuditEntry, 'id'>
  ): Promise<void> {
    console.log('Logging audit activity:', _entry);
  }

  private async deleteExpiredEvents(_cutoffDate: Date): Promise<number> {
    return 0; // Database operation
  }

  private async deleteExpiredCredentials(_cutoffDate: Date): Promise<number> {
    return 0; // Database operation
  }

  private async deleteExpiredSyncLogs(_cutoffDate: Date): Promise<number> {
    return 0; // Database operation
  }

  private async checkRetentionViolations(): Promise<COPPAViolation[]> {
    return []; // Database lookup
  }

  private async checkRetentionCompliance(): Promise<any> {
    return null; // Database lookup
  }

  private async checkConsentCompliance(
    _parentClerkUserId?: string
  ): Promise<any> {
    return null; // Database lookup
  }

  private async getAllViolations(
    _parentClerkUserId?: string
  ): Promise<COPPAViolation[]> {
    return []; // Database lookup
  }

  private async verifyParentalAuthorization(
    _parentClerkUserId: string
  ): Promise<boolean> {
    return true; // Verify parent identity
  }

  private async getChildCalendarData(
    _parentClerkUserId: string,
    _childAccountIds?: string[]
  ): Promise<any> {
    return null; // Database lookup
  }

  private async exportChildCalendarData(
    _parentClerkUserId: string,
    _childAccountIds?: string[]
  ): Promise<any> {
    return null; // Database export
  }

  private async deleteChildCalendarData(
    _parentClerkUserId: string,
    _childAccountIds?: string[]
  ): Promise<any> {
    return { events: 0, credentials: 0, logs: 0 }; // Database deletion
  }
}
