import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from './utils';
import userEvent from '@testing-library/user-event';
import Home from '../client/src/pages/Home';

// Mock useSchedule hook to control loading state
vi.mock('../client/src/hooks/useSchedule', () => ({
  useSchedule: () => ({
    data: {
      '2025-04-20': [
        {
          date: '2025-04-20',
          time: '1200',
          name: 'Arpoo',
          notes: 'Regular walk',
          timestamp: Date.now() - 100000
        }
      ],
      '2025-04-21': [],
      '2025-04-22': [],
      '2025-04-23': [],
      '2025-04-24': [],
      '2025-04-25': [],
      '2025-04-26': []
    },
    isLoading: false,
    error: null
  }),
  useAddSlot: () => ({
    mutate: vi.fn(),
    isPending: false
  }),
  useDeleteSlot: () => ({
    mutate: vi.fn(),
    isPending: false
  })
}));

// Mock hooks that might cause issues in tests
vi.mock('../client/src/hooks/use-mobile', () => ({
  useIsMobile: () => false // Default to desktop view
}));

// Mock leaderboard hooks
vi.mock('../client/src/hooks/useLeaderboard', () => ({
  useAllTimeLeaderboard: () => ({
    data: [
      { name: 'Arpoo', totalWalks: 2, colorIndex: 0 },
      { name: 'Bruno', totalWalks: 1, colorIndex: 1 }
    ],
    isLoading: false
  }),
  useNextWeekLeaderboard: () => ({
    data: [
      { name: 'Arpoo', totalWalks: 1, colorIndex: 0 }
    ],
    isLoading: false
  })
}));

// Mock toast for cleaner test output
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock local storage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Home Component Integration Tests', () => {
  // Set up userEvent for all tests
  const user = userEvent.setup();
  
  // Reset local storage before each test
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });
  
  test('renders Home page with schedule and leaderboard', async () => {
    render(<Home />);
    
    // Wait for content to be available
    await waitFor(() => {
      expect(screen.getByText(/Apr 20 - Apr 26/)).toBeInTheDocument();
    });
    
    // Check for page title
    expect(screen.getByText(/Apr 20 - Apr 26/)).toBeInTheDocument();
    
    // Check for schedule components
    expect(screen.getByText('Sunday, April 20')).toBeInTheDocument();
    
    // Check for existing slot in schedule
    expect(screen.getByText('12:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Arpoo')).toBeInTheDocument();
    
    // Check for leaderboard
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getAllByText('Arpoo')[0]).toBeInTheDocument();
  });
  
  test('navigates between weeks', async () => {
    render(<Home />);
    
    // Wait for content to be available
    await waitFor(() => {
      expect(screen.getByText(/Apr 20 - Apr 26/)).toBeInTheDocument();
    });
    
    // Initial week should be Apr 20 - Apr 26
    expect(screen.getByText(/Apr 20 - Apr 26/)).toBeInTheDocument();
    
    // Navigate to next week
    const nextWeekButton = screen.getByText('Next 7 days');
    await user.click(nextWeekButton);
    
    // Navigate back to current week
    const todayButton = screen.getByText('Today');
    await user.click(todayButton);
    
    // Should be back at original week
    await waitFor(() => {
      expect(screen.getByText(/Apr 20 - Apr 26/)).toBeInTheDocument();
    });
    
    // Navigate to previous week
    const prevWeekButton = screen.getByText('Previous 7 days');
    await user.click(prevWeekButton);
  });
  
  test('opens info modal', async () => {
    render(<Home />);
    
    // Wait for content to be available
    await waitFor(() => {
      expect(screen.getByText(/Apr 20 - Apr 26/)).toBeInTheDocument();
    });
    
    // Click info button (looking for the info icon)
    const infoButton = screen.getByLabelText('Care Instructions');
    await user.click(infoButton);
    
    // Check that modal opens (this assumes the modal has "About FinnWalks" text)
    await waitFor(() => {
      const modalTitle = screen.queryByText('About FinnWalks');
      expect(modalTitle).not.toBeNull();
    });
    
    // Find close button within the modal
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(button => 
      button.textContent?.includes('Close') || 
      button.getAttribute('aria-label')?.includes('close')
    );
    
    if (closeButton) {
      await user.click(closeButton);
    }
  });
});