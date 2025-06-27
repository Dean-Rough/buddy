'use client';

import React, { useState, useEffect, useCallback } from 'react';
import BrutalCard from '@/components/ui/BrutalCard';
import BrutalButton from '@/components/ui/BrutalButton';

interface InteractionInsights {
  totalInteractions: number;
  interactionTypes: Record<string, number>;
  familyBenefitScore: number;
  privacyRiskScore: number;
  recommendations: string[];
  siblingPairs: Array<{
    child1: string;
    child2: string;
    compatibilityScore: number;
    recentInteractions: number;
  }>;
}

interface Props {
  className?: string;
}

export default function SiblingInteractionInsights({ className = '' }: Props) {
  const [insights, setInsights] = useState<InteractionInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/parent/sibling-interactions?action=insights&days=${days}`
      );

      if (!response.ok) {
        throw new Error('Failed to load sibling interaction insights');
      }

      const data = await response.json();

      if (data.success && data.insights) {
        setInsights(data.insights);
      } else {
        throw new Error(data.error || 'Invalid insights data');
      }
    } catch (error) {
      console.error('Error loading sibling interaction insights:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const getInteractionTypeLabel = (type: string): string => {
    switch (type) {
      case 'shared_topic_discussion':
        return 'Shared Topics';
      case 'family_activity_mention':
        return 'Family Activities';
      case 'sibling_mention':
        return 'Sibling Mentions';
      case 'comparative_behavior':
        return 'Comparisons';
      case 'family_event_coordination':
        return 'Family Events';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompatibilityLabel = (score: number): string => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Low';
  };

  if (loading) {
    return (
      <BrutalCard variant="blue" className={className}>
        <div className="p-6">
          <h3 className="font-rokano text-xl mb-4">SIBLING INTERACTIONS</h3>
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-600">Loading interaction insights...</div>
          </div>
        </div>
      </BrutalCard>
    );
  }

  if (error) {
    return (
      <BrutalCard variant="pink" className={className}>
        <div className="p-6">
          <h3 className="font-rokano text-xl mb-4">SIBLING INTERACTIONS</h3>
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <BrutalButton variant="white" size="small" onClick={loadInsights}>
              RETRY
            </BrutalButton>
          </div>
        </div>
      </BrutalCard>
    );
  }

  if (!insights) {
    return (
      <BrutalCard variant="yellow" className={className}>
        <div className="p-6">
          <h3 className="font-rokano text-xl mb-4">SIBLING INTERACTIONS</h3>
          <div className="text-center">
            <p className="text-gray-600">No interaction data available</p>
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
          <h3 className="font-rokano text-xl">SIBLING INTERACTIONS</h3>
          <div className="flex gap-2">
            {[7, 14, 30].map(period => (
              <BrutalButton
                key={period}
                variant={days === period ? 'blue' : 'white'}
                size="small"
                onClick={() => setDays(period)}
              >
                {period}D
              </BrutalButton>
            ))}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {insights.totalInteractions}
            </div>
            <div className="text-sm text-gray-600">Total Interactions</div>
          </div>
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${getScoreColor(insights.familyBenefitScore)}`}
            >
              {Math.round(insights.familyBenefitScore * 100)}%
            </div>
            <div className="text-sm text-gray-600">Family Benefit</div>
          </div>
        </div>

        {/* Interaction Types */}
        {Object.keys(insights.interactionTypes).length > 0 && (
          <div className="mb-6">
            <h4 className="font-bold text-sm mb-3">Interaction Types</h4>
            <div className="space-y-2">
              {Object.entries(insights.interactionTypes)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm">
                      {getInteractionTypeLabel(type)}
                    </span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Sibling Compatibility */}
        {insights.siblingPairs.length > 0 && (
          <div className="mb-6">
            <h4 className="font-bold text-sm mb-3">Sibling Compatibility</h4>
            <div className="space-y-3">
              {insights.siblingPairs.slice(0, 3).map((pair, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 border-2 border-black"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm">
                      {pair.child1} & {pair.child2}
                    </span>
                    <span
                      className={`text-sm font-bold ${getScoreColor(pair.compatibilityScore)}`}
                    >
                      {getCompatibilityLabel(pair.compatibilityScore)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>
                      Compatibility: {Math.round(pair.compatibilityScore * 100)}
                      %
                    </span>
                    <span>Recent interactions: {pair.recentInteractions}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {insights.recommendations.length > 0 && (
          <div className="mb-4">
            <h4 className="font-bold text-sm mb-3">Recommendations</h4>
            <div className="space-y-2">
              {insights.recommendations
                .slice(0, 3)
                .map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="text-sm">{recommendation}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Privacy Risk Assessment */}
        <div className="border-t pt-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Privacy Risk</span>
            <div className="flex items-center gap-2">
              <span
                className={`font-bold ${insights.privacyRiskScore < 0.3 ? 'text-green-600' : insights.privacyRiskScore < 0.6 ? 'text-yellow-600' : 'text-red-600'}`}
              >
                {insights.privacyRiskScore < 0.3
                  ? 'Low'
                  : insights.privacyRiskScore < 0.6
                    ? 'Medium'
                    : 'High'}
              </span>
              <span className="text-xs text-gray-600">
                {Math.round(insights.privacyRiskScore * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="text-center">
          <BrutalButton variant="white" size="small" onClick={loadInsights}>
            REFRESH
          </BrutalButton>
        </div>
      </div>
    </BrutalCard>
  );
}
