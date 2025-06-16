'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import BrutalCard from '@/components/ui/BrutalCard';
import BrutalButton from '@/components/ui/BrutalButton';
import BrutalInput from '@/components/ui/BrutalInput';

interface SafetyAlert {
  id: string;
  eventType: string;
  severityLevel: number;
  detectedAt: string;
  status: string;
  childName: string;
  triggerContent: string;
  resolved: boolean;
  conversation?: {
    id: string;
    childId: string;
    messages: Array<{
      id: string;
      content: string;
      role: 'user' | 'assistant';
      timestamp: string;
    }>;
  };
}

interface AlertFilters {
  severity: string;
  status: string;
  child: string;
  dateRange: string;
  eventType: string;
}

export default function AlertManagement() {
  const { user, isLoaded } = useUser();
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<SafetyAlert[]>([]);
  const [children, setChildren] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [showTranscript, setShowTranscript] = useState<string | null>(null);
  const [filters, setFilters] = useState<AlertFilters>({
    severity: 'all',
    status: 'all',
    child: 'all',
    dateRange: 'week',
    eventType: 'all',
  });

  // Fetch alerts and children data
  const loadData = async () => {
    try {
      // Load alerts
      const alertsResponse = await fetch('/api/safety/alerts');
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData);
        setFilteredAlerts(alertsData);
      }

      // Load children
      const childrenResponse = await fetch('/api/children');
      if (childrenResponse.ok) {
        const childrenData = await childrenResponse.json();
        setChildren(childrenData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      loadData();
    }
  }, [isLoaded]);

  // Apply filters whenever filters or alerts change
  useEffect(() => {
    let filtered = [...alerts];

    // Filter by severity
    if (filters.severity !== 'all') {
      const severityLevel = parseInt(filters.severity);
      filtered = filtered.filter(alert => alert.severityLevel === severityLevel);
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(alert => 
        filters.status === 'resolved' ? alert.resolved : !alert.resolved
      );
    }

    // Filter by child
    if (filters.child !== 'all') {
      filtered = filtered.filter(alert => alert.childName === filters.child);
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case 'day':
          cutoffDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(alert => 
        new Date(alert.detectedAt) >= cutoffDate
      );
    }

    // Filter by event type
    if (filters.eventType !== 'all') {
      filtered = filtered.filter(alert => alert.eventType === filters.eventType);
    }

    setFilteredAlerts(filtered);
  }, [filters, alerts]);

  // Utility functions
  const getSeverityColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2: return 'bg-orange-100 text-orange-800 border-orange-300';
      case 3: return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityLabel = (level: number) => {
    switch (level) {
      case 1: return 'Low';
      case 2: return 'Medium'; 
      case 3: return 'High';
      default: return 'Unknown';
    }
  };

  const getSeverityIcon = (level: number) => {
    switch (level) {
      case 1: return '⚠️';
      case 2: return '🔶';
      case 3: return '🚨';
      default: return '❓';
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'inappropriate_language': return 'Inappropriate Language';
      case 'personal_info_shared': return 'Personal Info Shared';
      case 'emotional_distress': return 'Emotional Distress';
      case 'safety_concern': return 'Safety Concern';
      case 'topic_violation': return 'Topic Violation';
      default: return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  // Event handlers
  const handleSelectAlert = (alertId: string) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAlerts.length === filteredAlerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(filteredAlerts.map(alert => alert.id));
    }
  };

  const handleBatchResolve = async () => {
    if (selectedAlerts.length === 0) return;

    try {
      const response = await fetch('/api/safety/alerts/batch-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertIds: selectedAlerts,
          resolution: 'reviewed_by_parent',
          notes: 'Bulk resolved via alert management system'
        }),
      });

      if (response.ok) {
        await loadData();
        setSelectedAlerts([]);
      }
    } catch (error) {
      console.error('Error resolving alerts:', error);
    }
  };

  const handleViewTranscript = async (alertId: string) => {
    try {
      const response = await fetch(`/api/safety/alerts/${alertId}/transcript`);
      if (response.ok) {
        const transcript = await response.json();
        setShowTranscript(JSON.stringify(transcript, null, 2));
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
    }
  };

  const getEventTypes = () => {
    const types = Array.from(new Set(alerts.map(alert => alert.eventType)));
    return types;
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#FFF8E1] flex items-center justify-center">
        <div className="text-xl">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8E1] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-rokano text-4xl mb-2">ALERT MANAGEMENT</h1>
            <p className="text-lg text-gray-600">
              Monitor and manage safety alerts across all child accounts
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Welcome back,</p>
            <p className="font-avotica font-bold">
              {user?.emailAddresses[0]?.emailAddress}
            </p>
          </div>
        </div>

        {/* Filters */}
        <BrutalCard variant="white" className="mb-6">
          <h3 className="font-rokano text-xl mb-4">FILTERS</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Severity Filter */}
            <div>
              <label className="block font-avotica font-bold text-sm mb-2">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                className="w-full border-3 border-black p-2 brutal-shadow-small"
              >
                <option value="all">All Levels</option>
                <option value="1">Low (1)</option>
                <option value="2">Medium (2)</option>
                <option value="3">High (3)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block font-avotica font-bold text-sm mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border-3 border-black p-2 brutal-shadow-small"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Child Filter */}
            <div>
              <label className="block font-avotica font-bold text-sm mb-2">Child</label>
              <select
                value={filters.child}
                onChange={(e) => setFilters(prev => ({ ...prev, child: e.target.value }))}
                className="w-full border-3 border-black p-2 brutal-shadow-small"
              >
                <option value="all">All Children</option>
                {children.map(child => (
                  <option key={child.id} value={child.name}>{child.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block font-avotica font-bold text-sm mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full border-3 border-black p-2 brutal-shadow-small"
              >
                <option value="all">All Time</option>
                <option value="day">Last Day</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>

            {/* Event Type Filter */}
            <div>
              <label className="block font-avotica font-bold text-sm mb-2">Event Type</label>
              <select
                value={filters.eventType}
                onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                className="w-full border-3 border-black p-2 brutal-shadow-small"
              >
                <option value="all">All Types</option>
                {getEventTypes().map(type => (
                  <option key={type} value={type}>{getEventTypeLabel(type)}</option>
                ))}
              </select>
            </div>
          </div>
        </BrutalCard>

        {/* Batch Actions */}
        {filteredAlerts.length > 0 && (
          <BrutalCard variant="blue" className="mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedAlerts.length === filteredAlerts.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4"
                  />
                  <span className="font-avotica font-bold">
                    Select All ({filteredAlerts.length} alerts)
                  </span>
                </label>
                {selectedAlerts.length > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedAlerts.length} selected
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <BrutalButton
                  variant="green"
                  onClick={handleBatchResolve}
                  disabled={selectedAlerts.length === 0}
                >
                  RESOLVE SELECTED ({selectedAlerts.length})
                </BrutalButton>
                <BrutalButton variant="white" onClick={loadData}>
                  🔄 REFRESH
                </BrutalButton>
              </div>
            </div>
          </BrutalCard>
        )}

        {/* Alert List */}
        {filteredAlerts.length === 0 ? (
          <BrutalCard variant="white">
            <div className="text-center py-8 text-gray-500">
              <div className="text-3xl mb-2">🛡️</div>
              <p className="text-lg">No alerts match your filters</p>
              <p className="text-sm text-gray-400">
                Try adjusting your filter criteria or check back later
              </p>
            </div>
          </BrutalCard>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map(alert => (
              <BrutalCard 
                key={alert.id} 
                variant="white"
                className={`transition-all ${selectedAlerts.includes(alert.id) ? 'ring-2 ring-blue-400' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedAlerts.includes(alert.id)}
                    onChange={() => handleSelectAlert(alert.id)}
                    className="w-4 h-4 mt-1"
                  />

                  {/* Alert Content */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span>{getSeverityIcon(alert.severityLevel)}</span>
                        <h4 className="font-rokano text-lg">
                          {getEventTypeLabel(alert.eventType)}
                        </h4>
                        <span className={`inline-block px-2 py-1 text-xs brutal-shadow-small border ${getSeverityColor(alert.severityLevel)}`}>
                          {getSeverityLabel(alert.severityLevel)} Priority
                        </span>
                        <span className={`inline-block px-2 py-1 text-xs brutal-shadow-small border ${
                          alert.resolved 
                            ? 'bg-green-100 text-green-800 border-green-300' 
                            : 'bg-red-100 text-red-800 border-red-300'
                        }`}>
                          {alert.resolved ? '✅ Resolved' : '🔴 Active'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatTimeAgo(alert.detectedAt)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="font-avotica font-bold text-sm">Child:</div>
                        <div className="text-sm">{alert.childName}</div>
                      </div>
                      <div>
                        <div className="font-avotica font-bold text-sm">Date:</div>
                        <div className="text-sm">
                          {new Date(alert.detectedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="font-avotica font-bold text-sm mb-1">Trigger Content:</div>
                      <div className="bg-gray-50 p-3 brutal-shadow-small border border-gray-200 text-sm">
                        {alert.triggerContent}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <BrutalButton
                        variant="blue"
                        size="small"
                        onClick={() => handleViewTranscript(alert.id)}
                      >
                        VIEW TRANSCRIPT
                      </BrutalButton>
                      {!alert.resolved && (
                        <BrutalButton
                          variant="green"
                          size="small"
                          onClick={() => handleBatchResolve()}
                        >
                          RESOLVE
                        </BrutalButton>
                      )}
                    </div>
                  </div>
                </div>
              </BrutalCard>
            ))}
          </div>
        )}

        {/* Transcript Modal */}
        {showTranscript && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-4xl w-full max-h-[80vh] overflow-y-auto brutal-shadow-large border-3 border-black">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-rokano text-2xl">CONVERSATION TRANSCRIPT</h3>
                  <BrutalButton
                    variant="red"
                    size="small"
                    onClick={() => setShowTranscript(null)}
                  >
                    ✕
                  </BrutalButton>
                </div>
                <pre className="bg-gray-50 p-4 brutal-shadow-small border border-gray-200 text-sm overflow-x-auto">
                  {showTranscript}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}