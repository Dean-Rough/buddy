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
  childName: string;
  status: string;
  moderatorDecision?: string;
  moderatorNotes?: string;
}

export default function ModerationDashboard() {
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'reviewed' | 'all'>(
    'pending'
  );
  const [selectedEvent, setSelectedEvent] = useState<SafetyEvent | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/moderation/events?filter=${filter}`);
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to fetch moderation events:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const reviewEvent = async (
    eventId: string,
    decision: string,
    notes: string
  ) => {
    try {
      const response = await fetch(`/api/moderation/events/${eventId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes }),
      });

      if (response.ok) {
        fetchEvents();
        setSelectedEvent(null);
      } else {
        alert('Failed to submit review');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review');
    }
  };

  const getSeverityColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 3:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Moderation Dashboard
          </h1>
          <p className="text-gray-600">
            Review safety events and child conversations
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pending">Pending Review</option>
            <option value="reviewed">Reviewed</option>
            <option value="all">All Events</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            Total events: {events.length}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">✓</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No events to review
            </h3>
            <p className="text-gray-600">
              All safety events have been reviewed.
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Events List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Safety Events
              </h2>

              {events.map(event => (
                <div
                  key={event.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedEvent?.id === event.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(event.severityLevel)}`}
                      >
                        Level {event.severityLevel}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {event.childName}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.detectedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-900 font-medium mb-1">
                    {event.eventType.replace('_', ' ').toUpperCase()}
                  </p>

                  <p className="text-sm text-gray-700 truncate">
                    &ldquo;{event.triggerContent}&rdquo;
                  </p>

                  {event.moderatorDecision && (
                    <div className="mt-2 text-xs">
                      <span className="text-green-600 font-medium">
                        Reviewed: {event.moderatorDecision}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Event Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {selectedEvent ? (
                <EventReview event={selectedEvent} onReview={reviewEvent} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Select an event to review
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface EventReviewProps {
  event: SafetyEvent;
  onReview: (eventId: string, decision: string, notes: string) => void;
}

function EventReview({ event, onReview }: EventReviewProps) {
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (decision) {
      onReview(event.id, decision, notes);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Review</h3>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Child
          </label>
          <p className="text-sm text-gray-900">{event.childName}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Severity Level
          </label>
          <span
            className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(event.severityLevel)}`}
          >
            Level {event.severityLevel}
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trigger Content
          </label>
          <div className="p-3 bg-gray-50 rounded border text-sm">
            &ldquo;{event.triggerContent}&rdquo;
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            AI Analysis
          </label>
          <div className="p-3 bg-gray-50 rounded border text-sm">
            {event.aiReasoning}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Context
          </label>
          <div className="p-3 bg-gray-50 rounded border text-sm">
            {event.contextSummary}
          </div>
        </div>
      </div>

      {!event.moderatorDecision && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moderator Decision
            </label>
            <select
              value={decision}
              onChange={e => setDecision(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select decision...</option>
              <option value="approved">Approved - AI decision correct</option>
              <option value="escalate">
                Escalate - Requires further review
              </option>
              <option value="false_positive">
                False Positive - Not concerning
              </option>
              <option value="missed_escalation">
                Missed Escalation - Should be higher level
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes or context..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Submit Review
          </button>
        </form>
      )}

      {event.moderatorDecision && (
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium text-gray-700">Decision:</span>
            <span className="ml-2 text-green-600">
              {event.moderatorDecision}
            </span>
          </div>
          {event.moderatorNotes && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Notes:</span>
              <div className="mt-1 p-2 bg-gray-50 rounded text-gray-900">
                {event.moderatorNotes}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getSeverityColor(level: number) {
  switch (level) {
    case 1:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 2:
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 3:
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}
