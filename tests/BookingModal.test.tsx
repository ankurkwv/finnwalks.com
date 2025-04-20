import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from './utils';
import userEvent from '@testing-library/user-event';
import BookingModal from '../client/src/components/BookingModal';
import { InsertSlot } from '../shared/schema';

// Mock the WalkerNameAutocomplete component for easier testing
vi.mock('../client/src/components/WalkerNameAutocomplete', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <input 
      data-testid="walker-name-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Walker name"
    />
  )
}));

describe('BookingModal Component Tests', () => {
  // Set up userEvent for all tests
  const user = userEvent.setup();
  
  // Default props
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    date: '2025-04-20',
    bookedTimes: ['1200', '1500'],
    userName: 'Test User',
    onUpdateUserName: vi.fn(),
    userPhone: '+1234567890',
    onUpdateUserPhone: vi.fn(),
    isSubmitting: false
  };
  
  test('renders modal when open', () => {
    render(<BookingModal {...defaultProps} />);
    
    // Check modal title
    expect(screen.getByText('Book a Walking Slot')).toBeInTheDocument();
    
    // Check date display
    expect(screen.getByText('Sunday, April 20, 2025')).toBeInTheDocument();
  });
  
  test('does not render modal when closed', () => {
    render(<BookingModal {...{ ...defaultProps, isOpen: false }} />);
    
    // Modal should not be in the document
    expect(screen.queryByText('Book a Walking Slot')).not.toBeInTheDocument();
  });
  
  test('submits form with valid data', async () => {
    render(<BookingModal {...defaultProps} />);
    
    // Select time (2:00 PM) which is not in bookedTimes
    const timeSelect = screen.getByLabelText('Time');
    await user.click(timeSelect);
    await user.click(screen.getByText('2:00 PM')); // "1400" in 24h format
    
    // Enter walker name
    const nameInput = screen.getByTestId('walker-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Walker');
    
    // Enter phone number
    const phoneInput = screen.getByPlaceholderText('Phone number');
    await user.clear(phoneInput);
    await user.type(phoneInput, '+19876543210');
    
    // Enter notes
    const notesInput = screen.getByLabelText('Notes (optional)');
    await user.type(notesInput, 'Test note');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Book Walk' });
    await user.click(submitButton);
    
    // Check if onSubmit was called with correct data
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2025-04-20',
          time: '1400',
          name: 'New Walker',
          phone: '+19876543210',
          notes: 'Test note'
        } as InsertSlot)
      );
    });
  });
  
  test('shows loading state when isSubmitting=true', () => {
    render(<BookingModal {...{ ...defaultProps, isSubmitting: true }} />);
    
    // Check that submit button shows loading state
    const submitButton = screen.getByRole('button', { name: 'Booking...' });
    expect(submitButton).toBeDisabled();
    expect(submitButton.getElementsByTagName('div')[0]).toHaveClass('animate-spin');
  });
  
  test('disables already booked times in the select', async () => {
    render(<BookingModal {...defaultProps} />);
    
    // Open the select
    const timeSelect = screen.getByLabelText('Time');
    await user.click(timeSelect);
    
    // Find all options
    const options = screen.getAllByRole('option');
    
    // Check that booked times (12:00 PM and 3:00 PM) are disabled
    const disabledOption1 = options.find(option => option.textContent === '12:00 PM');
    const disabledOption2 = options.find(option => option.textContent === '3:00 PM');
    
    expect(disabledOption1).toHaveAttribute('data-disabled');
    expect(disabledOption2).toHaveAttribute('data-disabled');
  });
  
  test('closes modal when cancel button clicked', async () => {
    render(<BookingModal {...defaultProps} />);
    
    // Click the cancel button
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);
    
    // Check that onClose was called
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});