import { http, HttpResponse } from 'msw';
import { Walker, WalkingSlot, InsertSlot } from '../../shared/schema';
import { mockStorage } from './storage.mock';

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

// Define API endpoint handlers
export const handlers = [
  // Get weekly schedule
  http.get('/api/schedule', async ({ request }) => {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('start') || '2025-04-20';
    const schedule = await mockStorage.getSchedule(startDate);
    return HttpResponse.json(schedule, { status: 200 });
  }),
  
  // Add a new slot
  http.post('/api/slot', async ({ request }) => {
    const slotData = await request.json() as InsertSlot;
    
    // Validate required fields
    if (!slotData.date || !slotData.time || !slotData.name) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const existingSlot = await mockStorage.getSlot(slotData.date, slotData.time);
    if (existingSlot) {
      return HttpResponse.json(
        { error: 'Slot already booked' },
        { status: 409 }
      );
    }
    
    try {
      const newSlot = await mockStorage.addSlot(slotData);
      return HttpResponse.json(newSlot, { status: 201 });
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to add slot' },
        { status: 500 }
      );
    }
  }),
  
  // Delete a slot
  http.delete('/api/slot', async ({ request }) => {
    const body = await request.json() as { date: string; time: string; name: string };
    const { date, time, name } = body;
    
    if (!date || !time || !name) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const existingSlot = await mockStorage.getSlot(date, time);
    if (!existingSlot) {
      return HttpResponse.json(
        { error: 'Slot not found' },
        { status: 404 }
      );
    }
    
    if (existingSlot.name !== name) {
      return HttpResponse.json(
        { error: 'Unauthorized to delete this slot' },
        { status: 403 }
      );
    }
    
    try {
      const success = await mockStorage.removeSlot(date, time);
      if (success) {
        return HttpResponse.json({ success: true }, { status: 200 });
      } else {
        return HttpResponse.json(
          { error: 'Failed to delete slot' },
          { status: 500 }
        );
      }
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to delete slot' },
        { status: 500 }
      );
    }
  }),
  
  // Get walker color index
  http.get('/api/walker-color/:name', async ({ params }) => {
    const name = params.name as string;
    const colorIndex = await mockStorage.getWalkerColorIndex(name);
    return HttpResponse.json({ colorIndex }, { status: 200 });
  }),
  
  // Search walkers
  http.get('/api/walkers/search', async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const walkers = await mockStorage.searchWalkers(query);
    return HttpResponse.json(walkers, { status: 200 });
  }),
  
  // Update walker info
  http.post('/api/walkers/update', async ({ request }) => {
    const body = await request.json() as { name: string; phone?: string };
    const { name, phone } = body;
    
    if (!name) {
      return HttpResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    try {
      const walker = await mockStorage.updateWalker(name, phone);
      return HttpResponse.json(walker, { status: 200 });
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to update walker' },
        { status: 500 }
      );
    }
  }),
  
  // Get all-time leaderboard
  http.get('/api/leaderboard/all-time', async () => {
    const leaderboard = await mockStorage.getLeaderboardAllTime();
    return HttpResponse.json(leaderboard, { status: 200 });
  }),
  
  // Get next week leaderboard
  http.get('/api/leaderboard/next-week', async ({ request }) => {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('start') || '2025-04-20';
    const leaderboard = await mockStorage.getLeaderboardNextWeek(startDate);
    return HttpResponse.json(leaderboard, { status: 200 });
  })
];