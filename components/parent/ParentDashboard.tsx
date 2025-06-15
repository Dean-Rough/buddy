'use client';

import { useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import BrutalCard from '@/components/ui/BrutalCard';
import BrutalButton from '@/components/ui/BrutalButton';
import BrutalInput from '@/components/ui/BrutalInput';

interface ChildAccount {
  id: string;
  name: string;
  username: string;
  age: number;
}

interface ParentSettings {
  dailyTimeLimitMinutes?: number;
  emailSummaryEnabled: boolean;
  summaryEmail?: string;
  emailSummaryFrequency: string;
}

interface DailyUsage {
  date: string;
  totalMinutes: number;
  sessionCount: number;
  messagesSent: number;
  topicsDiscussed: string[];
  safetyEvents: number;
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [settings, setSettings] = useState<ParentSettings>({
    emailSummaryEnabled: true,
    emailSummaryFrequency: 'weekly',
  });
  const [usage, setUsage] = useState<DailyUsage[]>([]);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'time' | 'summaries' | 'privacy'
  >('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load children
      const childrenResponse = await fetch('/api/children');
      if (childrenResponse.ok) {
        const childrenData = await childrenResponse.json();
        setChildren(childrenData);
      }

      // Load settings
      const settingsResponse = await fetch('/api/parent/settings');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
      }

      // Load usage data
      const usageResponse = await fetch('/api/parent/usage');
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsage(usageData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<ParentSettings>) => {
    try {
      const response = await fetch('/api/parent/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        setSettings({ ...settings, ...newSettings });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8E1] flex items-center justify-center">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8E1] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-rokano text-4xl">PARENT DASHBOARD</h1>
          <div className="text-sm text-gray-600">
            Welcome back, {user?.emailAddresses[0]?.emailAddress}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: 'overview', label: 'OVERVIEW' },
            { id: 'time', label: 'TIME LIMITS' },
            { id: 'summaries', label: 'EMAIL SUMMARIES' },
            { id: 'privacy', label: 'PRIVACY' },
          ].map(tab => (
            <BrutalButton
              key={tab.id}
              variant={activeTab === tab.id ? 'blue' : 'white'}
              onClick={() => setActiveTab(tab.id as any)}
              className="font-rokano"
            >
              {tab.label}
            </BrutalButton>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid gap-6">
            {/* Children Overview */}
            <BrutalCard variant="blue">
              <h2 className="font-rokano text-2xl mb-4">YOUR CHILDREN</h2>
              {children.length > 0 ? (
                <div className="grid gap-4">
                  {children.map(child => (
                    <div
                      key={child.id}
                      className="flex justify-between items-center p-4 bg-white/50 brutal-shadow-small"
                    >
                      <div>
                        <h3 className="font-avotica font-bold">{child.name}</h3>
                        <p className="text-sm text-gray-600">
                          @{child.username} • Age {child.age}
                        </p>
                      </div>
                      <BrutalButton variant="green" size="small">
                        VIEW ACTIVITY
                      </BrutalButton>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No children added yet</p>
                  <BrutalButton variant="green">ADD CHILD ACCOUNT</BrutalButton>
                </div>
              )}
            </BrutalCard>

            {/* Recent Activity */}
            <BrutalCard variant="yellow">
              <h2 className="font-rokano text-2xl mb-4">RECENT ACTIVITY</h2>
              {usage.length > 0 ? (
                <div className="grid gap-3">
                  {usage.slice(0, 7).map((day) => (
                    <div
                      key={day.date}
                      className="flex justify-between items-center"
                    >
                      <span>{new Date(day.date).toLocaleDateString()}</span>
                      <div className="text-right">
                        <div className="font-bold">
                          {day.totalMinutes} minutes
                        </div>
                        <div className="text-sm text-gray-600">
                          {day.messagesSent} messages
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">
                  No activity data yet
                </p>
              )}
            </BrutalCard>
          </div>
        )}

        {activeTab === 'time' && (
          <div className="grid gap-6">
            <BrutalCard variant="orange">
              <h2 className="font-rokano text-2xl mb-4">TIME MANAGEMENT</h2>
              <div className="space-y-4">
                <div>
                  <label className="block font-avotica font-bold mb-2">
                    Daily Time Limit (minutes)
                  </label>
                  <BrutalInput
                    type="number"
                    value={settings.dailyTimeLimitMinutes || ''}
                    onChange={e =>
                      updateSettings({
                        dailyTimeLimitMinutes:
                          parseInt(e.target.value) || undefined,
                      })
                    }
                    placeholder="No limit set"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Leave empty for no daily time limit
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-avotica font-bold mb-2">
                    How Time Limits Work
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Natural conversation ending as time approaches</li>
                    <li>• Gentle warnings before limit is reached</li>
                    <li>• Teaches healthy digital boundaries</li>
                    <li>• No abrupt cutoffs during important conversations</li>
                  </ul>
                </div>
              </div>
            </BrutalCard>
          </div>
        )}

        {activeTab === 'summaries' && (
          <div className="grid gap-6">
            <BrutalCard variant="purple">
              <h2 className="font-rokano text-2xl mb-4">EMAIL SUMMARIES</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="emailEnabled"
                    checked={settings.emailSummaryEnabled}
                    onChange={e =>
                      updateSettings({ emailSummaryEnabled: e.target.checked })
                    }
                    className="w-4 h-4 border-2 border-black"
                  />
                  <label
                    htmlFor="emailEnabled"
                    className="font-avotica font-bold"
                  >
                    Enable Email Summaries
                  </label>
                </div>

                {settings.emailSummaryEnabled && (
                  <>
                    <div>
                      <label className="block font-avotica font-bold mb-2">
                        Summary Email Address
                      </label>
                      <BrutalInput
                        type="email"
                        value={settings.summaryEmail || ''}
                        onChange={e =>
                          updateSettings({ summaryEmail: e.target.value })
                        }
                        placeholder={
                          user?.emailAddresses[0]?.emailAddress || 'Enter email'
                        }
                      />
                    </div>

                    <div>
                      <label className="block font-avotica font-bold mb-2">
                        Frequency
                      </label>
                      <select
                        value={settings.emailSummaryFrequency}
                        onChange={e =>
                          updateSettings({
                            emailSummaryFrequency: e.target.value,
                          })
                        }
                        className="w-full p-2 border-3 border-black brutal-shadow-small font-avotica"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-avotica font-bold mb-2">
                        What's Included
                      </h3>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Conversation topics and themes</li>
                        <li>• Time spent and engagement patterns</li>
                        <li>• Mood and emotional trends</li>
                        <li>• Learning opportunities discovered</li>
                        <li>• Any safety events (rare)</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </BrutalCard>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="grid gap-6">
            <BrutalCard variant="green">
              <h2 className="font-rokano text-2xl mb-4">PRIVACY & DATA</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 brutal-shadow-small">
                  <h3 className="font-avotica font-bold mb-2">
                    🔒 Your Data is Protected
                  </h3>
                  <ul className="text-sm space-y-1">
                    <li>• All conversations encrypted and secure</li>
                    <li>• 90-day automatic data retention</li>
                    <li>• COPPA and GDPR compliant</li>
                    <li>• You control all data access</li>
                  </ul>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-avotica font-bold">Export Data</h3>
                    <p className="text-sm text-gray-600">
                      Download all conversation data
                    </p>
                  </div>
                  <BrutalButton variant="blue">DOWNLOAD</BrutalButton>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-avotica font-bold">Delete All Data</h3>
                    <p className="text-sm text-gray-600">
                      Permanently remove all information
                    </p>
                  </div>
                  <BrutalButton variant="red">DELETE</BrutalButton>
                </div>
              </div>
            </BrutalCard>
          </div>
        )}
      </div>
    </div>
  );
}
