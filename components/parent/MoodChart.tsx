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

interface MoodChartProps {
  childId: string | null;
  usageData: DailyUsage[];
}

export default function MoodChart({ childId, usageData }: MoodChartProps) {
  // Extract mood data from usage
  const moodData = usageData
    .filter(usage => usage.moodSummary)
    .map(usage => ({
      date: usage.date,
      mood: usage.moodSummary,
      engagementScore: usage.engagementScore,
      messagesSent: usage.messagesSent,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getMoodScore = (moodSummary: string | null): number => {
    if (!moodSummary) return 3; // Neutral

    const mood = moodSummary.toLowerCase();

    // Very positive moods
    if (
      mood.includes('excited') ||
      mood.includes('thrilled') ||
      mood.includes('ecstatic')
    ) {
      return 5;
    }
    // Positive moods
    if (
      mood.includes('happy') ||
      mood.includes('joy') ||
      mood.includes('cheerful') ||
      mood.includes('pleased')
    ) {
      return 4;
    }
    // Negative moods
    if (
      mood.includes('sad') ||
      mood.includes('disappointed') ||
      mood.includes('upset')
    ) {
      return 2;
    }
    // Very negative moods
    if (
      mood.includes('angry') ||
      mood.includes('furious') ||
      mood.includes('devastated')
    ) {
      return 1;
    }
    // Neutral/calm
    return 3;
  };

  const getMoodEmoji = (score: number): string => {
    switch (score) {
      case 5:
        return '😄';
      case 4:
        return '😊';
      case 3:
        return '😐';
      case 2:
        return '😢';
      case 1:
        return '😠';
      default:
        return '😐';
    }
  };

  const getMoodLabel = (score: number): string => {
    switch (score) {
      case 5:
        return 'Very Happy';
      case 4:
        return 'Happy';
      case 3:
        return 'Neutral';
      case 2:
        return 'Sad';
      case 1:
        return 'Upset';
      default:
        return 'Unknown';
    }
  };

  const chartData = moodData.map(data => ({
    ...data,
    moodScore: getMoodScore(data.mood),
  }));

  const getAverageMood = () => {
    if (chartData.length === 0) return 0;
    const total = chartData.reduce((sum, data) => sum + data.moodScore, 0);
    return total / chartData.length;
  };

  const getMoodTrend = () => {
    if (chartData.length < 2) return 'stable';

    const recentData = chartData.slice(-3); // Last 3 days
    const earlyData = chartData.slice(0, 3); // First 3 days

    const recentAvg =
      recentData.reduce((sum, d) => sum + d.moodScore, 0) / recentData.length;
    const earlyAvg =
      earlyData.reduce((sum, d) => sum + d.moodScore, 0) / earlyData.length;

    if (recentAvg > earlyAvg + 0.5) return 'improving';
    if (recentAvg < earlyAvg - 0.5) return 'declining';
    return 'stable';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const maxHeight = 120;
  const chartWidth = 300;
  const barWidth = Math.max(
    20,
    (chartWidth - 40) / Math.max(chartData.length, 1) - 4
  );

  if (!childId) {
    return (
      <BrutalCard variant="white">
        <h3 className="font-rokano text-xl mb-4">MOOD TRENDS</h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-sm">Select a child to view mood trends</p>
        </div>
      </BrutalCard>
    );
  }

  return (
    <BrutalCard variant="blue">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-rokano text-xl">MOOD TRENDS</h3>
        <div className="text-right text-sm">
          <div className="flex items-center gap-2">
            <span>Trend:</span>
            <span
              className={`font-bold ${
                getMoodTrend() === 'improving'
                  ? 'text-green-600'
                  : getMoodTrend() === 'declining'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {getMoodTrend() === 'improving'
                ? '📈 Improving'
                : getMoodTrend() === 'declining'
                  ? '📉 Declining'
                  : '➡️ Stable'}
            </span>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">😐</div>
          <p className="text-sm">No mood data available yet</p>
          <p className="text-xs text-gray-400">
            Mood tracking starts after conversations
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mood Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/50 p-3 brutal-shadow-small text-center">
              <div className="text-2xl mb-1">
                {getMoodEmoji(Math.round(getAverageMood()))}
              </div>
              <div className="font-avotica font-bold text-sm">Average Mood</div>
              <div className="text-xs text-gray-600">
                {getMoodLabel(Math.round(getAverageMood()))}
              </div>
            </div>
            <div className="bg-white/50 p-3 brutal-shadow-small text-center">
              <div className="text-xl mb-1 font-bold">{chartData.length}</div>
              <div className="font-avotica font-bold text-sm">Days Tracked</div>
              <div className="text-xs text-gray-600">with mood data</div>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="bg-white/50 p-4 brutal-shadow-small">
            <div
              className="flex items-end justify-center gap-1"
              style={{ height: maxHeight + 20 }}
            >
              {chartData.map((data, index) => {
                const barHeight = (data.moodScore / 5) * maxHeight;
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center group relative"
                    style={{ width: barWidth }}
                  >
                    {/* Bar */}
                    <div
                      className={`w-full transition-all duration-200 group-hover:opacity-80 ${
                        data.moodScore >= 4
                          ? 'bg-green-400'
                          : data.moodScore >= 3
                            ? 'bg-yellow-400'
                            : 'bg-red-400'
                      } border border-black brutal-shadow-small`}
                      style={{ height: Math.max(barHeight, 10) }}
                    />

                    {/* Emoji on top */}
                    <div className="text-sm mt-1">
                      {getMoodEmoji(data.moodScore)}
                    </div>

                    {/* Date label */}
                    <div className="text-xs text-gray-600 mt-1 transform -rotate-45 origin-top-left">
                      {formatDate(data.date)}
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs p-2 brutal-shadow-small border border-gray-300 whitespace-nowrap z-10">
                      <div className="font-bold">{formatDate(data.date)}</div>
                      <div>{getMoodLabel(data.moodScore)}</div>
                      <div>{data.messagesSent} messages</div>
                      <div className="text-xs opacity-75 max-w-32 truncate">
                        {data.mood}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Y-axis labels */}
            <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
              <span>😠 Upset</span>
              <span>😐 Neutral</span>
              <span>😄 Very Happy</span>
            </div>
          </div>

          {/* Recent Mood Summary */}
          <div className="bg-white/50 p-3 brutal-shadow-small">
            <div className="font-avotica font-bold text-sm mb-2">
              Recent Mood Summary
            </div>
            {chartData.slice(-3).map((data, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-1"
              >
                <div className="flex items-center gap-2">
                  <span>{getMoodEmoji(data.moodScore)}</span>
                  <span className="text-sm">{formatDate(data.date)}</span>
                </div>
                <span className="text-xs text-gray-600">
                  {data.messagesSent} messages
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </BrutalCard>
  );
}
