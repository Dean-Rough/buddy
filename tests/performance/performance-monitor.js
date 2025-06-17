#!/usr/bin/env node

/**
 * Performance Monitoring Script for Onda Platform
 *
 * This script provides real-time performance monitoring during load tests
 * and can be used to track system metrics and identify bottlenecks.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      responses: 0,
      errors: 0,
      avgResponseTime: 0,
      responseTimes: [],
      errorRates: [],
      timestamp: Date.now(),
    };

    this.isMonitoring = false;
    this.logFile = path.join(
      __dirname,
      'reports',
      `perf-monitor-${Date.now()}.log`
    );
  }

  /**
   * Start monitoring performance metrics
   */
  start() {
    if (this.isMonitoring) {
      console.log('⚠️  Monitoring already started');
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Starting performance monitoring...');
    console.log(`📝 Logging to: ${this.logFile}`);

    // Ensure reports directory exists
    const reportsDir = path.dirname(this.logFile);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Start monitoring intervals
    this.startCPUMemoryMonitoring();
    this.startNetworkMonitoring();
    this.startDiskIOMonitoring();

    // Log initial state
    this.logMetrics('MONITORING_STARTED', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.isMonitoring) {
      console.log('⚠️  Monitoring not started');
      return;
    }

    this.isMonitoring = false;
    console.log('🛑 Stopping performance monitoring...');

    // Clear intervals
    if (this.cpuInterval) clearInterval(this.cpuInterval);
    if (this.networkInterval) clearInterval(this.networkInterval);
    if (this.diskInterval) clearInterval(this.diskInterval);

    // Log final metrics
    this.logMetrics('MONITORING_STOPPED', {
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - this.metrics.timestamp,
      summary: this.generateSummary(),
    });

    console.log('📊 Performance monitoring summary:');
    console.log(this.generateSummary());
  }

  /**
   * Monitor CPU and Memory usage
   */
  startCPUMemoryMonitoring() {
    this.cpuInterval = setInterval(() => {
      if (!this.isMonitoring) return;

      // Get memory usage
      const memUsage = process.memoryUsage();

      // Log system metrics (simplified for demo)
      const metrics = {
        timestamp: new Date().toISOString(),
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024), // MB
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024), // MB
        },
      };

      this.logMetrics('SYSTEM_METRICS', metrics);
    }, 5000); // Every 5 seconds
  }

  /**
   * Monitor network activity (simplified)
   */
  startNetworkMonitoring() {
    this.networkInterval = setInterval(() => {
      if (!this.isMonitoring) return;

      // In a real implementation, you'd monitor actual network metrics
      const networkMetrics = {
        timestamp: new Date().toISOString(),
        requests: this.metrics.requests,
        responses: this.metrics.responses,
        errorRate: this.calculateErrorRate(),
        avgResponseTime: this.calculateAvgResponseTime(),
      };

      this.logMetrics('NETWORK_METRICS', networkMetrics);
    }, 10000); // Every 10 seconds
  }

  /**
   * Monitor disk I/O (simplified)
   */
  startDiskIOMonitoring() {
    this.diskInterval = setInterval(() => {
      if (!this.isMonitoring) return;

      // Check log file size as a proxy for disk activity
      const logStats = fs.existsSync(this.logFile)
        ? fs.statSync(this.logFile)
        : null;

      const diskMetrics = {
        timestamp: new Date().toISOString(),
        logFileSize: logStats ? Math.round(logStats.size / 1024) : 0, // KB
      };

      this.logMetrics('DISK_METRICS', diskMetrics);
    }, 15000); // Every 15 seconds
  }

  /**
   * Record a request metric
   */
  recordRequest() {
    this.metrics.requests++;
  }

  /**
   * Record a response metric
   */
  recordResponse(responseTime, isError = false) {
    this.metrics.responses++;
    this.metrics.responseTimes.push(responseTime);

    if (isError) {
      this.metrics.errors++;
    }

    // Keep only last 1000 response times to prevent memory issues
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
    }
  }

  /**
   * Calculate current error rate
   */
  calculateErrorRate() {
    if (this.metrics.responses === 0) return 0;
    return (this.metrics.errors / this.metrics.responses) * 100;
  }

  /**
   * Calculate average response time
   */
  calculateAvgResponseTime() {
    if (this.metrics.responseTimes.length === 0) return 0;
    const sum = this.metrics.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.metrics.responseTimes.length);
  }

  /**
   * Generate performance summary
   */
  generateSummary() {
    const responseTimes = this.metrics.responseTimes
      .slice()
      .sort((a, b) => a - b);
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);

    return {
      totalRequests: this.metrics.requests,
      totalResponses: this.metrics.responses,
      totalErrors: this.metrics.errors,
      errorRate: `${this.calculateErrorRate().toFixed(2)}%`,
      avgResponseTime: `${this.calculateAvgResponseTime()}ms`,
      p95ResponseTime:
        responseTimes.length > 0 ? `${responseTimes[p95Index] || 0}ms` : '0ms',
      p99ResponseTime:
        responseTimes.length > 0 ? `${responseTimes[p99Index] || 0}ms` : '0ms',
      monitoringDuration: `${Math.round((Date.now() - this.metrics.timestamp) / 1000)}s`,
    };
  }

  /**
   * Log metrics to file
   */
  logMetrics(type, data) {
    const logEntry = {
      type,
      timestamp: new Date().toISOString(),
      data,
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    try {
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }
}

// CLI usage
if (require.main === module) {
  const monitor = new PerformanceMonitor();

  console.log('🔍 Performance Monitor for Onda Platform');
  console.log('=========================================');
  console.log('Commands:');
  console.log('  start  - Start monitoring');
  console.log('  stop   - Stop monitoring');
  console.log('  status - Show current status');
  console.log('');

  const command = process.argv[2];

  switch (command) {
    case 'start':
      monitor.start();

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT, stopping monitoring...');
        monitor.stop();
        process.exit(0);
      });

      // Keep process alive
      setInterval(() => {
        if (monitor.isMonitoring) {
          process.stdout.write('.');
        }
      }, 1000);
      break;

    case 'stop':
      monitor.stop();
      break;

    case 'status':
      console.log('📊 Current Status:', monitor.generateSummary());
      break;

    default:
      console.log('❌ Unknown command. Use: start, stop, or status');
      process.exit(1);
  }
}

module.exports = PerformanceMonitor;
