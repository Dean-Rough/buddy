import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import WeeklySummaryManager from '@/components/parent/WeeklySummaryManager';

// Mock fetch
global.fetch = vi.fn();

// Mock the UI components
vi.mock('@/components/ui/BrutalCard', () => ({
  default: function BrutalCard({ children, className, variant }: any) {
    return (
      <div className={`brutal-card ${variant} ${className}`}>{children}</div>
    );
  },
}));

vi.mock('@/components/ui/BrutalButton', () => ({
  default: function BrutalButton({
    children,
    onClick,
    variant,
    size,
    disabled,
  }: any) {
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

const mockChildren = [
  { id: 'child_1', name: 'Emma' },
  { id: 'child_2', name: 'Jake' },
];

const mockStats = {
  globalStats: {
    totalGenerated: 10,
    totalSent: 8,
    totalFailed: 2,
    averageTokenCost: 1500,
  },
  parentStats: {
    totalSummaries: 4,
    emailsSent: 3,
    averageTokenCost: 1400,
  },
  recentSummaries: [
    {
      id: 'summary_1',
      childName: 'Emma',
      weekStart: '2024-12-09T00:00:00Z',
      weekEnd: '2024-12-15T00:00:00Z',
      sessionCount: 7,
      totalChatTime: 180,
      emailSent: true,
      emailSentAt: '2024-12-16T09:00:00Z',
      createdAt: '2024-12-16T08:30:00Z',
    },
    {
      id: 'summary_2',
      childName: 'Jake',
      weekStart: '2024-12-02T00:00:00Z',
      weekEnd: '2024-12-08T00:00:00Z',
      sessionCount: 5,
      totalChatTime: 120,
      emailSent: false,
      emailSentAt: null,
      createdAt: '2024-12-09T08:30:00Z',
    },
  ],
};

describe('WeeklySummaryManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful API responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/weekly-summaries/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockStats,
        });
      }
      if (url.includes('/api/weekly-summaries/manual')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Weekly summary generated and email sent successfully',
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  it('renders weekly summary manager', async () => {
    render(<WeeklySummaryManager children={mockChildren} />);

    expect(screen.getByText('WEEKLY SUMMARIES')).toBeInTheDocument();
    expect(screen.getByText('🔄 REFRESH')).toBeInTheDocument();
  });

  it('loads and displays summary statistics', async () => {
    render(<WeeklySummaryManager children={mockChildren} />);

    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument(); // Total summaries
      expect(screen.getByText('3')).toBeInTheDocument(); // Emails sent
      expect(screen.getByText('1400')).toBeInTheDocument(); // Avg tokens
    });

    // Check estimated cost calculation
    await waitFor(() => {
      expect(screen.getByText('$0.42')).toBeInTheDocument(); // 1400 * 0.0003 = 0.42
    });
  });

  it('displays manual summary generation options', async () => {
    render(<WeeklySummaryManager children={mockChildren} />);

    await waitFor(() => {
      expect(screen.getByText('Generate Manual Summary')).toBeInTheDocument();
      expect(screen.getByText('Emma')).toBeInTheDocument();
      expect(screen.getByText('Jake')).toBeInTheDocument();
    });

    const generateButtons = screen.getAllByText('GENERATE SUMMARY');
    expect(generateButtons).toHaveLength(2);
  });

  it('generates manual summary when button clicked', async () => {
    // Mock window.alert
    window.alert = vi.fn();

    render(<WeeklySummaryManager children={mockChildren} />);

    await waitFor(() => {
      expect(screen.getByText('Emma')).toBeInTheDocument();
    });

    const generateButtons = screen.getAllByText('GENERATE SUMMARY');
    fireEvent.click(generateButtons[0]); // Click Emma's button

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/weekly-summaries/manual',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            childAccountId: 'child_1',
          }),
        })
      );
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'Weekly summary generated and sent for Emma!'
      );
    });
  });

  it('displays recent summaries correctly', async () => {
    render(<WeeklySummaryManager children={mockChildren} />);

    await waitFor(() => {
      expect(screen.getByText('Recent Summaries')).toBeInTheDocument();
      expect(screen.getByText('Emma')).toBeInTheDocument();
      expect(screen.getByText('Jake')).toBeInTheDocument();
    });

    // Check summary details
    await waitFor(() => {
      expect(screen.getByText('Sessions: 7')).toBeInTheDocument();
      expect(screen.getByText('Sessions: 5')).toBeInTheDocument();
      expect(screen.getByText('Chat Time: 3h 0m')).toBeInTheDocument();
      expect(screen.getByText('Chat Time: 2h 0m')).toBeInTheDocument();
    });

    // Check status badges
    await waitFor(() => {
      expect(screen.getByText('✅ Sent')).toBeInTheDocument();
      expect(screen.getByText('⏳ Pending')).toBeInTheDocument();
    });
  });

  it('refreshes stats when refresh button clicked', async () => {
    render(<WeeklySummaryManager children={mockChildren} />);

    await waitFor(() => {
      expect(screen.getByText('🔄 REFRESH')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('🔄 REFRESH');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/weekly-summaries/stats');
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock console.error to avoid error output in tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock failed API response
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    render(<WeeklySummaryManager children={mockChildren} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading summary stats:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('displays loading state during manual generation', async () => {
    render(<WeeklySummaryManager children={mockChildren} />);

    await waitFor(() => {
      expect(screen.getByText('Emma')).toBeInTheDocument();
    });

    const generateButtons = screen.getAllByText('GENERATE SUMMARY');
    fireEvent.click(generateButtons[0]);

    // Should show loading state
    expect(screen.getByText('GENERATING...')).toBeInTheDocument();
  });

  it('displays no summaries state when no data', async () => {
    // Mock empty stats
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          ...mockStats,
          recentSummaries: [],
        }),
      })
    );

    render(<WeeklySummaryManager children={mockChildren} />);

    await waitFor(() => {
      expect(
        screen.getByText('No weekly summaries generated yet')
      ).toBeInTheDocument();
    });
  });

  it('displays information about how weekly summaries work', async () => {
    render(<WeeklySummaryManager children={mockChildren} />);

    await waitFor(() => {
      expect(
        screen.getByText('💡 How Weekly Summaries Work')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Automatically generated every Sunday/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Uses AI to provide insights/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Estimated cost: ~\$0.0003/)).toBeInTheDocument();
    });
  });

  it('formats dates correctly', async () => {
    render(<WeeklySummaryManager children={mockChildren} />);

    await waitFor(() => {
      // Check week date ranges
      expect(
        screen.getByText('Week: Dec 9, 2024 - Dec 15, 2024')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Week: Dec 2, 2024 - Dec 8, 2024')
      ).toBeInTheDocument();
    });
  });

  it('formats chat time correctly', async () => {
    render(<WeeklySummaryManager children={mockChildren} />);

    await waitFor(() => {
      expect(screen.getByText('Chat Time: 3h 0m')).toBeInTheDocument(); // 180 minutes
      expect(screen.getByText('Chat Time: 2h 0m')).toBeInTheDocument(); // 120 minutes
    });
  });
});
