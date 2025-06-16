'use client';

import React, { useState } from 'react';
import BrutalCard from '@/components/ui/BrutalCard';
import BrutalButton from '@/components/ui/BrutalButton';

interface SafetyAlert {
  id: string;
  eventType: string;
  severityLevel: number;
  detectedAt: string;
  status: string;
  childName: string;
  triggerContent: string;
  resolved: boolean;
}

interface AlertCenterProps {
  alerts: SafetyAlert[];
  onRefresh: () => void;
}

export default function AlertCenter({ alerts, onRefresh }: AlertCenterProps) {
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const getSeverityColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 3:
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityLabel = (level: number) => {
    switch (level) {
      case 1:
        return 'Low';
      case 2:
        return 'Medium';
      case 3:
        return 'High';
      default:
        return 'Unknown';
    }
  };

  const getSeverityIcon = (level: number) => {
    switch (level) {
      case 1:
        return '⚠️';
      case 2:
        return '🔶';
      case 3:
        return '🚨';
      default:
        return '❓';
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'inappropriate_language':
        return 'Inappropriate Language';
      case 'personal_info_shared':
        return 'Personal Info Shared';
      case 'emotional_distress':
        return 'Emotional Distress';
      case 'safety_concern':
        return 'Safety Concern';
      case 'topic_violation':
        return 'Topic Violation';
      default:
        return eventType
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleResolveAlert = async (alertId: string) => {
    setResolving(alertId);

    try {
      const response = await fetch(`/api/safety/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolution: 'reviewed_by_parent',
          notes: 'Reviewed and acknowledged by parent via dashboard',
        }),
      });

      if (response.ok) {
        onRefresh(); // Refresh the alerts list
        setSelectedAlert(null); // Close detail view
      } else {
        console.error('Failed to resolve alert');
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    } finally {
      setResolving(null);
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const resolvedAlerts = alerts.filter(alert => alert.resolved);

  return (
    <BrutalCard variant="white" className="h-fit">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-rokano text-xl">ALERT CENTER</h3>
        <BrutalButton variant="white" size="small" onClick={onRefresh}>
          🔄
        </BrutalButton>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-red-50 p-2 brutal-shadow-small border border-red-200 text-center">
          <div className="font-bold text-lg text-red-700">
            {activeAlerts.length}
          </div>
          <div className="text-xs text-red-600">Active Alerts</div>
        </div>
        <div className="bg-green-50 p-2 brutal-shadow-small border border-green-200 text-center">
          <div className="font-bold text-lg text-green-700">
            {resolvedAlerts.length}
          </div>
          <div className="text-xs text-green-600">Resolved</div>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activeAlerts.length === 0 && resolvedAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">🛡️</div>
            <p className="text-sm">No safety alerts</p>
            <p className="text-xs text-gray-400">All conversations are safe!</p>
          </div>
        ) : (
          <>
            {/* Active Alerts */}
            {activeAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3 brutal-shadow-small border cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedAlert?.id === alert.id ? 'ring-2 ring-blue-400' : ''
                } ${getSeverityColor(alert.severityLevel)}`}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span>{getSeverityIcon(alert.severityLevel)}</span>
                    <span className="font-avotica font-bold text-sm">
                      {getEventTypeLabel(alert.eventType)}
                    </span>
                  </div>
                  <span className="text-xs">
                    {formatTimeAgo(alert.detectedAt)}
                  </span>
                </div>
                <p className="text-xs">{alert.childName}</p>
                <p className="text-xs mt-1 truncate">
                  {alert.triggerContent.length > 50
                    ? `${alert.triggerContent.substring(0, 50)}...`
                    : alert.triggerContent}
                </p>
              </div>
            ))}

            {/* Resolved Alerts (collapsed) */}
            {resolvedAlerts.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 font-avotica font-bold">
                  Resolved Alerts ({resolvedAlerts.length})
                </summary>
                <div className="mt-2 space-y-2">
                  {resolvedAlerts.slice(0, 3).map(alert => (
                    <div
                      key={alert.id}
                      className="p-2 bg-gray-50 border border-gray-200 brutal-shadow-small"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-avotica font-bold">
                          {getEventTypeLabel(alert.eventType)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(alert.detectedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{alert.childName}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full brutal-shadow-large border-3 border-black max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-rokano text-xl mb-1">
                    {getEventTypeLabel(selectedAlert.eventType)}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-1 text-xs brutal-shadow-small border ${getSeverityColor(selectedAlert.severityLevel)}`}
                    >
                      {getSeverityIcon(selectedAlert.severityLevel)}{' '}
                      {getSeverityLabel(selectedAlert.severityLevel)} Priority
                    </span>
                  </div>
                </div>
                <BrutalButton
                  variant="red"
                  size="small"
                  onClick={() => setSelectedAlert(null)}
                >
                  ✕
                </BrutalButton>
              </div>

              {/* Alert Details */}
              <div className="space-y-4">
                <div>
                  <div className="font-avotica font-bold text-sm mb-1">
                    Child:
                  </div>
                  <p className="text-sm">{selectedAlert.childName}</p>
                </div>

                <div>
                  <div className="font-avotica font-bold text-sm mb-1">
                    When:
                  </div>
                  <p className="text-sm">
                    {new Date(selectedAlert.detectedAt).toLocaleString()}
                  </p>
                </div>

                <div>
                  <div className="font-avotica font-bold text-sm mb-1">
                    Trigger Content:
                  </div>
                  <div className="bg-gray-50 p-3 brutal-shadow-small border border-gray-200">
                    <p className="text-sm">{selectedAlert.triggerContent}</p>
                  </div>
                </div>

                <div>
                  <div className="font-avotica font-bold text-sm mb-1">
                    Status:
                  </div>
                  <p className="text-sm capitalize">
                    {selectedAlert.status.replace(/_/g, ' ')}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <BrutalButton
                    variant="white"
                    onClick={() => setSelectedAlert(null)}
                    className="flex-1"
                  >
                    CLOSE
                  </BrutalButton>
                  {!selectedAlert.resolved && (
                    <BrutalButton
                      variant="green"
                      onClick={() => handleResolveAlert(selectedAlert.id)}
                      disabled={resolving === selectedAlert.id}
                      className="flex-1"
                    >
                      {resolving === selectedAlert.id
                        ? 'RESOLVING...'
                        : 'MARK RESOLVED'}
                    </BrutalButton>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </BrutalCard>
  );
}
