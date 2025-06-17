'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface EmailPreference {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'immediate';
  category: 'summaries' | 'safety' | 'development' | 'system';
}

interface EmailPreferencesProps {
  parentId: string;
  onPreferencesChange?: (preferences: EmailPreference[]) => void;
  className?: string;
}

/**
 * Email preferences management component for parent dashboard
 */
export const EmailPreferences: React.FC<EmailPreferencesProps> = ({
  parentId,
  onPreferencesChange,
  className = '',
}) => {
  const [preferences, setPreferences] = useState<EmailPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const defaultPreferences: EmailPreference[] = useMemo(
    () => [
      {
        id: 'weekly_summary',
        name: 'Weekly Development Summaries',
        description:
          "Comprehensive weekly insights about your child's conversations, mood, and development",
        enabled: true,
        frequency: 'weekly',
        category: 'summaries',
      },
      {
        id: 'monthly_summary',
        name: 'Monthly Progress Reports',
        description:
          'Detailed monthly analysis showing developmental trends and milestones',
        enabled: true,
        frequency: 'monthly',
        category: 'summaries',
      },
      {
        id: 'safety_incidents',
        name: 'Safety Incident Alerts',
        description:
          'Immediate notifications when safety concerns are detected',
        enabled: true,
        frequency: 'immediate',
        category: 'safety',
      },
      {
        id: 'milestone_alerts',
        name: 'Developmental Milestone Notifications',
        description:
          'Alerts when your child reaches significant developmental milestones',
        enabled: true,
        frequency: 'immediate',
        category: 'development',
      },
      {
        id: 'daily_digest',
        name: 'Daily Activity Digest',
        description: 'Brief daily summary of conversation activity and mood',
        enabled: false,
        frequency: 'daily',
        category: 'summaries',
      },
      {
        id: 'system_updates',
        name: 'System Updates & Features',
        description:
          'Information about new features, improvements, and system maintenance',
        enabled: true,
        frequency: 'monthly',
        category: 'system',
      },
      {
        id: 'usage_reports',
        name: 'Usage & Screen Time Reports',
        description: 'Weekly reports on conversation time and usage patterns',
        enabled: false,
        frequency: 'weekly',
        category: 'summaries',
      },
      {
        id: 'concern_followups',
        name: 'Concern Follow-ups',
        description:
          'Follow-up emails after safety incidents or concerning patterns',
        enabled: true,
        frequency: 'immediate',
        category: 'safety',
      },
    ],
    []
  );

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll use localStorage for persistence
      const saved = localStorage.getItem(`email-preferences-${parentId}`);
      if (saved) {
        setPreferences(JSON.parse(saved));
      } else {
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Failed to load email preferences:', error);
      setPreferences(defaultPreferences);
    } finally {
      setLoading(false);
    }
  }, [parentId, defaultPreferences]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const savePreferences = async (newPreferences: EmailPreference[]) => {
    setSaving(true);
    try {
      // In a real implementation, this would save to the API
      localStorage.setItem(
        `email-preferences-${parentId}`,
        JSON.stringify(newPreferences)
      );
      setPreferences(newPreferences);
      setLastSaved(new Date());
      onPreferencesChange?.(newPreferences);
    } catch (error) {
      console.error('Failed to save email preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (id: string, updates: Partial<EmailPreference>) => {
    const newPreferences = preferences.map(pref =>
      pref.id === id ? { ...pref, ...updates } : pref
    );
    savePreferences(newPreferences);
  };

  const togglePreference = (id: string) => {
    const preference = preferences.find(p => p.id === id);
    if (preference) {
      updatePreference(id, { enabled: !preference.enabled });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'summaries':
        return '📊';
      case 'safety':
        return '🛡️';
      case 'development':
        return '🌟';
      case 'system':
        return '⚙️';
      default:
        return '📧';
    }
  };

  const getFrequencyColor = (frequency?: string) => {
    switch (frequency) {
      case 'immediate':
        return 'text-red-600 bg-red-50';
      case 'daily':
        return 'text-blue-600 bg-blue-50';
      case 'weekly':
        return 'text-green-600 bg-green-50';
      case 'monthly':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const groupedPreferences = preferences.reduce(
    (groups, pref) => {
      if (!groups[pref.category]) {
        groups[pref.category] = [];
      }
      groups[pref.category].push(pref);
      return groups;
    },
    {} as Record<string, EmailPreference[]>
  );

  if (loading) {
    return (
      <div className={`email-preferences-loading ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`email-preferences ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Email Preferences
        </h2>
        <p className="text-gray-600">
          Customize which emails you receive and how often. You can change these
          settings at any time.
        </p>
        {lastSaved && (
          <p className="text-sm text-green-600 mt-2">
            ✅ Last saved: {lastSaved.toLocaleString()}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {Object.entries(groupedPreferences).map(([category, categoryPrefs]) => (
          <div
            key={category}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">{getCategoryIcon(category)}</span>
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {category === 'summaries'
                  ? 'Summary Reports'
                  : category === 'safety'
                    ? 'Safety & Security'
                    : category === 'development'
                      ? 'Development Tracking'
                      : 'System & Updates'}
              </h3>
            </div>

            <div className="space-y-4">
              {categoryPrefs.map(preference => (
                <div
                  key={preference.id}
                  className="flex items-start justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="font-medium text-gray-900">
                        {preference.name}
                      </h4>
                      {preference.frequency && (
                        <span
                          className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getFrequencyColor(preference.frequency)}`}
                        >
                          {preference.frequency}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {preference.description}
                    </p>
                  </div>

                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preference.enabled}
                        onChange={() => togglePreference(preference.id)}
                        disabled={saving}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Important Notes</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • Safety incident alerts cannot be disabled for your child&apos;s
            protection
          </li>
          <li>
            • You can unsubscribe from all emails using the link in any email
            footer
          </li>
          <li>• Preference changes take effect immediately for new emails</li>
          <li>
            • Critical safety communications will always be sent regardless of
            preferences
          </li>
        </ul>
      </div>

      <div className="mt-6 flex justify-between items-center text-sm text-gray-500">
        <span>
          {preferences.filter(p => p.enabled).length} of {preferences.length}{' '}
          email types enabled
        </span>
        <span>{saving ? 'Saving...' : 'Changes saved automatically'}</span>
      </div>
    </div>
  );
};
