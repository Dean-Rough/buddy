'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import ChildProfileCreator from '@/components/parent/ChildProfileCreator';
import ActivityCard from '@/components/parent/ActivityCard';
import AlertCenter from '@/components/parent/AlertCenter';
import MoodChart from '@/components/parent/MoodChart';
import BrutalCard from '@/components/ui/BrutalCard';
import BrutalButton from '@/components/ui/BrutalButton';

interface ChildAccount {
  id: string;
  name: string;
  username: string;
  age: number;
  createdAt: string;
  accountStatus: string;
}

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

interface SafetyAlert {
  id: string;
  eventType: string;
  severityLevel: number;
  detectedAt: string;
  status: string;
  childName: string;
  triggerContent: string;
  resolved: boolean;
}

interface ParentSettings {
  emailSummaryEnabled: boolean;
  emailSummaryFrequency: string;
}

export default function ParentDashboardOverview() {
  const { user, isLoaded } = useUser();
  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [settings, setSettings] = useState<ParentSettings>({
    emailSummaryEnabled: true,
    emailSummaryFrequency: 'weekly',
  });
  const [recentUsage, setRecentUsage] = useState<DailyUsage[]>([]);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [showChildCreator, setShowChildCreator] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      // Load children
      const childrenResponse = await fetch('/api/children');
      if (childrenResponse.ok) {
        const childrenData = await childrenResponse.json();
        setChildren(childrenData);
        if (childrenData.length > 0 && !selectedChild) {
          setSelectedChild(childrenData[0].id);
        }
      }

      // Load usage data
      const usageResponse = await fetch('/api/usage');
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setRecentUsage(usageData);
      }

      // Load safety alerts
      const alertsResponse = await fetch('/api/safety/alerts');
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setSafetyAlerts(alertsData);
      }

      // Load parent settings
      const settingsResponse = await fetch('/api/parent/settings');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      loadDashboardData();
    }
  }, [isLoaded, loadDashboardData]);

  const handleChildCreated = (newChild: ChildAccount) => {
    setChildren([...children, newChild]);
    setSelectedChild(newChild.id);
    setShowChildCreator(false);
    loadDashboardData(); // Refresh data
  };

  const getSelectedChildUsage = () => {
    if (!selectedChild) return [];
    return recentUsage.filter(_usage =>
      children.find(child => child.id === selectedChild)
    );
  };

  const getSelectedChildAlerts = () => {
    if (!selectedChild) return [];
    const selectedChildName = children.find(
      child => child.id === selectedChild
    )?.name;
    return safetyAlerts.filter(alert => alert.childName === selectedChildName);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#FFF8E1] flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8E1] flex items-center justify-center">
        <div className="text-xl">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8E1] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-rokano text-4xl mb-2">PARENT DASHBOARD</h1>
            <p className="text-lg text-gray-600">
              Child profile management, activity summaries, recent alerts, and
              mood trends
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Welcome back,</p>
            <p className="font-avotica font-bold">
              {user?.emailAddresses[0]?.emailAddress}
            </p>
          </div>
        </div>

        {/* Child Selector */}
        {children.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-avotica font-bold">Select Child:</span>
              {children.map(child => (
                <BrutalButton
                  key={child.id}
                  variant={selectedChild === child.id ? 'blue' : 'white'}
                  size="small"
                  onClick={() => setSelectedChild(child.id)}
                >
                  {child.name} ({child.age})
                </BrutalButton>
              ))}
              <BrutalButton
                variant="green"
                size="small"
                onClick={() => setShowChildCreator(true)}
              >
                + ADD CHILD
              </BrutalButton>
            </div>
          </div>
        )}

        {/* Main Dashboard Grid */}
        {children.length === 0 ? (
          /* No Children State */
          <div className="flex items-center justify-center min-h-[400px]">
            <BrutalCard variant="blue" className="max-w-md">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
                <h2 className="font-rokano text-2xl mb-4">GET STARTED</h2>
                <p className="text-gray-600 mb-6">
                  Add your first child account to begin monitoring their digital
                  wellbeing and safety with Onda AI.
                </p>
                <BrutalButton
                  variant="green"
                  size="large"
                  onClick={() => setShowChildCreator(true)}
                >
                  ADD CHILD ACCOUNT
                </BrutalButton>
              </div>
            </BrutalCard>
          </div>
        ) : (
          /* Dashboard with Data */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Activity Summary Cards */}
            <div className="xl:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getSelectedChildUsage()
                  .slice(0, 4)
                  .map(usage => (
                    <ActivityCard
                      key={usage.id}
                      usage={usage}
                      childName={
                        children.find(c => c.id === selectedChild)?.name || ''
                      }
                    />
                  ))}
              </div>

              {/* Mood Chart */}
              <MoodChart
                childId={selectedChild}
                usageData={getSelectedChildUsage()}
              />
            </div>

            {/* Alert Center Sidebar */}
            <div className="space-y-6">
              <AlertCenter
                alerts={getSelectedChildAlerts()}
                onRefresh={loadDashboardData}
              />

              {/* Quick Stats */}
              <BrutalCard variant="yellow">
                <h3 className="font-rokano text-xl mb-4">QUICK STATS</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Total Children:</span>
                    <span className="font-bold">{children.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Week's Sessions:</span>
                    <span className="font-bold">
                      {getSelectedChildUsage().reduce(
                        (sum, usage) => sum + usage.sessionCount,
                        0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Chat Time:</span>
                    <span className="font-bold">
                      {getSelectedChildUsage().reduce(
                        (sum, usage) => sum + usage.totalMinutes,
                        0
                      )} min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Alerts:</span>
                    <span className="font-bold text-red-600">
                      {
                        getSelectedChildAlerts().filter(
                          alert => !alert.resolved
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </BrutalCard>
            </div>
          </div>
        )}

        {/* Child Creator Modal */}
        {showChildCreator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-md w-full brutal-shadow-large border-3 border-black">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-rokano text-2xl">ADD CHILD ACCOUNT</h2>
                  <BrutalButton
                    variant="red"
                    size="small"
                    onClick={() => setShowChildCreator(false)}
                  >
                    ✕
                  </BrutalButton>
                </div>
                <ChildProfileCreator
                  onChildCreated={handleChildCreated}
                  onCancel={() => setShowChildCreator(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
