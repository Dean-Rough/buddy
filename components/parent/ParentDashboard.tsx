'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import BrutalCard from '@/components/ui/BrutalCard';
import BrutalButton from '@/components/ui/BrutalButton';
import BrutalInput from '@/components/ui/BrutalInput';

interface ChildAccount {
  id: string;
  name: string;
  username: string;
  age: number;
  parentNotes?: string;
}

interface ParentSettings {
  dailyTimeLimitMinutes?: number;
  emailSummaryEnabled: boolean;
  summaryEmail?: string;
  emailSummaryFrequency: string;
  dataRetentionDays?: number;
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
  const { user, isLoaded } = useUser();
  const [child, setChild] = useState<ChildAccount | null>(null);
  const [settings, setSettings] = useState<ParentSettings>({
    emailSummaryEnabled: true,
    emailSummaryFrequency: 'weekly',
  });
  const [usage, setUsage] = useState<DailyUsage[]>([]);
  const [activeTab, setActiveTab] = useState<
    'info' | 'time' | 'summaries' | 'privacy'
  >('info');
  const [loading, setLoading] = useState(true);
  const [editingChildName, setEditingChildName] = useState(false);
  const [editingChildNotes, setEditingChildNotes] = useState(false);
  const [tempChildName, setTempChildName] = useState('');
  const [tempChildNotes, setTempChildNotes] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load child (assuming first/primary child for now)
      const childrenResponse = await fetch('/api/children');
      if (childrenResponse.ok) {
        const childrenData = await childrenResponse.json();
        if (childrenData.length > 0) {
          setChild(childrenData[0]); // Use first child
        }
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

  const updateChildInfo = async (
    field: 'name' | 'parentNotes',
    value: string
  ) => {
    if (!child) return;

    try {
      const response = await fetch(`/api/children/${child.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        setChild({ ...child, [field]: value });
        if (field === 'name') {
          setEditingChildName(false);
        } else {
          setEditingChildNotes(false);
        }
      }
    } catch (error) {
      console.error(`Error updating child ${field}:`, error);
    }
  };

  const startEditingName = () => {
    setEditingChildName(true);
    setTempChildName(child?.name || '');
  };

  const startEditingNotes = () => {
    setEditingChildNotes(true);
    setTempChildNotes(child?.parentNotes || '');
  };

  const cancelEditing = (field: 'name' | 'notes') => {
    if (field === 'name') {
      setEditingChildName(false);
      setTempChildName('');
    } else {
      setEditingChildNotes(false);
      setTempChildNotes('');
    }
  };

  if (!isLoaded || loading) {
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
          <div>
            <h1 className="font-rokano text-4xl">PARENT DASHBOARD</h1>
            {child && (
              <h2 className="font-avotica text-xl text-gray-600 mt-2">
                Managing {child.name}'s Account
              </h2>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Welcome back, {user?.emailAddresses[0]?.emailAddress}
            </div>
            <BrutalButton
              variant="blue"
              onClick={() => (window.location.href = '/chat')}
            >
              BACK TO CHAT
            </BrutalButton>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: 'info', label: 'CHILD INFO' },
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
        {activeTab === 'info' && child && (
          <div className="grid gap-6">
            {/* Child Basic Info */}
            <BrutalCard variant="blue">
              <h2 className="font-rokano text-2xl mb-4">BASIC INFO</h2>
              <div className="space-y-4">
                <div>
                  <label className="block font-avotica font-bold mb-2">
                    Child's Name
                  </label>
                  {editingChildName ? (
                    <div className="flex items-center gap-2">
                      <BrutalInput
                        value={tempChildName}
                        onChange={e => setTempChildName(e.target.value)}
                        className="flex-1"
                        placeholder="Child's name"
                      />
                      <BrutalButton
                        variant="green"
                        size="small"
                        onClick={() => updateChildInfo('name', tempChildName)}
                      >
                        SAVE
                      </BrutalButton>
                      <BrutalButton
                        variant="white"
                        size="small"
                        onClick={() => cancelEditing('name')}
                      >
                        CANCEL
                      </BrutalButton>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-avotica text-lg">{child.name}</span>
                      <BrutalButton
                        variant="white"
                        size="small"
                        onClick={startEditingName}
                      >
                        EDIT
                      </BrutalButton>
                    </div>
                  )}
                </div>

                <div>
                  <span className="font-avotica font-bold">Username:</span> @
                  {child.username}
                </div>
                <div>
                  <span className="font-avotica font-bold">Age:</span>{' '}
                  {child.age}
                </div>
              </div>
            </BrutalCard>

            {/* Sensitivities */}
            <BrutalCard variant="pink">
              <h2 className="font-rokano text-2xl mb-4">SENSITIVITIES</h2>
              <p className="text-sm text-gray-700 mb-4">
                Share important information about your child that Onda should be
                aware of - allergies, disabilities, physical limitations,
                emotional sensitivities, or anything that helps provide
                appropriate responses.
              </p>

              {editingChildNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={tempChildNotes}
                    onChange={e => setTempChildNotes(e.target.value)}
                    className="w-full p-3 border-3 border-black brutal-shadow-small resize-none"
                    rows={4}
                    placeholder="e.g., Has a nut allergy, uses a wheelchair, gets anxious about loud noises, loves art but struggles with reading..."
                  />
                  <div className="flex gap-2">
                    <BrutalButton
                      variant="green"
                      onClick={() =>
                        updateChildInfo('parentNotes', tempChildNotes)
                      }
                    >
                      SAVE NOTES
                    </BrutalButton>
                    <BrutalButton
                      variant="white"
                      onClick={() => cancelEditing('notes')}
                    >
                      CANCEL
                    </BrutalButton>
                  </div>
                </div>
              ) : (
                <div>
                  {child.parentNotes ? (
                    <div className="bg-white/50 p-4 brutal-shadow-small mb-3">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {child.parentNotes}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-100 p-4 brutal-shadow-small mb-3 text-center">
                      <p className="text-gray-600">
                        No sensitivities noted yet
                      </p>
                    </div>
                  )}
                  <BrutalButton variant="blue" onClick={startEditingNotes}>
                    {child.parentNotes ? 'EDIT NOTES' : 'ADD NOTES'}
                  </BrutalButton>
                </div>
              )}
            </BrutalCard>

            {/* Recent Activity */}
            <BrutalCard variant="yellow">
              <h2 className="font-rokano text-2xl mb-4">RECENT ACTIVITY</h2>
              {usage.length > 0 ? (
                <div className="grid gap-3">
                  {usage.slice(0, 7).map(day => (
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
            <BrutalCard variant="pink">
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
            <BrutalCard variant="blue">
              <h2 className="font-rokano text-2xl mb-4">EMAIL SUMMARIES</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="emailEnabled"
                    checked={settings.emailSummaryEnabled}
                    onChange={e =>
                      updateSettings({
                        emailSummaryEnabled: e.target.checked,
                      })
                    }
                    className="h-5 w-5 border-black"
                  />
                  <label
                    htmlFor="emailEnabled"
                    className="font-avotica font-bold"
                  >
                    Enable Email Summaries
                  </label>
                </div>

                <div>
                  <label className="block font-avotica font-bold mb-2">
                    Email Address
                  </label>
                  <BrutalInput
                    type="email"
                    value={
                      settings.summaryEmail ||
                      user?.emailAddresses[0]?.emailAddress ||
                      ''
                    }
                    onChange={e =>
                      updateSettings({ summaryEmail: e.target.value })
                    }
                    placeholder="parent@example.com"
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
                    className="w-full p-3 border-3 border-black brutal-shadow-small"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </BrutalCard>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="grid gap-6">
            <BrutalCard variant="white">
              <h2 className="font-rokano text-2xl mb-4">PRIVACY SETTINGS</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-avotica font-bold mb-2">
                    Data Retention Policy
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Choose how long conversation data is stored before being
                    automatically deleted.
                  </p>
                  <select
                    className="w-full p-3 border-3 border-black brutal-shadow-small"
                    value={settings.dataRetentionDays || 90}
                    onChange={e =>
                      updateSettings({
                        dataRetentionDays: parseInt(e.target.value),
                      })
                    }
                  >
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-avotica font-bold mb-2">
                    Delete All Data
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    This will permanently delete all conversation history and
                    usage data for all children. This action cannot be undone.
                  </p>
                  <BrutalButton variant="red" size="normal">
                    DELETE ALL DATA
                  </BrutalButton>
                </div>
              </div>
            </BrutalCard>
          </div>
        )}
      </div>
    </div>
  );
}
