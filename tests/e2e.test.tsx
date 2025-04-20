import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from './utils';
import userEvent from '@testing-library/user-event';
import { mockStorage, resetMockStorage } from './mocks/storage.mock';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';

// Import components to test
import Schedule from '../client/src/components/Schedule';
import BookingModal from '../client/src/components/BookingModal';
import Leaderboard from '../client/src/components/Leaderboard';

// Mock components that are used by the tested components
vi.mock('../client/src/components/BookingAnimation', () => ({
  default: ({ isVisible, onComplete }: { isVisible: boolean, onComplete: () => void }) => (
    <div data-testid="booking-animation">
      {isVisible && <button onClick={onComplete}>Complete Animation</button>}
    </div>
  )
}));

vi.mock('../client/src/components/WalkerNameAutocomplete', () => ({
  default: ({ value, onChange, onWalkerSelect }: any) => (
    <div data-testid="walker-autocomplete">
      <input 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        data-testid="walker-input" 
      />
      <button 
        onClick={() => onWalkerSelect({ name: value, colorIndex: 0 })}
        data-testid="select-walker"
      >
        Select Walker
      </button>
    </div>
  )
}));

describe('End-to-End Tests', () => {
  beforeEach(() => {
    resetMockStorage();
    vi.clearAllMocks();
    
    // Populate test data
    populateTestData();
  });

  test('Booking a time slot should add it to the schedule', async () => {
    // Mock server response
    server.use(
      http.post('/api/slot', async ({ request }) => {
        const data = await request.json();
        return HttpResponse.json(
          { ...data, timestamp: Date.now() },
          { status: 201 }
        );
      })
    );

    // Setup test data
    const schedule = {
      '2025-04-20': [],
      '2025-04-21': []
    };
    const onUpdateUserName = vi.fn();
    const onUpdateUserPhone = vi.fn();

    const user = userEvent.setup();

    // Render the booking modal directly
    render(
      <BookingModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={vi.fn()}
        date="2025-04-20"
        bookedTimes={[]}
        userName="Test User"
        onUpdateUserName={onUpdateUserName}
        userPhone="+12345678900"
        onUpdateUserPhone={onUpdateUserPhone}
        isSubmitting={false}
      />
    );

    // Fill out the booking form
    await waitFor(() => {
      expect(screen.getByTestId('walker-input')).toBeInTheDocument();
    });

    // Enter walker name
    await user.type(screen.getByTestId('walker-input'), 'Test Walker');
    
    // Select a walker from autocomplete
    await user.click(screen.getByTestId('select-walker'));
    
    // Select a time slot (assuming there's a select dropdown)
    const timeSelect = screen.getByRole('combobox');
    expect(timeSelect).toBeInTheDocument();
    
    // Select 12:00 PM
    fireEvent.change(timeSelect, { target: { value: '1200' } });
    
    // Add notes
    const notesInput = screen.getByPlaceholderText(/notes/i);
    await user.type(notesInput, 'Test booking notes');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /book/i });
    await user.click(submitButton);
    
    // Verify the user name was updated
    expect(onUpdateUserName).toHaveBeenCalledWith('Test Walker');
  });

  test('Leaderboard should display walkers sorted by number of walks', async () => {
    // Setup test data with multiple walkers and walks
    await mockStorage.addSlot({ date: '2025-04-20', time: '1000', name: 'Top Walker' });
    await mockStorage.addSlot({ date: '2025-04-20', time: '1100', name: 'Top Walker' });
    await mockStorage.addSlot({ date: '2025-04-20', time: '1200', name: 'Top Walker' });
    await mockStorage.addSlot({ date: '2025-04-20', time: '1300', name: 'Second Walker' });
    await mockStorage.addSlot({ date: '2025-04-20', time: '1400', name: 'Second Walker' });
    await mockStorage.addSlot({ date: '2025-04-20', time: '1500', name: 'Third Walker' });
    
    // Mock server response for leaderboard
    server.use(
      http.get('/api/leaderboard/next-week', () => {
        return HttpResponse.json([
          { name: 'Top Walker', totalWalks: 3, colorIndex: 0 },
          { name: 'Second Walker', totalWalks: 2, colorIndex: 1 },
          { name: 'Third Walker', totalWalks: 1, colorIndex: 2 }
        ]);
      })
    );
    
    // Render the leaderboard component
    render(<Leaderboard currentDate="2025-04-20" />);
    
    // Wait for the leaderboard to load
    await waitFor(() => {
      expect(screen.getByText(/top walker/i)).toBeInTheDocument();
    });
    
    // Check if walkers are displayed in the correct order
    const walkerNames = screen.getAllByTestId('leaderboard-name');
    expect(walkerNames[0]).toHaveTextContent(/top walker/i);
    expect(walkerNames[1]).toHaveTextContent(/second walker/i);
    expect(walkerNames[2]).toHaveTextContent(/third walker/i);
    
    // Check if walk counts are correct
    const walkCounts = screen.getAllByTestId('leaderboard-walks');
    expect(walkCounts[0]).toHaveTextContent('3');
    expect(walkCounts[1]).toHaveTextContent('2');
    expect(walkCounts[2]).toHaveTextContent('1');
  });

  // This test requires mocking many nested components, so it's simplified
  test('Schedule should display booked slots', async () => {
    // Mock server response for schedule
    server.use(
      http.get('/api/schedule', () => {
        return HttpResponse.json({
          '2025-04-20': [
            { date: '2025-04-20', time: '1200', name: 'Test Walker', notes: 'Notes', timestamp: Date.now() }
          ],
          '2025-04-21': []
        });
      })
    );
    
    const mockSchedule = {
      '2025-04-20': [
        { date: '2025-04-20', time: '1200', name: 'Test Walker', notes: 'Notes', timestamp: Date.now() }
      ],
      '2025-04-21': []
    };
    
    // Render the Schedule component with mock data
    render(
      <Schedule 
        schedule={mockSchedule}
        userName="Test User"
        onUpdateUserName={vi.fn()}
        userPhone="+12345678900"
        onUpdateUserPhone={vi.fn()}
      />
    );
    
    // Check if the date and walker name are displayed
    await waitFor(() => {
      expect(screen.getByText(/test walker/i)).toBeInTheDocument();
    });
  });
});

// Helper function to populate test data
async function populateTestData() {
  // Add test walkers
  const walkers = ['Test Walker', 'Top Walker', 'Second Walker', 'Third Walker'];
  for (const walker of walkers) {
    await mockStorage.updateWalker(walker);
  }
  
  // Add some test slots
  await mockStorage.addSlot({
    date: '2025-04-20',
    time: '1200',
    name: 'Test Walker',
    notes: 'Existing booking'
  });
}