import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useUser } from '@clerk/nextjs';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import ParentDashboardOverview from '@/app/(parent)/dashboard/page';
import ChildProfileCreator from '@/components/parent/ChildProfileCreator';
import ActivityCard from '@/components/parent/ActivityCard';
import AlertCenter from '@/components/parent/AlertCenter';
import MoodChart from '@/components/parent/MoodChart';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock the UI components
vi.mock('@/components/ui/BrutalCard', () => ({
  default: function BrutalCard({ children, className, variant }: any) {
    return <div className={`brutal-card ${variant} ${className}`}>{children}</div>;
  },
}));

vi.mock('@/components/ui/BrutalButton', () => ({
  default: function BrutalButton({ children, onClick, variant, size, disabled }: any) {
    return (
      <button 
        onClick={onClick} 
        className={`brutal-button ${variant} ${size}`}
        disabled={disabled}
      >
        {children}
      </button>
    );
  },
}));

vi.mock('@/components/ui/BrutalInput', () => ({
  default: function BrutalInput({ onChange, value, ...props }: any) {
    return (
      <input 
        {...props}
        value={value}
        onChange={onChange}
      />
    );
  },
}));

const mockUser = {
  id: 'user_123',
  emailAddresses: [{ emailAddress: 'parent@test.com' }],
};

const mockChildren = [
  {
    id: 'child_1',
    name: 'Emma',
    username: 'emma_cool',
    age: 9,
    createdAt: '2024-01-01T00:00:00Z',
    accountStatus: 'active',
  },
  {
    id: 'child_2',
    name: 'Jake',
    username: 'jake_awesome',
    age: 11,
    createdAt: '2024-01-01T00:00:00Z',
    accountStatus: 'active',
  },
];

const mockUsageData = [
  {
    id: 'usage_1',
    date: '2024-12-15',
    totalMinutes: 45,
    sessionCount: 3,
    messagesSent: 25,
    topicsDiscussed: ['math', 'science', 'friendship'],
    moodSummary: 'happy and excited about learning',
    safetyEvents: 0,
    escalationEvents: 0,
    engagementScore: 0.85,
  },
  {
    id: 'usage_2',
    date: '2024-12-14',
    totalMinutes: 30,
    sessionCount: 2,
    messagesSent: 18,
    topicsDiscussed: ['art', 'creativity'],
    moodSummary: 'calm and creative',
    safetyEvents: 0,
    escalationEvents: 0,
    engagementScore: 0.75,
  },
];

const mockAlerts = [
  {
    id: 'alert_1',
    eventType: 'inappropriate_language',
    severityLevel: 2,
    detectedAt: '2024-12-15T10:00:00Z',
    status: 'active',
    childName: 'Emma',
    triggerContent: 'Some concerning message content',
    resolved: false,
  },
];

describe('ParentDashboardOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useUser as any).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    });

    // Mock successful API responses with proper routing
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/children')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockChildren,
        });
      }
      if (url.includes('/api/usage')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockUsageData,
        });
      }
      if (url.includes('/api/safety/alerts')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockAlerts,
        });
      }
      if (url.includes('/api/parent/settings')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            emailSummaryEnabled: true,
            emailSummaryFrequency: 'weekly',
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  it('renders loading state initially', () => {
    (useUser as any).mockReturnValue({
      user: null,
      isLoaded: false,
    });

    render(<ParentDashboardOverview />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders dashboard with children data', async () => {
    render(<ParentDashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText('PARENT DASHBOARD')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Emma (9)')).toBeInTheDocument();
      expect(screen.getByText('Jake (11)')).toBeInTheDocument();
    });
  });

  it('renders no children state when no children exist', async () => {
    // Override fetch mock for this specific test
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/children')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (url.includes('/api/usage')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (url.includes('/api/safety/alerts')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (url.includes('/api/parent/settings')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            emailSummaryEnabled: true,
            emailSummaryFrequency: 'weekly',
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    render(<ParentDashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText('GET STARTED')).toBeInTheDocument();
      expect(screen.getByText('ADD CHILD ACCOUNT')).toBeInTheDocument();
    });
  });

  it('opens child creator modal when add child button is clicked', async () => {
    render(<ParentDashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText('+ ADD CHILD')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ ADD CHILD'));

    await waitFor(() => {
      expect(screen.getByText('ADD CHILD ACCOUNT')).toBeInTheDocument();
    });
  });

  it('handles child selection correctly', async () => {
    render(<ParentDashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText('Emma (9)')).toBeInTheDocument();
    });

    // First child should be auto-selected
    const emmaButton = screen.getByText('Emma (9)');
    expect(emmaButton).toHaveClass('brutal-button blue');

    // Click on Jake to select him
    fireEvent.click(screen.getByText('Jake (11)'));
    
    await waitFor(() => {
      const jakeButton = screen.getByText('Jake (11)');
      expect(jakeButton).toHaveClass('brutal-button blue');
    });
  });

  it('displays quick stats correctly', async () => {
    render(<ParentDashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText('QUICK STATS')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total Children
      expect(screen.getByText('5')).toBeInTheDocument(); // This Week's Sessions (3+2)
      expect(screen.getByText('75 min')).toBeInTheDocument(); // Total Chat Time (45+30)
      expect(screen.getByText('1')).toBeInTheDocument(); // Active Alerts
    });
  });
});

