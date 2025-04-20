import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockStorage, resetMockStorage } from './mocks/storage.mock';

// Mock modules must be at the top level and before any imports that use them
vi.mock('../server/storage', () => ({
  storage: mockStorage
}));

// Mock Twilio
vi.mock('../server/twilio', () => ({
  sendSmsNotification: vi.fn().mockResolvedValue(true)
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../client/src/App';
import { server } from './mocks/server';
import React from 'react';
import userEvent from '@testing-library/user-event';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('End-to-End Tests', () => {
  beforeEach(() => {
    resetMockStorage();
    // Reset QueryClient
    vi.resetModules();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  test('displays correct initial page layout', async () => {
    renderWithProviders(<App />);
    
    // Check header is rendered
    const header = screen.getByText(/FinnWalks/i);
    expect(header).toBeInTheDocument();
    
    // Check schedule is rendered
    const scheduleHeader = await screen.findByText(/Schedule/i);
    expect(scheduleHeader).toBeInTheDocument();
    
    // Check day tabs are rendered
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (const day of dayNames) {
      expect(screen.getByText(new RegExp(day, 'i'))).toBeInTheDocument();
    }
    
    // Check leaderboard is rendered
    const allTimeLeaderboard = await screen.findByText(/All Time/i);
    expect(allTimeLeaderboard).toBeInTheDocument();
    const nextWeekLeaderboard = await screen.findByText(/Next Week/i);
    expect(nextWeekLeaderboard).toBeInTheDocument();
  });
  
  test('can navigate between weeks', async () => {
    renderWithProviders(<App />);
    
    // Find navigation buttons
    const prevWeekButton = await screen.findByTitle(/Previous week/i);
    const nextWeekButton = await screen.findByTitle(/Next week/i);
    const todayButton = await screen.findByText(/Today/i);
    
    // Click next week
    await userEvent.click(nextWeekButton);
    
    // Check that we've navigated (would show different date)
    await waitFor(() => {
      expect(screen.getByText(/Apr 27/i)).toBeInTheDocument();
    });
    
    // Go back to today
    await userEvent.click(todayButton);
    
    // Check that we're back to current week
    await waitFor(() => {
      expect(screen.getByText(/Apr 20/i)).toBeInTheDocument();
    });
    
    // Go to previous week
    await userEvent.click(prevWeekButton);
    
    // Check that we've navigated to previous week
    await waitFor(() => {
      expect(screen.getByText(/Apr 13/i)).toBeInTheDocument();
    });
  });
  
  test('can book a walking slot', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    
    // Find an empty slot and click it
    const emptySlot = await screen.findByText(/12:00 PM/i);
    await user.click(emptySlot);
    
    // Check that booking modal appeared
    const bookingHeader = await screen.findByText(/Book a Walk/i);
    expect(bookingHeader).toBeInTheDocument();
    
    // Fill in the form
    const nameInput = screen.getByLabelText(/Your Name/i);
    await user.type(nameInput, 'Test Walker');
    
    const phoneInput = screen.getByLabelText(/Phone Number/i);
    await user.type(phoneInput, '+19876543210');
    
    const notesInput = screen.getByLabelText(/Notes/i);
    await user.type(notesInput, 'Test booking via e2e test');
    
    // Submit the form
    const bookButton = screen.getByRole('button', { name: /Book/i });
    await user.click(bookButton);
    
    // Check that the slot is now booked
    await waitFor(() => {
      expect(screen.getByText(/Test Walker/i)).toBeInTheDocument();
    });
  });
  
  test('shows an error when trying to book an already booked slot', async () => {
    // Add a booking first
    await mockStorage.addSlot({
      date: '2025-04-20',
      time: '1300',
      name: 'Existing Walker',
      phone: '+19876543210',
      notes: 'Already booked'
    });
    
    const user = userEvent.setup();
    renderWithProviders(<App />);
    
    // Find the booked slot and click it
    const bookedSlot = await screen.findByText(/Existing Walker/i);
    await user.click(bookedSlot);
    
    // Check that error message appears
    await waitFor(() => {
      expect(screen.getByText(/This slot is already booked/i)).toBeInTheDocument();
    });
  });
  
  test('can cancel a booking', async () => {
    // Add a booking first that belongs to the user
    const testWalkerName = 'Test Walker';
    await mockStorage.addSlot({
      date: '2025-04-20',
      time: '1400',
      name: testWalkerName,
      phone: '+19876543210',
      notes: 'Can be cancelled'
    });
    
    // Set username in local storage
    localStorage.setItem('userName', testWalkerName);
    
    const user = userEvent.setup();
    renderWithProviders(<App />);
    
    // Find the booked slot and click it
    const bookedSlot = await screen.findByText(/Test Walker/i);
    await user.click(bookedSlot);
    
    // Check that delete modal appears
    const deleteHeader = await screen.findByText(/Cancel Walk/i);
    expect(deleteHeader).toBeInTheDocument();
    
    // Confirm deletion
    const deleteButton = screen.getByRole('button', { name: /Cancel Walk/i });
    await user.click(deleteButton);
    
    // Check that the slot is now free
    await waitFor(() => {
      expect(screen.queryByText(/Test Walker/i)).not.toBeInTheDocument();
    });
  });
  
  test('shows error when cancelling someone else\'s booking', async () => {
    // Add a booking that belongs to someone else
    await mockStorage.addSlot({
      date: '2025-04-20', 
      time: '1500',
      name: 'Other Walker',
      phone: '+19876543210',
      notes: 'Cannot be cancelled by someone else'
    });
    
    // Set different username in local storage
    localStorage.setItem('userName', 'Test Walker');
    
    const user = userEvent.setup();
    renderWithProviders(<App />);
    
    // Find the booked slot and click it
    const bookedSlot = await screen.findByText(/Other Walker/i);
    await user.click(bookedSlot);
    
    // Check that warning message appears
    await waitFor(() => {
      expect(screen.getByText(/You can only cancel your own bookings/i)).toBeInTheDocument();
    });
  });
  
  test('should show correct leaderboard rankings', async () => {
    // Add some bookings for different walkers
    await mockStorage.addSlot({
      date: '2025-04-20',
      time: '1000',
      name: 'Frequent Walker',
    });
    
    await mockStorage.addSlot({
      date: '2025-04-21',
      time: '1100',
      name: 'Frequent Walker',
    });
    
    await mockStorage.addSlot({
      date: '2025-04-22',
      time: '1200',
      name: 'Occasional Walker',
    });
    
    renderWithProviders(<App />);
    
    // Check all-time leaderboard
    const allTimeTab = await screen.findByRole('tab', { name: /All Time/i });
    await userEvent.click(allTimeTab);
    
    // First place should be Frequent Walker with 2 walks
    await waitFor(() => {
      const frequentWalkerEntry = screen.getByText(/Frequent Walker/i);
      expect(frequentWalkerEntry).toBeInTheDocument();
      
      const walksCount = screen.getAllByText(/walks/i);
      expect(walksCount.length).toBeGreaterThan(0);
    });
    
    // Check next week leaderboard
    const nextWeekTab = screen.getByRole('tab', { name: /Next Week/i });
    await userEvent.click(nextWeekTab);
    
    // Should show appropriate walkers for next week
    await waitFor(() => {
      expect(screen.getByText(/No walks scheduled yet/i)).toBeInTheDocument();
    });
  });
  
  test('shows walker name autocompletion when typing', async () => {
    // Add some walkers to the system
    await mockStorage.updateWalker('Regular Walker');
    await mockStorage.updateWalker('Another Walker');
    
    const user = userEvent.setup();
    renderWithProviders(<App />);
    
    // Find an empty slot and click it
    const emptySlot = await screen.findByText(/12:00 PM/i);
    await user.click(emptySlot);
    
    // Check that booking modal appeared
    await screen.findByText(/Book a Walk/i);
    
    // Type in the name input to trigger autocomplete
    const nameInput = screen.getByLabelText(/Your Name/i);
    await user.type(nameInput, 'Walk');
    
    // Check that autocomplete suggestions appear
    await waitFor(() => {
      const suggestion = screen.getByText(/Regular Walker/i);
      expect(suggestion).toBeInTheDocument();
    });
    
    // Select a suggestion
    const suggestion = screen.getByText(/Regular Walker/i);
    await user.click(suggestion);
    
    // Check that the name was filled in
    expect(nameInput).toHaveValue('Regular Walker');
  });
  
  test('persists user name and phone between bookings', async () => {
    // Set user info in local storage
    localStorage.setItem('userName', 'Remembered User');
    localStorage.setItem('userPhone', '+19876543210');
    
    const user = userEvent.setup();
    renderWithProviders(<App />);
    
    // Find an empty slot and click it
    const emptySlot = await screen.findByText(/12:00 PM/i);
    await user.click(emptySlot);
    
    // Check that the name and phone are pre-filled
    await waitFor(() => {
      const nameInput = screen.getByLabelText(/Your Name/i);
      expect(nameInput).toHaveValue('Remembered User');
      
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      expect(phoneInput).toHaveValue('+19876543210');
    });
  });
});