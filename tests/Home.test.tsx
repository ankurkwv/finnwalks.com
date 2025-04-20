import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitForElementToBeRemoved } from './utils';
import userEvent from '@testing-library/user-event';
import Home from '../client/src/pages/Home';

// Mock modules that might cause issues in tests
vi.mock('../client/src/hooks/use-mobile', () => ({
  useIsMobile: () => false // Default to desktop view
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
  });
  
  test('renders Home page with schedule and leaderboard', async () => {
    render(<Home />);
    
    // Wait for loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.queryByRole('status'));
    
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
    
    // Wait for loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.queryByRole('status'));
    
    // Initial week should be Apr 20 - Apr 26
    expect(screen.getByText(/Apr 20 - Apr 26/)).toBeInTheDocument();
    
    // Navigate to next week
    const nextWeekButton = screen.getByLabelText('Next week');
    await user.click(nextWeekButton);
    
    // Should now show Apr 27 - May 3
    expect(screen.getByText(/Apr 27 - May 3/)).toBeInTheDocument();
    
    // Navigate back to current week
    const todayButton = screen.getByText('Today');
    await user.click(todayButton);
    
    // Should show Apr 20 - Apr 26 again
    expect(screen.getByText(/Apr 20 - Apr 26/)).toBeInTheDocument();
    
    // Navigate to previous week
    const prevWeekButton = screen.getByLabelText('Previous week');
    await user.click(prevWeekButton);
    
    // Should show Apr 13 - Apr 19
    expect(screen.getByText(/Apr 13 - Apr 19/)).toBeInTheDocument();
  });
  
  test('opens info modal', async () => {
    render(<Home />);
    
    // Wait for loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.queryByRole('status'));
    
    // Click info button
    const infoButton = screen.getByLabelText('Information');
    await user.click(infoButton);
    
    // Check that modal opens
    expect(screen.getByText('About FinnWalks')).toBeInTheDocument();
    
    // Close modal
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    // Check that modal closes
    expect(screen.queryByText('About FinnWalks')).not.toBeInTheDocument();
  });
});