describe('ChildProfileCreator', () => {
  const mockOnChildCreated = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    render(
      <ChildProfileCreator 
        onChildCreated={mockOnChildCreated}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByPlaceholderText('Emma Smith')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('emma_cool')).toBeInTheDocument();
    expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Age input
    expect(screen.getByText('CREATE ACCOUNT')).toBeInTheDocument();
    expect(screen.getByText('CANCEL')).toBeInTheDocument();
  });

  it('validates form inputs correctly', async () => {
    render(
      <ChildProfileCreator 
        onChildCreated={mockOnChildCreated}
        onCancel={mockOnCancel}
      />
    );

    // Try to submit empty form
    fireEvent.click(screen.getByText('CREATE ACCOUNT'));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Username is required')).toBeInTheDocument();
      expect(screen.getByText('Age is required')).toBeInTheDocument();
      expect(screen.getByText('PIN is required')).toBeInTheDocument();
    });
  });

  it('validates age range correctly', async () => {
    render(
      <ChildProfileCreator 
        onChildCreated={mockOnChildCreated}
        onCancel={mockOnCancel}
      />
    );

    const ageInput = screen.getByPlaceholderText('9');
    
    // Test age too low
    fireEvent.change(ageInput, { target: { value: '5' } });
    fireEvent.click(screen.getByText('CREATE ACCOUNT'));

    await waitFor(() => {
      expect(screen.getByText('Age must be between 6 and 12')).toBeInTheDocument();
    });

    // Test age too high
    fireEvent.change(ageInput, { target: { value: '13' } });
    fireEvent.click(screen.getByText('CREATE ACCOUNT'));

    await waitFor(() => {
      expect(screen.getByText('Age must be between 6 and 12')).toBeInTheDocument();
    });
  });

  it('validates PIN confirmation', async () => {
    render(
      <ChildProfileCreator 
        onChildCreated={mockOnChildCreated}
        onCancel={mockOnCancel}
      />
    );

    const pinInputs = screen.getAllByPlaceholderText('••••');
    
    fireEvent.change(pinInputs[0], { target: { value: '1234' } });
    fireEvent.change(pinInputs[1], { target: { value: '5678' } });
    fireEvent.click(screen.getByText('CREATE ACCOUNT'));

    await waitFor(() => {
      expect(screen.getByText('PINs do not match')).toBeInTheDocument();
    });
  });

  it('submits form successfully with valid data', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        child: {
          id: 'new_child_id',
          name: 'Test Child',
          username: 'testchild',
          age: 8,
          createdAt: '2024-12-15T00:00:00Z',
          accountStatus: 'active',
        },
      }),
    });

    render(
      <ChildProfileCreator 
        onChildCreated={mockOnChildCreated}
        onCancel={mockOnCancel}
      />
    );

    // Fill out form
    fireEvent.change(screen.getByPlaceholderText('Emma Smith'), { 
      target: { value: 'Test Child' } 
    });
    fireEvent.change(screen.getByPlaceholderText('emma_cool'), { 
      target: { value: 'testchild' } 
    });
    fireEvent.change(screen.getByPlaceholderText('9'), { 
      target: { value: '8' } 
    });
    
    const pinInputs = screen.getAllByPlaceholderText('••••');
    fireEvent.change(pinInputs[0], { target: { value: '1234' } });
    fireEvent.change(pinInputs[1], { target: { value: '1234' } });

    fireEvent.click(screen.getByText('CREATE ACCOUNT'));

    await waitFor(() => {
      expect(mockOnChildCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Child',
          username: 'testchild',
          age: 8,
        })
      );
    });
  });

  it('handles API errors correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Username already exists',
      }),
    });

    render(
      <ChildProfileCreator 
        onChildCreated={mockOnChildCreated}
        onCancel={mockOnCancel}
      />
    );

    // Fill out form with valid data
    fireEvent.change(screen.getByPlaceholderText('Emma Smith'), { 
      target: { value: 'Test Child' } 
    });
    fireEvent.change(screen.getByPlaceholderText('emma_cool'), { 
      target: { value: 'existinguser' } 
    });
    fireEvent.change(screen.getByPlaceholderText('9'), { 
      target: { value: '8' } 
    });
    
    const pinInputs = screen.getAllByPlaceholderText('••••');
    fireEvent.change(pinInputs[0], { target: { value: '1234' } });
    fireEvent.change(pinInputs[1], { target: { value: '1234' } });

    fireEvent.click(screen.getByText('CREATE ACCOUNT'));

    await waitFor(() => {
      expect(screen.getByText('This username is already taken')).toBeInTheDocument();
    });
  });
});

