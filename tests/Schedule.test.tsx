import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from './utils';
import userEvent from '@testing-library/user-event';
import Schedule from '../client/src/components/Schedule';
import { mockSchedule } from './mocks/handlers';
import { WalkingSlot } from '../shared/schema';

// Mock toast for testing
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock animation component to avoid animation timing issues in tests
vi.mock('../client/src/components/BookingAnimation', () => ({
  default: ({ isVisible, onComplete }: { isVisible: boolean, onComplete: () => void }) => {
    if (isVisible) {
      // Immediately call onComplete to avoid waiting in tests
      setTimeout(onComplete, 0);
    }
    return isVisible ? <div data-testid="booking-animation">Success Animation</div> : null;
  }
}));

describe('Schedule Component Integration Tests', () => {
  // Set up userEvent for all tests
  const user = userEvent.setup();
  
  // Mock props for Schedule component
  const mockProps = {
    schedule: { ...mockSchedule },
    userName: 'Test User',
    onUpdateUserName: vi.fn(),
    userPhone: '+1234567890',
    onUpdateUserPhone: vi.fn()
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  test('renders schedule with existing slots', async () => {
    render(<Schedule {...mockProps} />);
    
    // Check that day heading and slot are rendered
    expect(screen.getByText('Sunday, April 20')).toBeInTheDocument();
    expect(screen.getByText('12:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Arpoo')).toBeInTheDocument();
    expect(screen.getByText('Regular walk')).toBeInTheDocument();
    
    // Check that the "Add Walk" button is present
    expect(screen.getAllByText('Add Walk')[0]).toBeInTheDocument();
  });
  
  test('opens booking modal and books a new slot', async () => {
    render(<Schedule {...mockProps} />);
    
    // Click "Add Walk" button for April 21
    const addWalkButtons = screen.getAllByText('Add Walk');
    await user.click(addWalkButtons[1]); // Second add walk button (April 21)
    
    // Check that booking modal is open
    expect(screen.getByText('Book a Walking Slot')).toBeInTheDocument();
    
    // Select time (3:00 PM)
    const timeSelect = screen.getByLabelText('Time');
    await user.click(timeSelect);
    await user.click(screen.getByText('3:00 PM'));
    
    // Enter notes
    const notesField = screen.getByLabelText('Notes (optional)');
    await user.type(notesField, 'Integration test note');
    
    // Submit the form
    const bookButton = screen.getByRole('button', { name: 'Book Walk' });
    await user.click(bookButton);
    
    // Wait for success animation
    await waitFor(() => {
      expect(screen.queryByTestId('booking-animation')).toBeInTheDocument();
    });
    
    // Animation should complete and show the new slot
    await waitFor(() => {
      expect(screen.queryByTestId('booking-animation')).not.toBeInTheDocument();
    });
  });
  
  test('opens delete modal and cancels a slot', async () => {
    render(<Schedule {...mockProps} />);
    
    // Find and click the delete button for the existing slot
    const deleteButton = screen.getByRole('button', { name: '' }); // The trash icon button
    await user.click(deleteButton);
    
    // Check that delete modal is open
    expect(screen.getByText('Cancel Walking Slot')).toBeInTheDocument();
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: 'Yes, Cancel' });
    await user.click(confirmButton);
    
    // Wait for delete operation to complete
    await waitFor(() => {
      expect(screen.queryByText('Cancel Walking Slot')).not.toBeInTheDocument();
    });
  });
  
  test('shows empty state for days with no scheduled walks', () => {
    // Create a schedule with an empty day
    const emptySchedule = {
      '2025-04-20': [] as WalkingSlot[]
    };
    
    render(
      <Schedule 
        {...mockProps}
        schedule={emptySchedule} 
      />
    );
    
    // Check for empty state message
    expect(screen.getByText('No walks scheduled yet')).toBeInTheDocument();
    expect(screen.getByText('Schedule a walk')).toBeInTheDocument();
  });
});