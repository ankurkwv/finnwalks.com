import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from './utils';
import userEvent from '@testing-library/user-event';
import Home from '../client/src/pages/Home';
import React from 'react';

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
      expect(screen.getByText(/Apr 20 - Apr 26/)).toBeDefined();
    });
    
    // Check for page title
    expect(screen.getByText(/Apr 20 - Apr 26/)).toBeDefined();
    
    // Check for schedule components
    expect(screen.getByText('Sunday, April 20')).toBeDefined();
    
    // Check for existing slot in schedule
    expect(screen.getByText('12:00 PM')).toBeDefined();
    expect(screen.getByText('Arpoo')).toBeDefined();
    
    // Check for leaderboard
    expect(screen.getByText('Leaderboard')).toBeDefined();
    expect(screen.getAllByText('Arpoo')[0]).toBeDefined();
  });
  
  test('navigates between weeks', async () => {
    render(<Home />);
    
    // Wait for content to be available
    await waitFor(() => {
      expect(screen.getByText(/Apr 20 - Apr 26/)).toBeDefined();
    });
    
    // Initial week should be Apr 20 - Apr 26
    expect(screen.getByText(/Apr 20 - Apr 26/)).toBeDefined();
    
    // Navigate to next week
    const nextWeekButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextWeekButton);
    
    // Should show updated date range after state change
    await waitFor(() => {
      expect(screen.queryByText(/Apr 20 - Apr 26/)).toBeNull();
    });
    
    // Navigate back to current week
    const todayButton = screen.getByText('Today');
    await user.click(todayButton);
    
    // Navigate to previous week
    const prevWeekButton = screen.getByRole('button', { name: /previous/i });
    await user.click(prevWeekButton);
  });
  
  test('opens info modal', async () => {
    render(<Home />);
    
    // Wait for content to be available
    await waitFor(() => {
      expect(screen.getByText(/Apr 20 - Apr 26/)).toBeDefined();
    });
    
    // Click info button
    const infoButton = screen.getByRole('button', { name: /info/i });
    await user.click(infoButton);
    
    // Check that modal opens
    await waitFor(() => {
      expect(screen.getByText('About FinnWalks')).toBeDefined();
    });
    
    // Close modal
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    // Check that modal closes
    await waitFor(() => {
      expect(screen.queryByText('About FinnWalks')).toBeNull();
    });
  });
});