describe('ActivityCard', () => {
  const mockUsage = {
    id: 'usage_1',
    date: '2024-12-15',
    totalMinutes: 45,
    sessionCount: 3,
    messagesSent: 25,
    topicsDiscussed: ['math', 'science', 'friendship'],
    moodSummary: 'happy and excited about learning',
    safetyEvents: 0,
    escalationEvents: 0,
    engagementScore: 0.85,
  };

  it('renders activity data correctly', () => {
    render(<ActivityCard usage={mockUsage} childName="Emma" />);

    expect(screen.getByText('45')).toBeInTheDocument(); // minutes
    expect(screen.getByText('3')).toBeInTheDocument(); // sessions
    expect(screen.getByText('25')).toBeInTheDocument(); // messages
    expect(screen.getByText('Emma')).toBeInTheDocument(); // child name
    expect(screen.getByText('✅ Safe')).toBeInTheDocument(); // safety status
  });

  it('displays mood summary correctly', () => {
    render(<ActivityCard usage={mockUsage} childName="Emma" />);

    expect(screen.getByText('happy and excited about learning')).toBeInTheDocument();
    expect(screen.getByText('😊')).toBeInTheDocument(); // happy emoji
  });

  it('displays topics correctly', () => {
    render(<ActivityCard usage={mockUsage} childName="Emma" />);

    expect(screen.getByText('math')).toBeInTheDocument();
    expect(screen.getByText('science')).toBeInTheDocument();
    expect(screen.getByText('friendship')).toBeInTheDocument();
  });

  it('displays safety alerts when present', () => {
    const usageWithAlerts = {
      ...mockUsage,
      safetyEvents: 2,
    };

    render(<ActivityCard usage={usageWithAlerts} childName="Emma" />);

    expect(screen.getByText('⚠️ 2 Alerts')).toBeInTheDocument();
  });

  it('displays no activity state correctly', () => {
    const noActivityUsage = {
      ...mockUsage,
      totalMinutes: 0,
      sessionCount: 0,
      messagesSent: 0,
    };

    render(<ActivityCard usage={noActivityUsage} childName="Emma" />);

    expect(screen.getByText('💤')).toBeInTheDocument();
    expect(screen.getByText('No chat activity')).toBeInTheDocument();
  });

  it('displays engagement score correctly', () => {
    render(<ActivityCard usage={mockUsage} childName="Emma" />);

    expect(screen.getByText('Excellent (85%)')).toBeInTheDocument();
  });
});

