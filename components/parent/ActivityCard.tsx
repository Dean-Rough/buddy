'use client';

import React from 'react';
import BrutalCard from '@/components/ui/BrutalCard';

interface DailyUsage {
  id: string;
  date: string;
  totalMinutes: number;
  sessionCount: number;
  messagesSent: number;
  topicsDiscussed: string[];
  moodSummary: string | null;
  safetyEvents: number;
  escalationEvents: number;
  engagementScore: number;
}

interface ActivityCardProps {
  usage: DailyUsage;
  childName: string;
}

export default function ActivityCard({ usage, childName }: ActivityCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getEngagementColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEngagementLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Needs Attention';
  };

  const getMoodEmoji = (mood: string | null) => {
    if (!mood) return '😐';

    const moodLower = mood.toLowerCase();
    if (
      moodLower.includes('happy') ||
      moodLower.includes('excited') ||
      moodLower.includes('joy')
    ) {
      return '😊';
    } else if (moodLower.includes('sad') || moodLower.includes('upset')) {
      return '😢';
    } else if (
      moodLower.includes('angry') ||
      moodLower.includes('frustrated')
    ) {
      return '😠';
    } else if (moodLower.includes('worried') || moodLower.includes('anxious')) {
      return '😰';
    } else if (moodLower.includes('calm') || moodLower.includes('peaceful')) {
      return '😌';
    } else if (
      moodLower.includes('curious') ||
      moodLower.includes('interested')
    ) {
      return '🤔';
    }
    return '😐';
  };

  const hasActivity = usage.totalMinutes > 0 || usage.sessionCount > 0;

  return (
    <BrutalCard
      variant={hasActivity ? 'blue' : 'white'}
      className={hasActivity ? 'border-blue-400' : 'border-gray-300'}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-rokano text-lg">{formatDate(usage.date)}</h3>
          <p className="text-sm text-gray-600">{childName}</p>
        </div>
        <div className="text-right">
          {usage.safetyEvents > 0 ? (
            <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 brutal-shadow-small border border-red-300">
              ⚠️ {usage.safetyEvents} Alert{usage.safetyEvents > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 brutal-shadow-small border border-green-300">
              ✅ Safe
            </span>
          )}
        </div>
      </div>

      {!hasActivity ? (
        /* No Activity */
        <div className="text-center py-6 text-gray-500">
          <div className="text-2xl mb-2">💤</div>
          <p className="text-sm">No chat activity</p>
        </div>
      ) : (
        /* Activity Details */
        <div className="space-y-4">
          {/* Usage Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/50 p-2 brutal-shadow-small">
              <div className="font-bold text-lg">{usage.totalMinutes}</div>
              <div className="text-xs text-gray-600">minutes</div>
            </div>
            <div className="bg-white/50 p-2 brutal-shadow-small">
              <div className="font-bold text-lg">{usage.sessionCount}</div>
              <div className="text-xs text-gray-600">sessions</div>
            </div>
            <div className="bg-white/50 p-2 brutal-shadow-small">
              <div className="font-bold text-lg">{usage.messagesSent}</div>
              <div className="text-xs text-gray-600">messages</div>
            </div>
          </div>

          {/* Mood Summary */}
          {usage.moodSummary && (
            <div className="bg-white/50 p-3 brutal-shadow-small">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">
                  {getMoodEmoji(usage.moodSummary)}
                </span>
                <span className="font-avotica font-bold text-sm">Mood</span>
              </div>
              <p className="text-sm text-gray-700">{usage.moodSummary}</p>
            </div>
          )}

          {/* Topics */}
          {usage.topicsDiscussed.length > 0 && (
            <div>
              <div className="font-avotica font-bold text-sm mb-2">
                Topics Discussed
              </div>
              <div className="flex flex-wrap gap-1">
                {usage.topicsDiscussed.slice(0, 4).map((topic, index) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 brutal-shadow-small border border-blue-300"
                  >
                    {topic}
                  </span>
                ))}
                {usage.topicsDiscussed.length > 4 && (
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 brutal-shadow-small border border-gray-300">
                    +{usage.topicsDiscussed.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Engagement Score */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-sm font-avotica font-bold">Engagement:</span>
            <span
              className={`text-sm font-bold ${getEngagementColor(usage.engagementScore)}`}
            >
              {getEngagementLabel(usage.engagementScore)} (
              {Math.round(usage.engagementScore * 100)}%)
            </span>
          </div>
        </div>
      )}
    </BrutalCard>
  );
}
