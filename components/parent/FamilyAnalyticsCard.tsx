'use client';

import React, { useState, useEffect } from 'react';
import BrutalCard from '@/components/ui/BrutalCard';
import BrutalButton from '@/components/ui/BrutalButton';

interface FamilyMetrics {
  totalChildren: number;
  activeChildren: number;
  familyEngagementScore: number;
  familySafetyScore: number;
  familyLearningScore: number;
  familyWellbeingScore: number;
  familyScreenTimeBalance: number;
  siblingInteractionHealth: number;
}

interface FamilyInsights {
  topSharedInterests: string[];
  familyStrengths: string[];
  areasForImprovement: string[];
  recommendedActivities: string[];
  parentActionItems: string[];
}

interface FamilyAnalyticsData {
  familyMetrics: FamilyMetrics;
  familyInsights: FamilyInsights;
  privacyCompliance: {
    complianceScore: number;
    childrenWithRestrictedData: string[];
  };
}

interface Props {
  className?: string;
}

export default function FamilyAnalyticsCard({ className = '' }: Props) {
  const [analytics, setAnalytics] = useState<FamilyAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [error, setError] = useState<string | null>(null);

  const loadFamilyAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/parent/family-analytics?timeframe=${timeframe}&respectPrivacy=true`);
      
      if (!response.ok) {
        throw new Error('Failed to load family analytics');
      }

      const data = await response.json();
      
      if (data.success && data.analytics) {
        setAnalytics(data.analytics);
      } else {
        throw new Error(data.error || 'Invalid analytics data');
      }
    } catch (error) {
      console.error('Error loading family analytics:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamilyAnalytics();
  }, [timeframe]);

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Needs Attention';
  };

  if (loading) {
    return (
      <BrutalCard variant="blue" className={className}>
        <div className="p-6">
          <h3 className="font-rokano text-xl mb-4">FAMILY ANALYTICS</h3>
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-600">Loading family insights...</div>
          </div>
        </div>
      </BrutalCard>
    );
  }

  if (error) {
    return (
      <BrutalCard variant="red" className={className}>
        <div className="p-6">
          <h3 className="font-rokano text-xl mb-4">FAMILY ANALYTICS</h3>
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <BrutalButton
              variant="white"
              size="small"
              onClick={loadFamilyAnalytics}
            >
              RETRY
            </BrutalButton>
          </div>
        </div>
      </BrutalCard>
    );
  }

  if (!analytics) {
    return (
      <BrutalCard variant="yellow" className={className}>
        <div className="p-6">
          <h3 className="font-rokano text-xl mb-4">FAMILY ANALYTICS</h3>
          <div className="text-center">
            <p className="text-gray-600">No analytics data available</p>
          </div>
        </div>
      </BrutalCard>
    );
  }

  return (
    <BrutalCard variant="blue" className={className}>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-rokano text-xl">FAMILY ANALYTICS</h3>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <BrutalButton
                key={period}
                variant={timeframe === period ? 'black' : 'white'}
                size="small"
                onClick={() => setTimeframe(period)}
              >
                {period.toUpperCase()}
              </BrutalButton>
            ))}
          </div>
        </div>

        {/* Family Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics.familyMetrics.totalChildren}</div>
            <div className="text-sm text-gray-600">Total Children</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics.familyMetrics.activeChildren}</div>
            <div className="text-sm text-gray-600">Active This {timeframe}</div>
          </div>
        </div>

        {/* Family Scores */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm">Family Engagement</span>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${getScoreColor(analytics.familyMetrics.familyEngagementScore)}`}>
                {getScoreLabel(analytics.familyMetrics.familyEngagementScore)}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(analytics.familyMetrics.familyEngagementScore * 100)}%
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm">Safety Score</span>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${getScoreColor(analytics.familyMetrics.familySafetyScore)}`}>
                {getScoreLabel(analytics.familyMetrics.familySafetyScore)}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(analytics.familyMetrics.familySafetyScore * 100)}%
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm">Learning Engagement</span>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${getScoreColor(analytics.familyMetrics.familyLearningScore)}`}>
                {getScoreLabel(analytics.familyMetrics.familyLearningScore)}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(analytics.familyMetrics.familyLearningScore * 100)}%
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm">Screen Time Balance</span>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${getScoreColor(analytics.familyMetrics.familyScreenTimeBalance)}`}>
                {getScoreLabel(analytics.familyMetrics.familyScreenTimeBalance)}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(analytics.familyMetrics.familyScreenTimeBalance * 100)}%
              </span>
            </div>
          </div>

          {analytics.familyMetrics.totalChildren > 1 && (
            <div className="flex justify-between items-center">
              <span className="text-sm">Sibling Interaction</span>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${getScoreColor(analytics.familyMetrics.siblingInteractionHealth)}`}>
                  {getScoreLabel(analytics.familyMetrics.siblingInteractionHealth)}
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round(analytics.familyMetrics.siblingInteractionHealth * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Shared Interests */}
        {analytics.familyInsights.topSharedInterests.length > 0 && (
          <div className="mb-4">
            <h4 className="font-bold text-sm mb-2">Shared Interests</h4>
            <div className="flex flex-wrap gap-2">
              {analytics.familyInsights.topSharedInterests.slice(0, 5).map((interest, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Family Strengths */}
        {analytics.familyInsights.familyStrengths.length > 0 && (
          <div className="mb-4">
            <h4 className="font-bold text-sm mb-2">Family Strengths</h4>
            <div className="space-y-1">
              {analytics.familyInsights.familyStrengths.slice(0, 3).map((strength, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm">{strength}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Areas for Improvement */}
        {analytics.familyInsights.areasForImprovement.length > 0 && (
          <div className="mb-4">
            <h4 className="font-bold text-sm mb-2">Areas for Improvement</h4>
            <div className="space-y-1">
              {analytics.familyInsights.areasForImprovement.slice(0, 3).map((area, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-yellow-600">!</span>
                  <span className="text-sm">{area}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parent Action Items */}
        {analytics.familyInsights.parentActionItems.length > 0 && (
          <div className="mb-4">
            <h4 className="font-bold text-sm mb-2">Action Items</h4>
            <div className="space-y-1">
              {analytics.familyInsights.parentActionItems.slice(0, 3).map((action, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-blue-600">→</span>
                  <span className="text-sm">{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Compliance */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span>Privacy Compliance</span>
            <span className={getScoreColor(analytics.privacyCompliance.complianceScore)}>
              {Math.round(analytics.privacyCompliance.complianceScore * 100)}%
            </span>
          </div>
          {analytics.privacyCompliance.childrenWithRestrictedData.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {analytics.privacyCompliance.childrenWithRestrictedData.length} child(ren) with privacy restrictions
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-4 text-center">
          <BrutalButton
            variant="white"
            size="small"
            onClick={loadFamilyAnalytics}
          >
            REFRESH
          </BrutalButton>
        </div>
      </div>
    </BrutalCard>
  );
}