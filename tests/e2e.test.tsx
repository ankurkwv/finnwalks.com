import { describe, test, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { server } from './mocks/server';
import { queryClient } from '../client/src/lib/queryClient';
import App from '../client/src/App';
import { mockStorage, resetMockStorage } from './mocks/storage.mock';
import { mockSchedule } from './mocks/handlers';
import React from 'react';

// Apply MSW handlers before tests
beforeAll(() => {
  // Start MSW server
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers between tests
afterEach(() => {
  server.resetHandlers();
  resetMockStorage();
  queryClient.clear();
});

// Clean up after tests
afterAll(() => {
  server.close();
});

// Provide a wrapped render function with all required providers
function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('End-to-End Tests', () => {
  test('Loads and displays the app with initial schedule', async () => {
    renderWithProviders(<App />);
    
    // Verify loading state
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
    
    // Verify app header elements
    expect(screen.getByText(/FinnWalks/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule/i)).toBeInTheDocument();
    expect(screen.getByText(/Leaderboard/i)).toBeInTheDocument();
    
    // Check that schedule is displayed
    expect(screen.getByText(/Today/i)).toBeInTheDocument();
    expect(screen.getByText(/Arpoo/i)).toBeInTheDocument();
    expect(screen.getByText(/12:00 PM/i)).toBeInTheDocument();
  });
  
  test('Books a new walking slot', async () => {
    renderWithProviders(<App />);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
    
    // Find an empty slot and click on it
    const emptySlots = screen.getAllByText(/Book a Walk/i);
    expect(emptySlots.length).toBeGreaterThan(0);
    
    fireEvent.click(emptySlots[0]);
    
    // Verify booking modal opens
    await waitFor(() => {
      expect(screen.getByText(/Book Dog Walking Slot/i)).toBeInTheDocument();
    });
    
    // Fill in booking form
    fireEvent.change(screen.getByLabelText(/Your Name/i), {
      target: { value: 'TestUser' }
    });
    
    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: '+19876543210' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText(/Confirm Booking/i));
    
    // Wait for booking to be processed and modal to close
    await waitFor(() => {
      expect(screen.queryByText(/Book Dog Walking Slot/i)).not.toBeInTheDocument();
    });
    
    // Verify new booking appears on the schedule
    await waitFor(() => {
      expect(screen.getByText(/TestUser/i)).toBeInTheDocument();
    });
  });
  
  test('Cancels an existing walking slot', async () => {
    // Add a test slot to be deleted
    await mockStorage.addSlot({
      date: mockSchedule['2025-04-20'][0].date,
      time: '1300',
      name: 'DeleteTest',
      phone: '+19876543210',
      notes: 'Test slot to delete'
    });
    
    renderWithProviders(<App />);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
    
    // Verify our test slot is visible
    expect(screen.getByText(/DeleteTest/i)).toBeInTheDocument();
    
    // Find the slot and click on it
    const slot = screen.getByText(/DeleteTest/i);
    fireEvent.click(slot);
    
    // Find and click the cancel button in the popup
    const cancelButton = await screen.findByText(/Cancel Booking/i);
    fireEvent.click(cancelButton);
    
    // Verify delete confirmation modal opens
    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to cancel this booking?/i)).toBeInTheDocument();
    });
    
    // Confirm deletion
    fireEvent.click(screen.getByText(/Yes, Cancel/i));
    
    // Wait for deletion to be processed and modal to close
    await waitFor(() => {
      expect(screen.queryByText(/Are you sure you want to cancel this booking?/i)).not.toBeInTheDocument();
    });
    
    // Verify the slot is gone
    expect(screen.queryByText(/DeleteTest/i)).not.toBeInTheDocument();
  });
  
  test('Views leaderboard correctly', async () => {
    renderWithProviders(<App />);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
    
    // Find the Leaderboard tab and click on it
    const leaderboardTab = screen.getByText(/Leaderboard/i);
    fireEvent.click(leaderboardTab);
    
    // Wait for leaderboard to load
    await waitFor(() => {
      expect(screen.getByText(/All-Time Leaderboard/i)).toBeInTheDocument();
    });
    
    // Verify leaderboard entries
    expect(screen.getAllByText(/Arpoo/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/2 walks/i)).toBeInTheDocument();
    expect(screen.getByText(/Bruno/i)).toBeInTheDocument();
    expect(screen.getByText(/1 walk/i)).toBeInTheDocument();
  });
  
  test('Navigates through weeks correctly', async () => {
    renderWithProviders(<App />);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
    
    // Verify we're on the current week
    expect(screen.getByText(/Today/i)).toBeInTheDocument();
    
    // Click next week button
    const nextWeekButton = screen.getByLabelText(/Next week/i);
    fireEvent.click(nextWeekButton);
    
    // Wait for next week data to load
    await waitFor(() => {
      expect(screen.queryByText(/Today/i)).not.toBeInTheDocument();
    });
    
    // Click previous week button to go back
    const prevWeekButton = screen.getByLabelText(/Previous week/i);
    fireEvent.click(prevWeekButton);
    
    // Verify we're back to current week
    await waitFor(() => {
      expect(screen.getByText(/Today/i)).toBeInTheDocument();
    });
  });
});