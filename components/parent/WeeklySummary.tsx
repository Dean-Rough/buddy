'use client';

import { useState } from 'react';
import { WeeklySummary } from '@/lib/summary-generator';

interface WeeklySummaryProps {
  childId: string;
  childName: string;
}

export default function WeeklySummaryComponent({
  childId,
  childName,
}: WeeklySummaryProps) {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('');

  const generateSummary = async () => {
    if (!selectedWeek) {
      alert('Please select a week');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/summaries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          weekStartDate: selectedWeek,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSummary(data.summary);
      } else {
        alert('Failed to generate summary: ' + data.error);
      }
    } catch (error) {
      console.error('Summary generation failed:', error);
      alert('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const getWeekOptions = () => {
    const options = [];
    const now = new Date();

    for (let i = 0; i < 8; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const label = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
      const value = weekStart.toISOString().split('T')[0];

      options.push({ label, value });
    }

    return options;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Weekly Summary for {childName}
      </h3>

      <div className="flex gap-4 mb-6">
        <select
          value={selectedWeek}
          onChange={e => setSelectedWeek(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a week...</option>
          {getWeekOptions().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          onClick={generateSummary}
          disabled={loading || !selectedWeek}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Summary'}
        </button>
      </div>

      {summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900">Sessions</h4>
              <p className="text-2xl font-bold text-blue-600">
                {summary.totalSessions}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900">Messages</h4>
              <p className="text-2xl font-bold text-green-600">
                {summary.totalMessages}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900">Avg Session</h4>
              <p className="text-2xl font-bold text-purple-600">
                {summary.averageSessionLength}m
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900">Positive Mood</h4>
              <p className="text-2xl font-bold text-yellow-600">
                {summary.moodTrends.positive}%
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Top Topics</h4>
              <ul className="space-y-2">
                {summary.topTopics.length > 0 ? (
                  summary.topTopics.map((topic, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {topic}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">
                    No specific topics identified
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Mood Distribution
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-green-600">Positive</span>
                  <span className="font-medium">
                    {summary.moodTrends.positive}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${summary.moodTrends.positive}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Neutral</span>
                  <span className="font-medium">
                    {summary.moodTrends.neutral}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-500 h-2 rounded-full"
                    style={{ width: `${summary.moodTrends.neutral}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-red-600">Negative</span>
                  <span className="font-medium">
                    {summary.moodTrends.negative}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${summary.moodTrends.negative}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Highlights</h4>
              <ul className="space-y-2">
                {summary.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-500 mr-2">✨</span>
                    <span className="text-sm">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Safety Events</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Level 1 (Monitor):</span>
                  <span className="font-medium">
                    {summary.safetyEvents.level1}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Level 2 (Attention):</span>
                  <span className="font-medium">
                    {summary.safetyEvents.level2}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Level 3 (Escalation):</span>
                  <span className="font-medium text-red-600">
                    {summary.safetyEvents.level3}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {summary.concernsNoted.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-3">
                Notes for Your Attention
              </h4>
              <ul className="space-y-2">
                {summary.concernsNoted.map((concern, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-600 mr-2">⚠️</span>
                    <span className="text-sm text-yellow-800">{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
