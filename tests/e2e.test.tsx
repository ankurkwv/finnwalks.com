import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, waitForElementToBeRemoved } from './utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/handlers';
import Home from '../client/src/pages/Home';

// Mock localstorage for consistent state
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

// Mock modules that might cause issues in tests
vi.mock('../client/src/hooks/use-mobile', () => ({
  useIsMobile: () => false // Default to desktop view
}));

// Mock toast for cleaner test output
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock BookingAnimation to avoid timing issues
vi.mock('../client/src/components/BookingAnimation', () => ({
  default: ({ isVisible, onComplete }: { isVisible: boolean, onComplete: () => void }) => {
    if (isVisible) {
      // Immediately call onComplete to avoid waiting in tests
      setTimeout(onComplete, 0);
    }
    return isVisible ? <div data-testid="booking-animation">Success Animation</div> : null;
  }
}));

describe('End-to-End Application Flow', () => {
  // Set up userEvent for all tests
  const user = userEvent.setup();
  
  beforeEach(() => {
    // Reset localStorage
    localStorageMock.clear();
    
    // Reset server handlers to initial state
    server.resetHandlers();
  });
  
  test('Complete user journey - view schedule, book slot, cancel slot', async () => {
    // Step 1: Render the application
    render(<Home />);
    
    // Wait for initial loading to complete
    await waitForElementToBeRemoved(() => screen.queryByRole('status'));
    
    // Step 2: Verify initial page load
    expect(screen.getByText(/Apr 20 - Apr 26/)).toBeInTheDocument();
    expect(screen.getByText('Sunday, April 20')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    
    // Step 3: Initial slot is displayed
    expect(screen.getByText('12:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Arpoo')).toBeInTheDocument();
    expect(screen.getByText('Regular walk')).toBeInTheDocument();
    
    // Step 4: Navigate to next day which has no slots
    const mondaySlots = screen.getAllByText('Schedule a walk');
    expect(mondaySlots.length).toBeGreaterThanOrEqual(1);
    
    // Step 5: Open booking modal for Monday
    await user.click(mondaySlots[0]);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Book a Walking Slot')).toBeInTheDocument();
    });
    
    // Step 6: Fill in booking form
    // Select time (2:00 PM)
    const timeSelect = screen.getByLabelText('Time');
    await user.click(timeSelect);
    await user.click(screen.getByText('2:00 PM'));
    
    // Enter name
    const nameInput = screen.getByPlaceholderText('Walker name');
    await user.clear(nameInput);
    await user.type(nameInput, 'E2E Test User');
    
    // Enter phone
    const phoneInput = screen.getByPlaceholderText('Phone number');
    await user.clear(phoneInput);
    await user.type(phoneInput, '+19876543210');
    
    // Enter notes
    const notesInput = screen.getByLabelText('Notes (optional)');
    await user.type(notesInput, 'E2E test booking');
    
    // Step 7: Submit the form
    const bookButton = screen.getByRole('button', { name: 'Book Walk' });
    await user.click(bookButton);
    
    // Wait for success animation
    await waitFor(() => {
      expect(screen.queryByTestId('booking-animation')).toBeInTheDocument();
    });
    
    // Animation should complete
    await waitFor(() => {
      expect(screen.queryByTestId('booking-animation')).not.toBeInTheDocument();
    });
    
    // Step 8: Verify new slot appears
    await waitFor(() => {
      expect(screen.getByText('E2E Test User')).toBeInTheDocument();
      expect(screen.getByText('2:00 PM')).toBeInTheDocument();
      expect(screen.getByText('E2E test booking')).toBeInTheDocument();
    });
    
    // Step 9: Delete the slot we just created
    const deleteButtons = screen.getAllByRole('button', { name: '' }); // Trash icons
    // Find the delete button for our slot
    let ourDeleteButton;
    for (const button of deleteButtons) {
      // Find the closest card containing our user name
      const card = button.closest('.MuiCard-root, [class*="card"]');
      if (card && card.textContent?.includes('E2E Test User')) {
        ourDeleteButton = button;
        break;
      }
    }
    
    expect(ourDeleteButton).toBeDefined();
    if (ourDeleteButton) {
      await user.click(ourDeleteButton);
    }
    
    // Step 10: Confirm deletion in modal
    await waitFor(() => {
      expect(screen.getByText('Cancel Walking Slot')).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByRole('button', { name: 'Yes, Cancel' });
    await user.click(confirmButton);
    
    // Step 11: Verify slot is removed
    await waitFor(() => {
      expect(screen.queryByText('E2E Test User')).not.toBeInTheDocument();
      expect(screen.queryByText('E2E test booking')).not.toBeInTheDocument();
    });
  });
  
  test('Handles server errors gracefully', async () => {
    // Override the server handler for the schedule endpoint to simulate error
    server.use(
      http.get('/api/schedule', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );
    
    // Render the app
    render(<Home />);
    
    // Wait for loading to complete
    await waitForElementToBeRemoved(() => screen.queryByRole('status'));
    
    // Should show error message
    expect(screen.getByText('Unable to load schedule. Please try again.')).toBeInTheDocument();
  });
  
  test('Handles slot booking errors gracefully', async () => {
    // Render the app
    render(<Home />);
    
    // Wait for loading to complete
    await waitForElementToBeRemoved(() => screen.queryByRole('status'));
    
    // Open booking modal
    const addWalkButton = screen.getAllByText('Add Walk')[0];
    await user.click(addWalkButton);
    
    // Fill in form
    const timeSelect = screen.getByLabelText('Time');
    await user.click(timeSelect);
    await user.click(screen.getByText('2:00 PM'));
    
    const nameInput = screen.getByPlaceholderText('Walker name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Error Test');
    
    // Override server handler just before submitting
    server.use(
      http.post('/api/slot', () => {
        return new HttpResponse(
          JSON.stringify({ error: 'Server error' }),
          { status: 500 }
        );
      })
    );
    
    // Submit the form
    const bookButton = screen.getByRole('button', { name: 'Book Walk' });
    await user.click(bookButton);
    
    // Modal should stay open due to error
    expect(screen.getByText('Book a Walking Slot')).toBeInTheDocument();
  });
});