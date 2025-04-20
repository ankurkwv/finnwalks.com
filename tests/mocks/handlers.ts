import { http, HttpResponse } from 'msw';
import { WalkingSlot, Walker } from '../../shared/schema';

// Mock data for testing
export const mockSchedule: Record<string, WalkingSlot[]> = {
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
};

export const mockWalkers: Walker[] = [
  { name: 'Arpoo', colorIndex: 0, phone: '+1234567890' },
  { name: 'Bruno', colorIndex: 1, phone: '+1987654321' },
  { name: 'Charlie', colorIndex: 2 }
];

export const mockLeaderboard = [
  { name: 'Arpoo', totalWalks: 2, colorIndex: 0 },
  { name: 'Bruno', totalWalks: 1, colorIndex: 1 }
];

// Mock HTTP handlers
export const handlers = [
  // Get schedule
  http.get('/api/schedule', ({ request }) => {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('start') || '2025-04-20';
    
    return HttpResponse.json(mockSchedule);
  }),
  
  // Add a slot
  http.post('/api/slot', async ({ request }) => {
    const data = await request.json();
    
    // Check if the slot is already booked
    const date = data.date;
    const time = data.time;
    
    if (mockSchedule[date]?.some(slot => slot.time === time)) {
      return new HttpResponse(
        JSON.stringify({ error: 'Slot already booked' }),
        { status: 400 }
      );
    }
    
    // Create a new slot
    const newSlot: WalkingSlot = {
      date,
      time,
      name: data.name,
      phone: data.phone,
      notes: data.notes || '',
      timestamp: Date.now()
    };
    
    // Add to mock schedule
    if (!mockSchedule[date]) {
      mockSchedule[date] = [];
    }
    mockSchedule[date].push(newSlot);
    
    return HttpResponse.json(newSlot, { status: 201 });
  }),
  
  // Delete a slot
  http.delete('/api/slot', async ({ request }) => {
    const data = await request.json();
    const { date, time } = data;
    
    // Check if the slot exists
    if (!mockSchedule[date] || !mockSchedule[date].some(slot => slot.time === time)) {
      return new HttpResponse(
        JSON.stringify({ error: 'Slot not found' }),
        { status: 404 }
      );
    }
    
    // Remove the slot
    mockSchedule[date] = mockSchedule[date].filter(slot => slot.time !== time);
    
    return HttpResponse.json({ success: true });
  }),
  
  // Get walker color
  http.get('/api/walker-color/:name', ({ params }) => {
    const name = params.name as string;
    const walker = mockWalkers.find(w => w.name === name);
    const colorIndex = walker ? walker.colorIndex : Math.floor(Math.random() * 10);
    
    return HttpResponse.json({ colorIndex });
  }),
  
  // Search walkers
  http.get('/api/walkers/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    
    const filteredWalkers = mockWalkers.filter(
      walker => walker.name.toLowerCase().includes(query.toLowerCase())
    );
    
    return HttpResponse.json(filteredWalkers);
  }),
  
  // Update walker
  http.post('/api/walkers/update', async ({ request }) => {
    const data = await request.json();
    const { name, phone } = data;
    
    let walker = mockWalkers.find(w => w.name === name);
    
    if (!walker) {
      walker = {
        name,
        colorIndex: mockWalkers.length % 10,
        phone
      };
      mockWalkers.push(walker);
    } else {
      walker.phone = phone;
    }
    
    return HttpResponse.json(walker);
  }),
  
  // Get all-time leaderboard
  http.get('/api/leaderboard/all-time', () => {
    return HttpResponse.json(mockLeaderboard);
  }),
  
  // Get next-week leaderboard
  http.get('/api/leaderboard/next-week', () => {
    return HttpResponse.json(mockLeaderboard);
  })
];