describe('AlertCenter', () => {
  const mockAlerts = [
    {
      id: 'alert_1',
      eventType: 'inappropriate_language',
      severityLevel: 2,
      detectedAt: '2024-12-15T10:00:00Z',
      status: 'active',
      childName: 'Emma',
      triggerContent: 'Some concerning message content',
      resolved: false,
    },
    {
      id: 'alert_2',
      eventType: 'emotional_distress',
      severityLevel: 3,
      detectedAt: '2024-12-14T15:30:00Z',
      status: 'resolved',
      childName: 'Jake',
      triggerContent: 'Child expressed sadness',
      resolved: true,
    },
  ];

  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders alert summary correctly', () => {
    render(<AlertCenter alerts={mockAlerts} onRefresh={mockOnRefresh} />);

    expect(screen.getByText('ALERT CENTER')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Active alerts
    expect(screen.getByText('1')).toBeInTheDocument(); // Resolved alerts
  });

  it('displays active alerts', () => {
    render(<AlertCenter alerts={mockAlerts} onRefresh={mockOnRefresh} />);

    expect(screen.getByText('Inappropriate Language')).toBeInTheDocument();
    expect(screen.getByText('Emma')).toBeInTheDocument();
    expect(screen.getByText('🔶')).toBeInTheDocument(); // Medium severity icon
  });

  it('opens alert detail modal when alert is clicked', async () => {
    render(<AlertCenter alerts={mockAlerts} onRefresh={mockOnRefresh} />);

    fireEvent.click(screen.getByText('Inappropriate Language'));

    await waitFor(() => {
      expect(screen.getByText('Some concerning message content')).toBeInTheDocument();
      expect(screen.getByText('MARK RESOLVED')).toBeInTheDocument();
    });
  });

  it('handles alert resolution', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AlertCenter alerts={mockAlerts} onRefresh={mockOnRefresh} />);

    fireEvent.click(screen.getByText('Inappropriate Language'));

    await waitFor(() => {
      expect(screen.getByText('MARK RESOLVED')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('MARK RESOLVED'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/safety/alerts/alert_1/resolve',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resolution: 'reviewed_by_parent',
            notes: 'Reviewed and acknowledged by parent via dashboard',
          }),
        })
      );
      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  it('displays no alerts state', () => {
    render(<AlertCenter alerts={[]} onRefresh={mockOnRefresh} />);

    expect(screen.getByText('🛡️')).toBeInTheDocument();
    expect(screen.getByText('No safety alerts')).toBeInTheDocument();
    expect(screen.getByText('All conversations are safe!')).toBeInTheDocument();
  });
});

describe('MoodChart', () => {
  const mockUsageData = [
    {
      id: 'usage_1',
      date: '2024-12-13',
      totalMinutes: 30,
      sessionCount: 2,
      messagesSent: 15,
      topicsDiscussed: ['math'],
      moodSummary: 'happy',
      safetyEvents: 0,
      escalationEvents: 0,
      engagementScore: 0.8,
    },
    {
      id: 'usage_2',
      date: '2024-12-14',
      totalMinutes: 25,
      sessionCount: 1,
      messagesSent: 12,
      topicsDiscussed: ['art'],
      moodSummary: 'excited',
      safetyEvents: 0,
      escalationEvents: 0,
      engagementScore: 0.9,
    },
    {
      id: 'usage_3',
      date: '2024-12-15',
      totalMinutes: 40,
      sessionCount: 3,
      messagesSent: 22,
      topicsDiscussed: ['science'],
      moodSummary: 'sad',
      safetyEvents: 0,
      escalationEvents: 0,
      engagementScore: 0.6,
    },
  ];

  it('renders mood chart with data', () => {
    render(<MoodChart childId="child_1" usageData={mockUsageData} />);

    expect(screen.getByText('MOOD TRENDS')).toBeInTheDocument();
    expect(screen.getByText('Average Mood')).toBeInTheDocument();
    expect(screen.getByText('Days Tracked')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // 3 days tracked
  });

  it('displays mood trend correctly', () => {
    render(<MoodChart childId="child_1" usageData={mockUsageData} />);

    // Should show declining trend (happy -> excited -> sad)
    expect(screen.getByText('📉 Declining')).toBeInTheDocument();
  });

  it('displays no child selected state', () => {
    render(<MoodChart childId={null} usageData={[]} />);

    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('Select a child to view mood trends')).toBeInTheDocument();
  });

  it('displays no data state', () => {
    render(<MoodChart childId="child_1" usageData={[]} />);

    expect(screen.getByText('😐')).toBeInTheDocument();
    expect(screen.getByText('No mood data available yet')).toBeInTheDocument();
  });

  it('displays recent mood summary', () => {
    render(<MoodChart childId="child_1" usageData={mockUsageData} />);

    expect(screen.getByText('Recent Mood Summary')).toBeInTheDocument();
    // Should show last 3 entries with dates and message counts
    expect(screen.getByText('15 messages')).toBeInTheDocument();
    expect(screen.getByText('12 messages')).toBeInTheDocument();
    expect(screen.getByText('22 messages')).toBeInTheDocument();
  });
});