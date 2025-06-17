/**
 * Safety Accuracy Monitoring System for Onda Platform
 *
 * This module tracks safety system performance metrics including:
 * - False positive rate (safe content flagged as unsafe)
 * - False negative rate (unsafe content not flagged)
 * - Escalation accuracy (correct severity assessment)
 * - Performance degradation detection
 * - Real-time alerting for safety issues
 */

import { prisma } from './prisma';

export interface SafetyMetric {
  id: string;
  timestamp: Date;
  metricType: SafetyMetricType;
  value: number;
  metadata?: Record<string, any>;
  childAge?: number;
  severityLevel?: number;
}

export enum SafetyMetricType {
  FALSE_POSITIVE = 'false_positive',
  FALSE_NEGATIVE = 'false_negative',
  TRUE_POSITIVE = 'true_positive',
  TRUE_NEGATIVE = 'true_negative',
  ESCALATION_CORRECT = 'escalation_correct',
  ESCALATION_INCORRECT = 'escalation_incorrect',
  RESPONSE_TIME = 'response_time',
  SYSTEM_ERROR = 'system_error',
}

export interface SafetyAccuracyReport {
  timeRange: {
    start: Date;
    end: Date;
  };
  totalEvaluations: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  escalationAccuracy: number;
  averageResponseTime: number;
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
}

export interface SafetyAlert {
  id: string;
  alertType: SafetyAlertType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  metrics: SafetyMetric[];
  timestamp: Date;
  resolved: boolean;
}

export enum SafetyAlertType {
  HIGH_FALSE_POSITIVE_RATE = 'high_false_positive_rate',
  HIGH_FALSE_NEGATIVE_RATE = 'high_false_negative_rate',
  POOR_ESCALATION_ACCURACY = 'poor_escalation_accuracy',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  SYSTEM_ERRORS = 'system_errors',
}

class SafetyMetricsManager {
  private static instance: SafetyMetricsManager;
  private metrics: SafetyMetric[] = [];
  private alerts: SafetyAlert[] = [];

  public static getInstance(): SafetyMetricsManager {
    if (!SafetyMetricsManager.instance) {
      SafetyMetricsManager.instance = new SafetyMetricsManager();
    }
    return SafetyMetricsManager.instance;
  }

  /**
   * Record a safety evaluation result
   */
  async recordEvaluation(
    actualIsSafe: boolean,
    predictedIsSafe: boolean,
    severityLevel: number,
    responseTime: number,
    childAge?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const timestamp = new Date();

    // Determine metric type based on confusion matrix
    let metricType: SafetyMetricType;
    if (actualIsSafe && predictedIsSafe) {
      metricType = SafetyMetricType.TRUE_NEGATIVE;
    } else if (!actualIsSafe && !predictedIsSafe) {
      metricType = SafetyMetricType.TRUE_POSITIVE;
    } else if (actualIsSafe && !predictedIsSafe) {
      metricType = SafetyMetricType.FALSE_POSITIVE;
    } else {
      metricType = SafetyMetricType.FALSE_NEGATIVE;
    }

    // Record the classification result
    await this.recordMetric({
      id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      metricType,
      value: 1,
      metadata: {
        actualIsSafe,
        predictedIsSafe,
        severityLevel,
        ...metadata,
      },
      childAge,
      severityLevel,
    });

    // Record response time
    await this.recordMetric({
      id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      metricType: SafetyMetricType.RESPONSE_TIME,
      value: responseTime,
      childAge,
    });

    // Check for alerts
    await this.checkForAlerts();
  }

  /**
   * Record an escalation accuracy result
   */
  async recordEscalation(
    actualSeverity: number,
    predictedSeverity: number,
    responseTime: number,
    childAge?: number
  ): Promise<void> {
    const isCorrect = Math.abs(actualSeverity - predictedSeverity) <= 1; // Allow 1 level tolerance

    await this.recordMetric({
      id: `esc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      metricType: isCorrect
        ? SafetyMetricType.ESCALATION_CORRECT
        : SafetyMetricType.ESCALATION_INCORRECT,
      value: 1,
      metadata: {
        actualSeverity,
        predictedSeverity,
        accuracyDelta: Math.abs(actualSeverity - predictedSeverity),
      },
      childAge,
      severityLevel: actualSeverity,
    });

    await this.recordMetric({
      id: `esc-resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      metricType: SafetyMetricType.RESPONSE_TIME,
      value: responseTime,
      childAge,
    });
  }

