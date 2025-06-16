'use client';

import React, { useState, useEffect } from 'react';
import BrutalCard from '@/components/ui/BrutalCard';
import BrutalButton from '@/components/ui/BrutalButton';

interface SummaryStats {
  globalStats: {
    totalGenerated: number;
    totalSent: number;
    totalFailed: number;
    averageTokenCost: number;
  };
  parentStats: {
    totalSummaries: number;
    emailsSent: number;
    averageTokenCost: number;
  };
  recentSummaries: Array<{
    id: string;
    childName: string;
    weekStart: string;
    weekEnd: string;
    sessionCount: number;
    totalChatTime: number;
    emailSent: boolean;
    emailSentAt: string | null;
    createdAt: string;
  }>;
}

interface WeeklySummaryManagerProps {
  children: Array<{ id: string; name: string }>;
}

export default function WeeklySummaryManager({ children }: WeeklySummaryManagerProps) {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/weekly-summaries/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading summary stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleGenerateManualSummary = async (childId: string, childName: string) => {
    setGeneratingFor(childId);
    
    try {
      const response = await fetch('/api/weekly-summaries/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childAccountId: childId,
        }),
      });

      if (response.ok) {
        alert(`Weekly summary generated and sent for ${childName}!`);
        await loadStats(); // Refresh stats
      } else {
        const error = await response.json();
        alert(`Failed to generate summary: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating manual summary:', error);
      alert('Network error. Please try again.');
    } finally {
      setGeneratingFor(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <BrutalCard variant="blue">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-rokano text-xl">WEEKLY SUMMARIES</h3>
        <BrutalButton
          variant="white"
          size="small"
          onClick={loadStats}
          disabled={loading}
        >
          🔄 REFRESH
        </BrutalButton>
      </div>

      {/* Summary Statistics */}
      {stats && (
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white/50 p-2 brutal-shadow-small text-center">
              <div className="font-bold text-lg">{stats.parentStats.totalSummaries}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="bg-white/50 p-2 brutal-shadow-small text-center">
              <div className="font-bold text-lg">{stats.parentStats.emailsSent}</div>
              <div className="text-xs text-gray-600">Sent</div>
            </div>
            <div className="bg-white/50 p-2 brutal-shadow-small text-center">
              <div className="font-bold text-lg">
                {Math.round(stats.parentStats.averageTokenCost)}
              </div>
              <div className="text-xs text-gray-600">Avg Tokens</div>
            </div>
            <div className="bg-white/50 p-2 brutal-shadow-small text-center">
              <div className="font-bold text-lg text-green-600">
                $0.{Math.round(stats.parentStats.averageTokenCost * 0.0003 * 100).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-600">Est. Cost</div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Summary Generation */}
      <div className="mb-6">
        <h4 className="font-avotica font-bold text-sm mb-3">Generate Manual Summary</h4>
        <div className="space-y-2">
          {children.map(child => (
            <div key={child.id} className="flex justify-between items-center p-3 bg-white/50 brutal-shadow-small">
              <span className="font-avotica font-bold">{child.name}</span>
              <BrutalButton
                variant="green"
                size="small"
                onClick={() => handleGenerateManualSummary(child.id, child.name)}
                disabled={generatingFor === child.id}
              >
                {generatingFor === child.id ? 'GENERATING...' : 'GENERATE SUMMARY'}
              </BrutalButton>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Summaries */}
      {stats && stats.recentSummaries.length > 0 && (
        <div>
          <h4 className="font-avotica font-bold text-sm mb-3">Recent Summaries</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {stats.recentSummaries.map(summary => (
              <div key={summary.id} className="p-3 bg-white/50 brutal-shadow-small">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-avotica font-bold">{summary.childName}</span>
                  <span className={`text-xs px-2 py-1 brutal-shadow-small border ${
                    summary.emailSent 
                      ? 'bg-green-100 text-green-800 border-green-300' 
                      : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  }`}>
                    {summary.emailSent ? '✅ Sent' : '⏳ Pending'}
                  </span>
                </div>
                <div className="text-xs text-gray-600 grid grid-cols-2 gap-2">
                  <div>Week: {formatDate(summary.weekStart)} - {formatDate(summary.weekEnd)}</div>
                  <div>Sessions: {summary.sessionCount}</div>
                  <div>Chat Time: {formatMinutes(summary.totalChatTime)}</div>
                  <div>
                    {summary.emailSent && summary.emailSentAt 
                      ? `Sent: ${formatDate(summary.emailSentAt)}`
                      : `Created: ${formatDate(summary.createdAt)}`
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No summaries state */}
      {stats && stats.recentSummaries.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <div className="text-2xl mb-2">📧</div>
          <p className="text-sm">No weekly summaries generated yet</p>
          <p className="text-xs text-gray-400">
            Summaries are automatically generated weekly and sent via email
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-300 brutal-shadow-small">
        <h5 className="font-avotica font-bold text-blue-800 text-sm mb-1">
          💡 How Weekly Summaries Work
        </h5>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Automatically generated every Sunday for the previous week</li>
          <li>• Includes session counts, mood analysis, and topic breakdown</li>
          <li>• Uses AI to provide insights and recommendations</li>
          <li>• Sent via email with beautiful formatting</li>
          <li>• Estimated cost: ~$0.0003 per summary (very affordable!)</li>
        </ul>
      </div>
    </BrutalCard>
  );
}