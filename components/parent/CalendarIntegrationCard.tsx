/**
 * Calendar Integration Card Component
 * Allows parents to connect and manage their family calendar
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Loader2, AlertCircle, CheckCircle, RefreshCw, X } from 'lucide-react';

interface CalendarStatus {
  connected: boolean;
  provider: string | null;
  lastSync: string | null;
  eventCount: number;
  recentSync?: {
    duration: number;
    eventsProcessed: number;
    completedAt: string;
  };
}

export function CalendarIntegrationCard() {
  const router = useRouter();
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCalendarStatus();
  }, []);

  const fetchCalendarStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/calendar/sync');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch calendar status');
      }
      
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar status');
    } finally {
      setLoading(false);
    }
  };

  const connectCalendar = () => {
    router.push('/api/calendar/auth?provider=google');
  };

  const syncCalendar = async () => {
    try {
      setSyncing(true);
      setError(null);
      
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync calendar');
      }
      
      // Refresh status after sync
      await fetchCalendarStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync calendar');
    } finally {
      setSyncing(false);
    }
  };

  const disconnectCalendar = async () => {
    if (!confirm('Are you sure you want to disconnect your calendar? This will remove all synced events.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect calendar');
      }
      
      await fetchCalendarStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect calendar');
    } finally {
      setLoading(false);
    }
  };

  const formatLastSync = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };

  if (loading) {
    return (
      <div className="bg-white border-2 border-black p-8 shadow-brutal">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-black p-8 shadow-brutal">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Family Calendar</h3>
        <Calendar className="h-6 w-6" />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {status?.connected ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-500">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-bold">Google Calendar Connected</p>
                <p className="text-sm text-gray-600">
                  {status.eventCount} events synced
                </p>
              </div>
            </div>
            <button
              onClick={disconnectCalendar}
              className="p-2 hover:bg-green-100 transition-colors"
              title="Disconnect calendar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last sync:</span>
              <span className="font-medium">{formatLastSync(status.lastSync)}</span>
            </div>

            {status.recentSync && (
              <div className="text-sm text-gray-600">
                <p>Processed {status.recentSync.eventsProcessed} events in {status.recentSync.duration}ms</p>
              </div>
            )}

            <button
              onClick={syncCalendar}
              disabled={syncing}
              className={`
                w-full px-6 py-3 font-bold text-white border-2 border-black 
                shadow-brutal transition-all hover:-translate-y-0.5 hover:shadow-brutal-lg
                ${syncing ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}
              `}
            >
              {syncing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Syncing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Sync Now
                </span>
              )}
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-300">
            <h4 className="font-bold mb-2">Privacy Protection Active</h4>
            <p className="text-sm text-gray-700">
              Only child-appropriate events are shared with Onda. Adult appointments
              and sensitive information are automatically filtered out.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-gray-600">
            Connect your family calendar to help Onda naturally remind your children
            about upcoming activities, homework, and special events.
          </p>

          <button
            onClick={connectCalendar}
            className="w-full px-6 py-3 bg-purple-500 text-white font-bold border-2 border-black 
                     shadow-brutal hover:bg-purple-600 hover:-translate-y-0.5 hover:shadow-brutal-lg 
                     transition-all"
          >
            Connect Google Calendar
          </button>

          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Read-only access - we never modify your calendar</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>COPPA compliant - adult events are filtered out</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Encrypted storage - your data is always secure</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}