  /**
   * Record a system error
   */
  async recordError(
    errorType: string,
    errorMessage: string,
    childAge?: number
  ): Promise<void> {
    await this.recordMetric({
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      metricType: SafetyMetricType.SYSTEM_ERROR,
      value: 1,
      metadata: {
        errorType,
        errorMessage,
      },
      childAge,
    });
  }

  /**
   * Record a metric to both memory and database
   */
  private async recordMetric(metric: SafetyMetric): Promise<void> {
    // Store in memory for real-time analysis
    this.metrics.push(metric);

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Store in database for long-term analysis
    try {
      await prisma.safetyMetric.create({
        data: {
          id: metric.id,
          timestamp: metric.timestamp,
          metricType: metric.metricType,
          value: metric.value,
          metadata: metric.metadata || {},
          childAge: metric.childAge,
          severityLevel: metric.severityLevel,
        },
      });
    } catch (error) {
      console.error('Failed to store safety metric:', error);
    }
  }

  /**
   * Generate comprehensive accuracy report
   */
  async generateAccuracyReport(
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<SafetyAccuracyReport> {
    // Get metrics from database for the specified time range
    const metrics = await prisma.safetyMetric.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
        metricType: {
          in: [
            SafetyMetricType.TRUE_POSITIVE,
            SafetyMetricType.TRUE_NEGATIVE,
            SafetyMetricType.FALSE_POSITIVE,
            SafetyMetricType.FALSE_NEGATIVE,
          ],
        },
      },
    });

    const escalationMetrics = await prisma.safetyMetric.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
        metricType: {
          in: [
            SafetyMetricType.ESCALATION_CORRECT,
            SafetyMetricType.ESCALATION_INCORRECT,
          ],
        },
      },
    });

    const responseTimeMetrics = await prisma.safetyMetric.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
        metricType: SafetyMetricType.RESPONSE_TIME,
      },
    });

    // Calculate confusion matrix values
    const tp = metrics.filter(
      m => m.metricType === SafetyMetricType.TRUE_POSITIVE
    ).length;
    const tn = metrics.filter(
      m => m.metricType === SafetyMetricType.TRUE_NEGATIVE
    ).length;
    const fp = metrics.filter(
      m => m.metricType === SafetyMetricType.FALSE_POSITIVE
    ).length;
    const fn = metrics.filter(
      m => m.metricType === SafetyMetricType.FALSE_NEGATIVE
    ).length;

    const totalEvaluations = tp + tn + fp + fn;

    // Calculate performance metrics
    const accuracy = totalEvaluations > 0 ? (tp + tn) / totalEvaluations : 0;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1Score =
      precision + recall > 0
        ? (2 * (precision * recall)) / (precision + recall)
        : 0;
    const falsePositiveRate = fp + tn > 0 ? fp / (fp + tn) : 0;
    const falseNegativeRate = fn + tp > 0 ? fn / (fn + tp) : 0;

    // Calculate escalation accuracy
    const correctEscalations = escalationMetrics.filter(
      m => m.metricType === SafetyMetricType.ESCALATION_CORRECT
    ).length;
    const totalEscalations = escalationMetrics.length;
    const escalationAccuracy =
      totalEscalations > 0 ? correctEscalations / totalEscalations : 0;

    // Calculate average response time
    const totalResponseTime = responseTimeMetrics.reduce(
      (sum, m) => sum + m.value,
      0
    );
    const averageResponseTime =
      responseTimeMetrics.length > 0
        ? totalResponseTime / responseTimeMetrics.length
        : 0;

    // Determine performance grade
    const performanceGrade = this.calculatePerformanceGrade(
      accuracy,
      falsePositiveRate,
      falseNegativeRate,
      escalationAccuracy,
      averageResponseTime
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      accuracy,
      precision,
      recall,
      falsePositiveRate,
      falseNegativeRate,
      escalationAccuracy,
      averageResponseTime
    );

    return {
      timeRange: {
        start: startDate,
        end: endDate,
      },
      totalEvaluations,
      accuracy,
      precision,
      recall,
      f1Score,
      falsePositiveRate,
      falseNegativeRate,
      escalationAccuracy,
      averageResponseTime,
      performanceGrade,
      recommendations,
    };
  }

  /**
   * Check for performance degradation and generate alerts
   */
  private async checkForAlerts(): Promise<void> {
    const recentMetrics = this.metrics.filter(
      m => Date.now() - m.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    if (recentMetrics.length < 10) return; // Need sufficient data

    // Check false positive rate
    const falsePositives = recentMetrics.filter(
      m => m.metricType === SafetyMetricType.FALSE_POSITIVE
    ).length;
    const totalClassifications = recentMetrics.filter(m =>
      [
        SafetyMetricType.TRUE_POSITIVE,
        SafetyMetricType.TRUE_NEGATIVE,
        SafetyMetricType.FALSE_POSITIVE,
        SafetyMetricType.FALSE_NEGATIVE,
      ].includes(m.metricType)
    ).length;

    const falsePositiveRate =
      totalClassifications > 0 ? falsePositives / totalClassifications : 0;

    if (falsePositiveRate > 0.1) {
      // Alert if > 10% false positive rate
      await this.createAlert({
        alertType: SafetyAlertType.HIGH_FALSE_POSITIVE_RATE,
        severity: falsePositiveRate > 0.2 ? 'CRITICAL' : 'HIGH',
        message: `High false positive rate detected: ${(falsePositiveRate * 100).toFixed(1)}%`,
        metrics: recentMetrics.filter(
          m => m.metricType === SafetyMetricType.FALSE_POSITIVE
        ),
      });
    }

    // Check false negative rate
    const falseNegatives = recentMetrics.filter(
      m => m.metricType === SafetyMetricType.FALSE_NEGATIVE
    ).length;
    const falseNegativeRate =
      totalClassifications > 0 ? falseNegatives / totalClassifications : 0;

    if (falseNegativeRate > 0.05) {
      // Alert if > 5% false negative rate (more critical)
      await this.createAlert({
        alertType: SafetyAlertType.HIGH_FALSE_NEGATIVE_RATE,
        severity: 'CRITICAL',
        message: `High false negative rate detected: ${(falseNegativeRate * 100).toFixed(1)}%`,
        metrics: recentMetrics.filter(
          m => m.metricType === SafetyMetricType.FALSE_NEGATIVE
        ),
      });
    }

    // Check response time degradation
    const responseTimes = recentMetrics
      .filter(m => m.metricType === SafetyMetricType.RESPONSE_TIME)
      .map(m => m.value);

    if (responseTimes.length > 0) {
      const avgResponseTime =
        responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length;

      if (avgResponseTime > 10000) {
        // Alert if average > 10 seconds
        await this.createAlert({
          alertType: SafetyAlertType.PERFORMANCE_DEGRADATION,
          severity: avgResponseTime > 20000 ? 'CRITICAL' : 'HIGH',
          message: `Safety system response time degraded: ${(avgResponseTime / 1000).toFixed(2)}s average`,
          metrics: recentMetrics.filter(
            m => m.metricType === SafetyMetricType.RESPONSE_TIME
          ),
        });
      }
    }

    // Check system error rate
    const errors = recentMetrics.filter(
      m => m.metricType === SafetyMetricType.SYSTEM_ERROR
    ).length;
    const errorRate =
      recentMetrics.length > 0 ? errors / recentMetrics.length : 0;

    if (errorRate > 0.05) {
      // Alert if > 5% error rate
      await this.createAlert({
        alertType: SafetyAlertType.SYSTEM_ERRORS,
        severity: errorRate > 0.1 ? 'CRITICAL' : 'HIGH',
        message: `High system error rate detected: ${(errorRate * 100).toFixed(1)}%`,
        metrics: recentMetrics.filter(
          m => m.metricType === SafetyMetricType.SYSTEM_ERROR
        ),
      });
    }
  }

  /**
   * Create and store an alert
   */
  private async createAlert(alertData: {
    alertType: SafetyAlertType;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    metrics: SafetyMetric[];
  }): Promise<void> {
    const alert: SafetyAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData,
    };

    this.alerts.push(alert);

    // Store in database
    try {
      await prisma.safetyAlert.create({
        data: {
          id: alert.id,
          alertType: alert.alertType,
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.timestamp,
          resolved: alert.resolved,
          metricIds: alert.metrics.map(m => m.id),
        },
      });
    } catch (error) {
      console.error('Failed to store safety alert:', error);
    }

    // Send notification (implement based on your notification system)
    await this.sendAlert(alert);
  }

  /**
   * Send alert notification
   */
  private async sendAlert(alert: SafetyAlert): Promise<void> {
    // This would integrate with your notification system
    // For now, just log the alert
    console.warn(`🚨 SAFETY ALERT [${alert.severity}]: ${alert.message}`);

    // In production, you might:
    // - Send email to safety team
    // - Post to Slack/Discord
    // - Update monitoring dashboard
    // - Log to external monitoring service
  }

  /**
   * Calculate overall performance grade
   */
  private calculatePerformanceGrade(
    accuracy: number,
    falsePositiveRate: number,
    falseNegativeRate: number,
    escalationAccuracy: number,
    avgResponseTime: number
  ): 'A' | 'B' | 'C' | 'D' | 'F' {
    // If no data available, return F
    if (accuracy === 0 && falsePositiveRate === 0 && falseNegativeRate === 0) {
      return 'F';
    }

    let score = 0;

    // Accuracy (40% of score)
    if (accuracy >= 0.95) score += 40;
    else if (accuracy >= 0.9) score += 35;
    else if (accuracy >= 0.85) score += 30;
    else if (accuracy >= 0.8) score += 20;
    else if (accuracy > 0) score += 10;

    // False negative rate (30% of score - most critical)
    if (falseNegativeRate <= 0.01) score += 30;
    else if (falseNegativeRate <= 0.02) score += 25;
    else if (falseNegativeRate <= 0.05) score += 15;
    else if (falseNegativeRate <= 0.1) score += 5;
    else score += 0;

    // False positive rate (15% of score)
    if (falsePositiveRate <= 0.05) score += 15;
    else if (falsePositiveRate <= 0.1) score += 12;
    else if (falsePositiveRate <= 0.15) score += 8;
    else if (falsePositiveRate <= 0.2) score += 4;
    else score += 0;

    // Escalation accuracy (10% of score)
    if (escalationAccuracy >= 0.9) score += 10;
    else if (escalationAccuracy >= 0.8) score += 8;
    else if (escalationAccuracy >= 0.7) score += 6;
    else if (escalationAccuracy >= 0.6) score += 3;
    else score += 0;

    // Response time (5% of score)
    if (avgResponseTime <= 2000) score += 5;
    else if (avgResponseTime <= 5000) score += 4;
    else if (avgResponseTime <= 10000) score += 2;
    else score += 0;

    // Convert to letter grade
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    accuracy: number,
    precision: number,
    recall: number,
    falsePositiveRate: number,
    falseNegativeRate: number,
    escalationAccuracy: number,
    avgResponseTime: number
  ): string[] {
    const recommendations: string[] = [];

    if (accuracy < 0.95) {
      recommendations.push(
        'Overall accuracy is below target (95%). Consider retraining the safety model with more diverse data.'
      );
    }

    if (falseNegativeRate > 0.02) {
      recommendations.push(
        'False negative rate is too high. This is critical for child safety. Increase model sensitivity and add more negative examples to training data.'
      );
    }

    if (falsePositiveRate > 0.1) {
      recommendations.push(
        'False positive rate is high. This may frustrate users. Consider fine-tuning classification thresholds or improving positive example quality.'
      );
    }

    if (precision < 0.85) {
      recommendations.push(
        'Low precision indicates many false positives. Review and improve positive classification criteria.'
      );
    }

    if (recall < 0.9) {
      recommendations.push(
        'Low recall indicates missing unsafe content. This is a safety risk. Expand negative content detection patterns.'
      );
    }

    if (escalationAccuracy < 0.8) {
      recommendations.push(
        'Escalation accuracy is low. Review severity level classification logic and parent notification thresholds.'
      );
    }

    if (avgResponseTime > 5000) {
      recommendations.push(
        'Response time is too slow. Consider optimizing the AI inference pipeline or adding response caching.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Safety system is performing well. Continue monitoring and consider gradual improvements.'
      );
    }

    return recommendations;
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(hours = 24): SafetyAlert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  /**
   * Get performance summary for dashboard
   */
  async getPerformanceSummary(): Promise<{
    accuracy: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
    avgResponseTime: number;
    recentAlerts: number;
    performanceGrade: string;
  }> {
    const report = await this.generateAccuracyReport(
      new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );

    const recentAlerts = this.getRecentAlerts().filter(a => !a.resolved).length;

    return {
      accuracy: Math.round(report.accuracy * 100) / 100,
      falsePositiveRate: Math.round(report.falsePositiveRate * 100) / 100,
      falseNegativeRate: Math.round(report.falseNegativeRate * 100) / 100,
      avgResponseTime: Math.round(report.averageResponseTime),
      recentAlerts,
      performanceGrade: report.performanceGrade,
    };
  }
}

// Export singleton instance
export const safetyMetrics = SafetyMetricsManager.getInstance();

// Export types and utility functions
export { SafetyMetricsManager };
