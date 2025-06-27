'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface SafetyMetrics {
  totalMessages: number;
  flaggedMessages: number;
  falsePositives: number;
  manualOverrides: number;
  averageConfidence: number;
  topConcerns: Array<{
    category: string;
    count: number;
    accuracy: number;
  }>;
}

interface SafetyEvent {
  id: string;
  timestamp: string;
  childName: string;
  message: string;
  severity: number;
  action: string;
  confidence: number;
  wasOverridden: boolean;
  category: string;
}

export default function TestingSafetyDashboard() {
  const [metrics, setMetrics] = useState<SafetyMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<SafetyEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SafetyEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSafetyData();
    // Refresh every 30 seconds during testing
    const interval = setInterval(fetchSafetyData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSafetyData = async () => {
    try {
      setLoading(true);
      const [metricsRes, eventsRes] = await Promise.all([
        fetch('/api/testing/safety-metrics'),
        fetch('/api/testing/safety-events'),
      ]);

      const metricsData = await metricsRes.json();
      const eventsData = await eventsRes.json();

      setMetrics(metricsData);
      setRecentEvents(eventsData);
    } catch (error) {
      console.error('Failed to fetch safety data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (eventId: string, reason: string) => {
    try {
      await fetch('/api/testing/safety-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, reason }),
      });
      fetchSafetyData(); // Refresh data
    } catch (error) {
      console.error('Failed to override event:', error);
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 0: return 'bg-green-100 text-green-800';
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-orange-100 text-orange-800';
      case 4: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityLabel = (severity: number) => {
    switch (severity) {
      case 0: return 'Safe';
      case 1: return 'Monitor';
      case 2: return 'Guide';
      case 3: return 'Support';
      case 4: return 'Emergency';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className=\"flex items-center justify-center h-64\">
        <div className=\"text-lg\">Loading safety dashboard...</div>
      </div>
    );
  }

  return (
    <div className=\"space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <h1 className=\"text-2xl font-bold\">Live Testing Safety Dashboard</h1>
        <Button onClick={fetchSafetyData}>Refresh Data</Button>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className=\"grid grid-cols-1 md:grid-cols-5 gap-4\">
          <Card>
            <CardHeader className=\"pb-2\">
              <CardTitle className=\"text-sm\">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"text-2xl font-bold\">{metrics.totalMessages}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className=\"pb-2\">
              <CardTitle className=\"text-sm\">Flagged Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"text-2xl font-bold text-orange-600\">
                {metrics.flaggedMessages}
              </div>
              <div className=\"text-xs text-gray-500\">
                {((metrics.flaggedMessages / metrics.totalMessages) * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className=\"pb-2\">
              <CardTitle className=\"text-sm\">False Positives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"text-2xl font-bold text-red-600\">
                {metrics.falsePositives}
              </div>
              <div className=\"text-xs text-gray-500\">
                {((metrics.falsePositives / metrics.flaggedMessages) * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className=\"pb-2\">
              <CardTitle className=\"text-sm\">Manual Overrides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"text-2xl font-bold text-blue-600\">
                {metrics.manualOverrides}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className=\"pb-2\">
              <CardTitle className=\"text-sm\">Avg Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"text-2xl font-bold\">
                {metrics.averageConfidence.toFixed(0)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Alerts */}
      {metrics && (
        <div className=\"space-y-2\">
          {metrics.falsePositives / metrics.flaggedMessages > 0.2 && (
            <Alert className=\"border-orange-200 bg-orange-50\">
              <AlertDescription>
                ⚠️ High false positive rate detected: {((metrics.falsePositives / metrics.flaggedMessages) * 100).toFixed(1)}%. 
                Consider adjusting safety thresholds.
              </AlertDescription>
            </Alert>
          )}
          
          {metrics.averageConfidence < 70 && (
            <Alert className=\"border-yellow-200 bg-yellow-50\">
              <AlertDescription>
                ⚠️ Low confidence in safety decisions: {metrics.averageConfidence.toFixed(0)}%. 
                System may need recalibration.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Recent Safety Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Safety Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className=\"space-y-3\">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className=\"border rounded-lg p-4 hover:bg-gray-50 cursor-pointer\"
                onClick={() => setSelectedEvent(event)}
              >
                <div className=\"flex items-center justify-between mb-2\">
                  <div className=\"flex items-center space-x-2\">
                    <Badge className={getSeverityColor(event.severity)}>
                      Level {event.severity}: {getSeverityLabel(event.severity)}
                    </Badge>
                    <span className=\"text-sm text-gray-600\">{event.childName}</span>
                    <span className=\"text-xs text-gray-400\">{event.timestamp}</span>
                  </div>
                  <div className=\"flex items-center space-x-2\">
                    <span className=\"text-sm text-gray-600\">
                      {event.confidence}% confidence
                    </span>
                    {event.wasOverridden && (
                      <Badge variant=\"outline\" className=\"text-blue-600\">
                        Overridden
                      </Badge>
                    )}
                  </div>
                </div>
                <div className=\"text-sm text-gray-800 truncate\">
                  \"{event.message}\"
                </div>
                <div className=\"text-xs text-gray-500 mt-1\">
                  Category: {event.category} | Action: {event.action}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50\">
          <Card className=\"w-full max-w-2xl m-4\">
            <CardHeader>
              <CardTitle>Safety Event Details</CardTitle>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              <div>
                <label className=\"text-sm font-medium\">Message:</label>
                <div className=\"p-3 bg-gray-100 rounded mt-1\">
                  \"{selectedEvent.message}\"
                </div>
              </div>

              <div className=\"grid grid-cols-2 gap-4\">
                <div>
                  <label className=\"text-sm font-medium\">Severity:</label>
                  <Badge className={getSeverityColor(selectedEvent.severity)}>
                    Level {selectedEvent.severity}: {getSeverityLabel(selectedEvent.severity)}
                  </Badge>
                </div>
                <div>
                  <label className=\"text-sm font-medium\">Confidence:</label>
                  <div className=\"text-lg font-semibold\">{selectedEvent.confidence}%</div>
                </div>
              </div>

              <div className=\"grid grid-cols-2 gap-4\">
                <div>
                  <label className=\"text-sm font-medium\">Category:</label>
                  <div>{selectedEvent.category}</div>
                </div>
                <div>
                  <label className=\"text-sm font-medium\">Action:</label>
                  <div>{selectedEvent.action}</div>
                </div>
              </div>

              {!selectedEvent.wasOverridden && (
                <div className=\"space-y-2\">
                  <label className=\"text-sm font-medium\">Override this decision:</label>
                  <div className=\"flex space-x-2\">
                    <Button
                      variant=\"outline\"
                      size=\"sm\"
                      onClick={() => handleOverride(selectedEvent.id, 'contextual_misinterpretation')}
                    >
                      Context Misunderstood
                    </Button>
                    <Button
                      variant=\"outline\"
                      size=\"sm\"
                      onClick={() => handleOverride(selectedEvent.id, 'gaming_terminology')}
                    >
                      Gaming Context
                    </Button>
                    <Button
                      variant=\"outline\"
                      size=\"sm\"
                      onClick={() => handleOverride(selectedEvent.id, 'uk_slang')}
                    >
                      UK Slang
                    </Button>
                  </div>
                </div>
              )}

              <div className=\"flex justify-end space-x-2\">
                <Button variant=\"outline\" onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}