import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from './utils';
import userEvent from '@testing-library/user-event';
import Leaderboard from '../client/src/components/Leaderboard';
import { mockLeaderboard } from './mocks/handlers';

describe('Leaderboard Component Tests', () => {
  // Set up userEvent for all tests
  const user = userEvent.setup();
  
  test('renders with all-time data initially', async () => {
    render(<Leaderboard currentDate="2025-04-20" />);
    
    // Should show leaderboard title
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    
    // Should show "All Time" as selected tab
    const allTimeTab = screen.getByRole('tab', { name: 'All Time' });
    expect(allTimeTab).toHaveAttribute('data-state', 'active');
    
    // Wait for leaderboard data to load
    await waitFor(() => {
      expect(screen.getByText('Arpoo')).toBeInTheDocument();
      expect(screen.getByText('Bruno')).toBeInTheDocument();
    });
    
    // Check for walker ranks and walk counts
    expect(screen.getByText('2 walks')).toBeInTheDocument(); // Arpoo's count
    expect(screen.getByText('1 walk')).toBeInTheDocument(); // Bruno's count
  });
  
  test('switches to next week tab', async () => {
    render(<Leaderboard currentDate="2025-04-20" />);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Arpoo')).toBeInTheDocument();
    });
    
    // Click on "Next Week" tab
    const nextWeekTab = screen.getByRole('tab', { name: 'Next Week' });
    await user.click(nextWeekTab);
    
    // Should show "Next Week" as selected tab
    expect(nextWeekTab).toHaveAttribute('data-state', 'active');
    
    // Wait for next week leaderboard data to load
    await waitFor(() => {
      expect(screen.getByText('Arpoo')).toBeInTheDocument();
      expect(screen.getByText('Bruno')).toBeInTheDocument();
    });
    
    // Check that we're seeing next week data
    // This is mocked to be the same as all-time for testing purposes
    expect(screen.getByText('2 walks')).toBeInTheDocument();
    expect(screen.getByText('1 walk')).toBeInTheDocument();
  });
  
  test('renders empty state when there are no walkers', async () => {
    // Mock empty leaderboard data
    vi.mock('./mocks/handlers', () => ({
      mockLeaderboard: []
    }), { virtual: true });
    
    render(<Leaderboard currentDate="2025-04-20" />);
    
    // Wait for data loading to complete
    await waitFor(() => {
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    });
    
    // Check for empty state message
    expect(screen.getByText('No walks scheduled yet')).toBeInTheDocument();
  });
  
  test('renders with proper walker styling and ranking', async () => {
    render(<Leaderboard currentDate="2025-04-20" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Arpoo')).toBeInTheDocument();
    });
    
    // Check that 1st place walker has the correct styling
    const firstPlaceEntry = screen.getByText('Arpoo').closest('.leaderboard-entry');
    expect(firstPlaceEntry).toHaveClass('bg-opacity-20');
    
    // Check for ranking numbers
    expect(screen.getByText('1')).toBeInTheDocument(); // 1st place
    expect(screen.getByText('2')).toBeInTheDocument(); // 2nd place
  });
});