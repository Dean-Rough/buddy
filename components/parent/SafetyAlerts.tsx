'use client';

import { useState, useEffect, useCallback } from 'react';

interface SafetyEvent {
  id: string;
  eventType: string;
  severityLevel: number;
  triggerContent: string;
  aiReasoning: string;
  contextSummary: string;
  detectedAt: string;
  parentNotifiedAt: string | null;
  resolvedAt: string | null;
  status: string;
  childName: string;
}

interface SafetyAlertsProps {
  childId?: string;
}

export default function SafetyAlerts({ childId }: SafetyAlertsProps) {
  const [alerts, setAlerts] = useState<SafetyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');
  const [severityFilter, setSeverityFilter] = useState<'all' | '1' | '2' | '3'>(
    'all'
  );

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (childId) params.append('childId', childId);
      if (filter !== 'all') params.append('status', filter);
      if (severityFilter !== 'all') params.append('severity', severityFilter);

      const response = await fetch(`/api/safety/alerts?${params}`);
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch safety alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [childId, filter, severityFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const markAsResolved = useCallback(
    async (alertId: string) => {
      try {
        const response = await fetch(`/api/safety/alerts/${alertId}/resolve`, {
          method: 'POST',
        });

        if (response.ok) {
          fetchAlerts(); // Refresh alerts
        } else {
          alert('Failed to resolve alert');
        }
      } catch (error) {
        console.error('Failed to resolve alert:', error);
        alert('Failed to resolve alert');
      }
    },
    [fetchAlerts]
  );

  const getSeverityBadge = (level: number) => {
    switch (level) {
      case 1:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
            Level 1 - Monitor
          </span>
        );
      case 2:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
            Level 2 - Attention
          </span>
        );
      case 3:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
            Level 3 - Escalation
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
            Active
          </span>
        );
      case 'resolved':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            Resolved
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Safety Alerts {childId ? '' : '(All Children)'}
        </h3>

        <div className="flex gap-4">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Alerts</option>
            <option value="active">Active Only</option>
            <option value="resolved">Resolved Only</option>
          </select>

          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
          </select>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">🛡️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No safety alerts
          </h3>
          <p className="text-gray-600">
            {filter === 'active'
              ? 'No active safety concerns at this time.'
              : 'No safety alerts match your current filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${
                alert.severityLevel === 3
                  ? 'border-red-200 bg-red-50'
                  : alert.severityLevel === 2
                    ? 'border-orange-200 bg-orange-50'
                    : 'border-yellow-200 bg-yellow-50'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2">
                  {getSeverityBadge(alert.severityLevel)}
                  {getStatusBadge(alert.status)}
                  {!childId && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {alert.childName}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(alert.detectedAt).toLocaleString()}
                </div>
              </div>

              <div className="mb-3">
                <h4 className="font-medium text-gray-900 mb-2">
                  Event Type: {alert.eventType.replace('_', ' ').toUpperCase()}
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Trigger Content:</strong> &ldquo;
                  {alert.triggerContent}&rdquo;
                </p>

                {alert.aiReasoning && (
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>AI Analysis:</strong> {alert.aiReasoning}
                  </p>
                )}

                {alert.contextSummary && (
                  <p className="text-sm text-gray-600">
                    <strong>Context:</strong> {alert.contextSummary}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {alert.parentNotifiedAt && (
                    <span>
                      Notified:{' '}
                      {new Date(alert.parentNotifiedAt).toLocaleString()}
                    </span>
                  )}
                  {alert.resolvedAt && (
                    <span className="ml-4">
                      Resolved: {new Date(alert.resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                {alert.status === 'active' && (
                  <button
                    onClick={() => markAsResolved(alert.id)}
                    className="bg-green-600 text-white text-sm px-3 py-1 rounded hover:bg-green-700 transition-colors"
                  >
                    Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
