import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useUser } from '@clerk/nextjs';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import AlertManagement from '@/app/(parent)/alerts/page';

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
  },
  {
    id: 'child_2',
    name: 'Jake',
    username: 'jake_awesome',
    age: 11,
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
  {
    id: 'alert_3',
    eventType: 'personal_info_shared',
    severityLevel: 1,
    detectedAt: '2024-12-13T09:15:00Z',
    status: 'active',
    childName: 'Emma',
    triggerContent: 'Mentioned school name',
    resolved: false,
  },
];

describe('AlertManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useUser as any).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    });

    // Mock successful API responses with proper routing
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/safety/alerts') && !url.includes('batch-resolve') && !url.includes('transcript')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockAlerts,
        });
      }
      if (url.includes('/api/children')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockChildren,
        });
      }
      if (url.includes('/api/safety/alerts/batch-resolve')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            resolvedCount: 2,
            message: 'Successfully resolved 2 alerts',
          }),
        });
      }
      if (url.includes('/api/safety/alerts/') && url.includes('/transcript')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            alert: mockAlerts[0],
            transcript: {
              conversationId: 'conv_1',
              messages: [
                {
                  id: 'msg_1',
                  content: 'Hello there',
                  role: 'user',
                  timestamp: '2024-12-15T10:00:00Z',
                },
                {
                  id: 'msg_2',
                  content: 'Hi! How are you?',
                  role: 'assistant',
                  timestamp: '2024-12-15T10:00:05Z',
                },
              ],
            },
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

    render(<AlertManagement />);
    expect(screen.getByText('Loading alerts...')).toBeInTheDocument();
  });

  it('renders alert management page with alerts', async () => {
    render(<AlertManagement />);

    await waitFor(() => {
      expect(screen.getByText('ALERT MANAGEMENT')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Inappropriate Language')).toBeInTheDocument();
      expect(screen.getByText('Emotional Distress')).toBeInTheDocument();
      expect(screen.getByText('Personal Info Shared')).toBeInTheDocument();
    });
  });

  it('displays filter controls', async () => {
    render(<AlertManagement />);

    await waitFor(() => {
      expect(screen.getByText('FILTERS')).toBeInTheDocument();
    });

    // Check filter labels
    expect(screen.getByText('Severity')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Child')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('Event Type')).toBeInTheDocument();
  });

  it('filters alerts by severity level', async () => {
    render(<AlertManagement />);

    await waitFor(() => {
      expect(screen.getByText('Inappropriate Language')).toBeInTheDocument();
    });

    // Filter by high severity (level 3)
    const severitySelect = screen.getByDisplayValue('All Levels');
    fireEvent.change(severitySelect, { target: { value: '3' } });

    await waitFor(() => {
      expect(screen.getByText('Emotional Distress')).toBeInTheDocument();
      expect(screen.queryByText('Inappropriate Language')).not.toBeInTheDocument();
      expect(screen.queryByText('Personal Info Shared')).not.toBeInTheDocument();
    });
  });

  it('filters alerts by status', async () => {
    render(<AlertManagement />);

    await waitFor(() => {
      expect(screen.getByText('Inappropriate Language')).toBeInTheDocument();
    });

    // Filter by resolved status
    const statusSelect = screen.getByDisplayValue('All Status');
    fireEvent.change(statusSelect, { target: { value: 'resolved' } });

    await waitFor(() => {
      expect(screen.getByText('Emotional Distress')).toBeInTheDocument();
      expect(screen.queryByText('Inappropriate Language')).not.toBeInTheDocument();
      expect(screen.queryByText('Personal Info Shared')).not.toBeInTheDocument();
    });
  });

  it('filters alerts by child name', async () => {
    render(<AlertManagement />);

    await waitFor(() => {
      expect(screen.getByText('Inappropriate Language')).toBeInTheDocument();
    });

    // Filter by Emma
    const childSelect = screen.getByDisplayValue('All Children');
    fireEvent.change(childSelect, { target: { value: 'Emma' } });

    await waitFor(() => {
      expect(screen.getByText('Inappropriate Language')).toBeInTheDocument();
      expect(screen.getByText('Personal Info Shared')).toBeInTheDocument();
      expect(screen.queryByText('Emotional Distress')).not.toBeInTheDocument();
    });
  });

  it('selects and deselects alerts', async () => {
    render(<AlertManagement />);

    await waitFor(() => {
      expect(screen.getByText('Inappropriate Language')).toBeInTheDocument();
    });

    // Find checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(3); // Alert checkboxes + select all

    // Click first alert checkbox
    fireEvent.click(checkboxes[1]); // Skip the "Select All" checkbox

    await waitFor(() => {
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });
  });

  it('selects all alerts', async () => {
    render(<AlertManagement />);

    await waitFor(() => {
      expect(screen.getByText('Select All (3 alerts)')).toBeInTheDocument();
    });

    // Click select all checkbox
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /Select All/ });
    fireEvent.click(selectAllCheckbox);

    await waitFor(() => {
      expect(screen.getByText('3 selected')).toBeInTheDocument();
    });
  });

  it('performs batch resolve action', async () => {
    render(<AlertManagement />);

    await waitFor(() => {
      expect(screen.getByText('Select All (3 alerts)')).toBeInTheDocument();
    });

    // Select some alerts
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /Select All/ });
    fireEvent.click(selectAllCheckbox);

    await waitFor(() => {
      expect(screen.getByText('3 selected')).toBeInTheDocument();
    });

    // Click resolve button
    const resolveButton = screen.getByText('RESOLVE SELECTED (3)');
    fireEvent.click(resolveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/safety/alerts/batch-resolve',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"alertIds":'),
        })
      );
    });
  });

  it('opens transcript modal', async () => {
    render(<AlertManagement />);

    await waitFor(() => {
      expect(screen.getByText('Inappropriate Language')).toBeInTheDocument();
    });

    // Click view transcript button
    const transcriptButtons = screen.getAllByText('VIEW TRANSCRIPT');
    fireEvent.click(transcriptButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('CONVERSATION TRANSCRIPT')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/safety/alerts/alert_1/transcript'
      );
    });
  });

  it('closes transcript modal', async () => {
    render(<AlertManagement />);

    await waitFor(() => {
      expect(screen.getByText('Inappropriate Language')).toBeInTheDocument();
    });

    // Open transcript modal
    const transcriptButtons = screen.getAllByText('VIEW TRANSCRIPT');
    fireEvent.click(transcriptButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('CONVERSATION TRANSCRIPT')).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('CONVERSATION TRANSCRIPT')).not.toBeInTheDocument();
    });
  });

  it('displays correct alert severity badges', async () => {
    render(<AlertManagement />);

    await waitFor(() => {
      expect(screen.getByText('Medium Priority')).toBeInTheDocument(); // alert_1
      expect(screen.getByText('High Priority')).toBeInTheDocument(); // alert_2
      expect(screen.getByText('Low Priority')).toBeInTheDocument(); // alert_3
    });
  });

  it('displays correct alert status badges', async () => {
    render(<AlertManagement />);

    await waitFor(() => {
      const activeBadges = screen.getAllByText('🔴 Active');
      const resolvedBadges = screen.getAllByText('✅ Resolved');
      
      expect(activeBadges.length).toBe(2); // alerts 1 and 3
      expect(resolvedBadges.length).toBe(1); // alert 2
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    render(<AlertManagement />);

    await waitFor(() => {
      expect(screen.getByText('🔄 REFRESH')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('🔄 REFRESH');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/safety/alerts');
      expect(global.fetch).toHaveBeenCalledWith('/api/children');
    });
  });

  it('shows no alerts message when filtered results are empty', async () => {
    // Override to return no alerts
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/safety/alerts')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (url.includes('/api/children')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockChildren,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    render(<AlertManagement />);

    await waitFor(() => {
      expect(screen.getByText('No alerts match your filters')).toBeInTheDocument();
    });
  });
});