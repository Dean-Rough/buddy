import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  safetyMetrics,
  SafetyMetricType,
  SafetyAlertType,
  type SafetyAccuracyReport,
} from '../../lib/safety-metrics';

// Mock Prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    safetyMetric: {
      create: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
    },
    safetyAlert: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe('Safety Metrics System', () => {
  beforeEach(() => {
    // Clear any existing metrics/alerts
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Metric Recording', () => {
    test('should record safety evaluation correctly', async () => {
      const mockCreate = vi.fn().mockResolvedValue({});
      const { prisma } = await import('../../lib/prisma');
      (prisma.safetyMetric.create as any) = mockCreate;

      await safetyMetrics.recordEvaluation(
        true, // actualIsSafe
        true, // predictedIsSafe
        0, // severityLevel
        1500, // responseTime
        8, // childAge
        { testContext: 'unit-test' }
      );

      // Should record both classification result and response time
      expect(mockCreate).toHaveBeenCalledTimes(2);

      // Check classification metric
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metricType: SafetyMetricType.TRUE_NEGATIVE,
            value: 1,
            childAge: 8,
            severityLevel: 0,
            metadata: expect.objectContaining({
              actualIsSafe: true,
              predictedIsSafe: true,
              severityLevel: 0,
              testContext: 'unit-test',
            }),
          }),
        })
      );

      // Check response time metric
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metricType: SafetyMetricType.RESPONSE_TIME,
            value: 1500,
            childAge: 8,
          }),
        })
      );
    });

    test('should classify evaluation results correctly', async () => {
      const mockCreate = vi.fn().mockResolvedValue({});
      const { prisma } = await import('../../lib/prisma');
      (prisma.safetyMetric.create as any) = mockCreate;

      // Test all confusion matrix cases
      const testCases = [
        {
          actual: true,
          predicted: true,
          expected: SafetyMetricType.TRUE_NEGATIVE,
        },
        {
          actual: false,
          predicted: false,
          expected: SafetyMetricType.TRUE_POSITIVE,
        },
        {
          actual: true,
          predicted: false,
          expected: SafetyMetricType.FALSE_POSITIVE,
        },
        {
          actual: false,
          predicted: true,
          expected: SafetyMetricType.FALSE_NEGATIVE,
        },
      ];

      for (const testCase of testCases) {
        mockCreate.mockClear();

        await safetyMetrics.recordEvaluation(
          testCase.actual,
          testCase.predicted,
          1,
          1000
        );

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              metricType: testCase.expected,
            }),
          })
        );
      }
    });

    test('should record escalation accuracy', async () => {
      const mockCreate = vi.fn().mockResolvedValue({});
      const { prisma } = await import('../../lib/prisma');
      (prisma.safetyMetric.create as any) = mockCreate;

      // Test correct escalation (within tolerance)
      await safetyMetrics.recordEscalation(3, 3, 2000, 10);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metricType: SafetyMetricType.ESCALATION_CORRECT,
            metadata: expect.objectContaining({
              actualSeverity: 3,
              predictedSeverity: 3,
              accuracyDelta: 0,
            }),
          }),
        })
      );

      mockCreate.mockClear();

      // Test incorrect escalation (outside tolerance)
      await safetyMetrics.recordEscalation(1, 4, 2500, 9);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metricType: SafetyMetricType.ESCALATION_INCORRECT,
            metadata: expect.objectContaining({
              actualSeverity: 1,
              predictedSeverity: 4,
              accuracyDelta: 3,
            }),
          }),
        })
      );
    });

    test('should record system errors', async () => {
      const mockCreate = vi.fn().mockResolvedValue({});
      const { prisma } = await import('../../lib/prisma');
      (prisma.safetyMetric.create as any) = mockCreate;

      await safetyMetrics.recordError(
        'API_TIMEOUT',
        'Safety validation timed out after 30 seconds',
        7
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metricType: SafetyMetricType.SYSTEM_ERROR,
            value: 1,
            childAge: 7,
            metadata: expect.objectContaining({
              errorType: 'API_TIMEOUT',
              errorMessage: 'Safety validation timed out after 30 seconds',
            }),
          }),
        })
      );
    });
  });

  describe('Accuracy Report Generation', () => {
    test('should generate comprehensive accuracy report', async () => {
      const { prisma } = await import('../../lib/prisma');

      // Mock database responses
      const mockMetrics = [
        { metricType: SafetyMetricType.TRUE_POSITIVE, value: 1 },
        { metricType: SafetyMetricType.TRUE_POSITIVE, value: 1 },
        { metricType: SafetyMetricType.TRUE_NEGATIVE, value: 1 },
        { metricType: SafetyMetricType.TRUE_NEGATIVE, value: 1 },
        { metricType: SafetyMetricType.FALSE_POSITIVE, value: 1 },
        { metricType: SafetyMetricType.FALSE_NEGATIVE, value: 1 },
      ];

      const mockEscalationMetrics = [
        { metricType: SafetyMetricType.ESCALATION_CORRECT, value: 1 },
        { metricType: SafetyMetricType.ESCALATION_CORRECT, value: 1 },
        { metricType: SafetyMetricType.ESCALATION_INCORRECT, value: 1 },
      ];

      const mockResponseTimeMetrics = [
        { metricType: SafetyMetricType.RESPONSE_TIME, value: 1500 },
        { metricType: SafetyMetricType.RESPONSE_TIME, value: 2000 },
        { metricType: SafetyMetricType.RESPONSE_TIME, value: 1800 },
      ];

      (prisma.safetyMetric.findMany as any)
        .mockResolvedValueOnce(mockMetrics)
        .mockResolvedValueOnce(mockEscalationMetrics)
        .mockResolvedValueOnce(mockResponseTimeMetrics);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');
      const report = await safetyMetrics.generateAccuracyReport(
        startDate,
        endDate
      );

      // Verify report structure
      expect(report).toMatchObject({
        timeRange: {
          start: startDate,
          end: endDate,
        },
        totalEvaluations: 6,
        accuracy: expect.any(Number),
        precision: expect.any(Number),
        recall: expect.any(Number),
        f1Score: expect.any(Number),
        falsePositiveRate: expect.any(Number),
        falseNegativeRate: expect.any(Number),
        escalationAccuracy: expect.any(Number),
        averageResponseTime: expect.any(Number),
        performanceGrade: expect.stringMatching(/^[A-F]$/),
        recommendations: expect.any(Array),
      });

      // Verify calculated metrics
      expect(report.accuracy).toBe(4 / 6); // (TP + TN) / Total = (2 + 2) / 6
      expect(report.precision).toBe(2 / 3); // TP / (TP + FP) = 2 / (2 + 1)
      expect(report.recall).toBe(2 / 3); // TP / (TP + FN) = 2 / (2 + 1)
      expect(report.falsePositiveRate).toBe(1 / 3); // FP / (FP + TN) = 1 / (1 + 2)
      expect(report.falseNegativeRate).toBe(1 / 3); // FN / (FN + TP) = 1 / (1 + 2)
      expect(report.escalationAccuracy).toBe(2 / 3); // Correct / Total = 2 / 3
      expect(report.averageResponseTime).toBeCloseTo(1766.67, 1); // (1500 + 2000 + 1800) / 3
    });

    test('should handle empty datasets gracefully', async () => {
      const { prisma } = await import('../../lib/prisma');

      (prisma.safetyMetric.findMany as any).mockResolvedValue([]);

      const report = await safetyMetrics.generateAccuracyReport(
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(report.totalEvaluations).toBe(0);
      expect(report.accuracy).toBe(0);
      expect(report.precision).toBe(0);
      expect(report.recall).toBe(0);
      expect(report.escalationAccuracy).toBe(0);
      expect(report.averageResponseTime).toBe(0);
      expect(report.performanceGrade).toBe('F');
    });
  });

  describe('Performance Grading', () => {
    test('should assign correct performance grades', async () => {
      const { prisma } = await import('../../lib/prisma');

      // Test Grade A scenario (excellent performance)
      const excellentMetrics = [
        ...Array(95).fill({
          metricType: SafetyMetricType.TRUE_POSITIVE,
          value: 1,
        }),
        ...Array(95).fill({
          metricType: SafetyMetricType.TRUE_NEGATIVE,
          value: 1,
        }),
        ...Array(3).fill({
          metricType: SafetyMetricType.FALSE_POSITIVE,
          value: 1,
        }),
        ...Array(1).fill({
          metricType: SafetyMetricType.FALSE_NEGATIVE,
          value: 1,
        }),
      ];

      const excellentEscalations = Array(20).fill({
        metricType: SafetyMetricType.ESCALATION_CORRECT,
        value: 1,
      });

      const fastResponseTimes = Array(10).fill({
        metricType: SafetyMetricType.RESPONSE_TIME,
        value: 1500,
      });

      (prisma.safetyMetric.findMany as any)
        .mockResolvedValueOnce(excellentMetrics)
        .mockResolvedValueOnce(excellentEscalations)
        .mockResolvedValueOnce(fastResponseTimes);

      const report = await safetyMetrics.generateAccuracyReport(
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(report.performanceGrade).toBe('A');
      expect(report.accuracy).toBeGreaterThan(0.95);
      expect(report.falseNegativeRate).toBeLessThan(0.02);

      // Test Grade F scenario (poor performance)
      const poorMetrics = [
        ...Array(60).fill({
          metricType: SafetyMetricType.TRUE_POSITIVE,
          value: 1,
        }),
        ...Array(20).fill({
          metricType: SafetyMetricType.TRUE_NEGATIVE,
          value: 1,
        }),
        ...Array(20).fill({
          metricType: SafetyMetricType.FALSE_POSITIVE,
          value: 1,
        }),
        ...Array(10).fill({
          metricType: SafetyMetricType.FALSE_NEGATIVE,
          value: 1,
        }),
      ];

      const poorEscalations = [
        ...Array(5).fill({
          metricType: SafetyMetricType.ESCALATION_CORRECT,
          value: 1,
        }),
        ...Array(15).fill({
          metricType: SafetyMetricType.ESCALATION_INCORRECT,
          value: 1,
        }),
      ];

      const slowResponseTimes = Array(10).fill({
        metricType: SafetyMetricType.RESPONSE_TIME,
        value: 15000,
      });

      (prisma.safetyMetric.findMany as any)
        .mockResolvedValueOnce(poorMetrics)
        .mockResolvedValueOnce(poorEscalations)
        .mockResolvedValueOnce(slowResponseTimes);

      const poorReport = await safetyMetrics.generateAccuracyReport(
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(poorReport.performanceGrade).toBe('F');
      expect(poorReport.accuracy).toBeLessThan(0.85);
    });
  });

  describe('Alert Generation', () => {
    test('should generate alerts for high false positive rate', async () => {
      const mockCreate = vi.fn().mockResolvedValue({});
      const { prisma } = await import('../../lib/prisma');
      (prisma.safetyAlert.create as any) = mockCreate;

      // Record multiple false positives to trigger alert
      for (let i = 0; i < 15; i++) {
        await safetyMetrics.recordEvaluation(true, false, 1, 1000); // False positive
      }

      // Record some true classifications to establish baseline
      for (let i = 0; i < 5; i++) {
        await safetyMetrics.recordEvaluation(true, true, 0, 1000); // True negative
      }

      // The checkForAlerts should be called internally and create an alert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            alertType: SafetyAlertType.HIGH_FALSE_POSITIVE_RATE,
            severity: 'CRITICAL', // 15/20 = 75% false positive rate
            message: expect.stringContaining(
              'High false positive rate detected'
            ),
          }),
        })
      );
    });

    test('should generate critical alerts for false negatives', async () => {
      const mockCreate = vi.fn().mockResolvedValue({});
      const { prisma } = await import('../../lib/prisma');
      (prisma.safetyAlert.create as any) = mockCreate;

      // False negatives are more critical - even small amounts should trigger alerts
      for (let i = 0; i < 3; i++) {
        await safetyMetrics.recordEvaluation(false, true, 1, 1000); // False negative
      }

      for (let i = 0; i < 17; i++) {
        await safetyMetrics.recordEvaluation(true, true, 0, 1000); // True negative
      }

      // Should trigger critical alert for false negatives
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            alertType: SafetyAlertType.HIGH_FALSE_NEGATIVE_RATE,
            severity: 'CRITICAL',
            message: expect.stringContaining(
              'High false negative rate detected'
            ),
          }),
        })
      );
    });

    test('should generate alerts for performance degradation', async () => {
      const mockCreate = vi.fn().mockResolvedValue({});
      const { prisma } = await import('../../lib/prisma');
      (prisma.safetyAlert.create as any) = mockCreate;

      // Clear any existing metrics to isolate this test
      safetyMetrics['metrics'] = [];

      // Record only response time metrics without classifications that would trigger other alerts
      for (let i = 0; i < 15; i++) {
        await safetyMetrics['recordMetric']({
          id: `resp-test-${i}`,
          timestamp: new Date(),
          metricType: SafetyMetricType.RESPONSE_TIME,
          value: 12000, // 12 second response
        });
      }

      // Manually trigger alert check
      await safetyMetrics['checkForAlerts']();

      // Should find a performance degradation alert among the calls
      const performanceAlert = mockCreate.mock.calls.find(
        call =>
          call[0]?.data?.alertType === SafetyAlertType.PERFORMANCE_DEGRADATION
      );

      expect(performanceAlert).toBeDefined();
      expect(performanceAlert?.[0]).toEqual(
        expect.objectContaining({
          data: expect.objectContaining({
            alertType: SafetyAlertType.PERFORMANCE_DEGRADATION,
            severity: 'HIGH',
            message: expect.stringContaining(
              'Safety system response time degraded'
            ),
          }),
        })
      );
    });
  });

  describe('Performance Summary', () => {
    test('should provide dashboard performance summary', async () => {
      const { prisma } = await import('../../lib/prisma');

      // Mock data for last 24 hours
      (prisma.safetyMetric.findMany as any)
        .mockResolvedValueOnce([
          { metricType: SafetyMetricType.TRUE_POSITIVE, value: 1 },
          { metricType: SafetyMetricType.TRUE_NEGATIVE, value: 1 },
        ])
        .mockResolvedValueOnce([
          { metricType: SafetyMetricType.ESCALATION_CORRECT, value: 1 },
        ])
        .mockResolvedValueOnce([
          { metricType: SafetyMetricType.RESPONSE_TIME, value: 2000 },
        ]);

      const summary = await safetyMetrics.getPerformanceSummary();

      expect(summary).toMatchObject({
        accuracy: expect.any(Number),
        falsePositiveRate: expect.any(Number),
        falseNegativeRate: expect.any(Number),
        avgResponseTime: expect.any(Number),
        recentAlerts: expect.any(Number),
        performanceGrade: expect.stringMatching(/^[A-F]$/),
      });

      expect(summary.accuracy).toBeGreaterThanOrEqual(0);
      expect(summary.accuracy).toBeLessThanOrEqual(1);
      expect(summary.avgResponseTime).toBeGreaterThan(0);
    });
  });

  describe('Recommendation Generation', () => {
    test('should provide specific recommendations for poor performance', async () => {
      const { prisma } = await import('../../lib/prisma');

      // Create metrics that will trigger various recommendations
      const poorMetrics = [
        ...Array(50).fill({
          metricType: SafetyMetricType.TRUE_POSITIVE,
          value: 1,
        }),
        ...Array(30).fill({
          metricType: SafetyMetricType.TRUE_NEGATIVE,
          value: 1,
        }),
        ...Array(15).fill({
          metricType: SafetyMetricType.FALSE_POSITIVE,
          value: 1,
        }),
        ...Array(8).fill({
          metricType: SafetyMetricType.FALSE_NEGATIVE,
          value: 1,
        }),
      ];

      const poorEscalations = [
        ...Array(6).fill({
          metricType: SafetyMetricType.ESCALATION_CORRECT,
          value: 1,
        }),
        ...Array(4).fill({
          metricType: SafetyMetricType.ESCALATION_INCORRECT,
          value: 1,
        }),
      ];

      const slowResponseTimes = Array(5).fill({
        metricType: SafetyMetricType.RESPONSE_TIME,
        value: 8000,
      });

      (prisma.safetyMetric.findMany as any)
        .mockResolvedValueOnce(poorMetrics)
        .mockResolvedValueOnce(poorEscalations)
        .mockResolvedValueOnce(slowResponseTimes);

      const report = await safetyMetrics.generateAccuracyReport(
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(report.recommendations).toHaveLength(expect.any(Number));
      expect(report.recommendations.join(' ')).toMatch(
        /accuracy|false negative|false positive|response time/i
      );
    });

    test('should provide positive feedback for good performance', async () => {
      const { prisma } = await import('../../lib/prisma');

      // Create excellent performance metrics
      const excellentMetrics = [
        ...Array(96).fill({
          metricType: SafetyMetricType.TRUE_POSITIVE,
          value: 1,
        }),
        ...Array(96).fill({
          metricType: SafetyMetricType.TRUE_NEGATIVE,
          value: 1,
        }),
        ...Array(2).fill({
          metricType: SafetyMetricType.FALSE_POSITIVE,
          value: 1,
        }),
        ...Array(1).fill({
          metricType: SafetyMetricType.FALSE_NEGATIVE,
          value: 1,
        }),
      ];

      const excellentEscalations = Array(20).fill({
        metricType: SafetyMetricType.ESCALATION_CORRECT,
        value: 1,
      });

      const fastResponseTimes = Array(10).fill({
        metricType: SafetyMetricType.RESPONSE_TIME,
        value: 1500,
      });

      (prisma.safetyMetric.findMany as any)
        .mockResolvedValueOnce(excellentMetrics)
        .mockResolvedValueOnce(excellentEscalations)
        .mockResolvedValueOnce(fastResponseTimes);

      const report = await safetyMetrics.generateAccuracyReport(
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(report.recommendations).toContain(
        'Safety system is performing well. Continue monitoring and consider gradual improvements.'
      );
    });
  });
});
