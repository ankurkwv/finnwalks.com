import { vi } from 'vitest';
import { InsertSlot, WalkingSlot, DeleteSlot, Walker } from '../../shared/schema';
import type { IStorage } from '../../server/storage';

// Mock data for in-memory testing
const mockSlots: Record<string, WalkingSlot[]> = {
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

const mockWalkers: Walker[] = [
  { name: 'Arpoo', colorIndex: 0, phone: '+1234567890' },
  { name: 'Bruno', colorIndex: 1, phone: '+1987654321' },
  { name: 'Charlie', colorIndex: 2 }
];

// Synchronous color index calculation for internal use
function getWalkerColorIndexSync(name: string): number {
  const walker = mockWalkers.find(w => w.name === name);
  if (walker) return walker.colorIndex;
  
  // Deterministic color assignment based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash % 10); // 10 colors available
}

// Create a mock storage implementation for testing
export const mockStorage: IStorage = {
  getSchedule: vi.fn(async (startDate: string) => {
    return { ...mockSlots };
  }),
  
  getSlot: vi.fn(async (date: string, time: string) => {
    const slots = mockSlots[date] || [];
    return slots.find(slot => slot.time === time) || null;
  }),
  
  addSlot: vi.fn(async (slotData: InsertSlot) => {
    const newSlot: WalkingSlot = {
      date: slotData.date,
      time: slotData.time,
      name: slotData.name,
      phone: slotData.phone,
      notes: slotData.notes || '',
      timestamp: Date.now()
    };
    
    if (!mockSlots[slotData.date]) {
      mockSlots[slotData.date] = [];
    }
    
    mockSlots[slotData.date].push(newSlot);
    return newSlot;
  }),
  
  removeSlot: vi.fn(async (date: string, time: string) => {
    if (!mockSlots[date]) return false;
    
    const initialLength = mockSlots[date].length;
    mockSlots[date] = mockSlots[date].filter(slot => slot.time !== time);
    
    return mockSlots[date].length < initialLength;
  }),
  
  getWalkerColorIndex: vi.fn(async (name: string) => {
    return getWalkerColorIndexSync(name);
  }),
  
  getAllWalkers: vi.fn(async () => {
    return [...mockWalkers];
  }),
  
  searchWalkers: vi.fn(async (query: string) => {
    // Add walkers created by addSlot to the walkers list
    const allWalkers: Walker[] = [...mockWalkers];
    
    // Get all the unique walker names from slot bookings
    Object.values(mockSlots).forEach(slots => {
      slots.forEach(slot => {
        if (!allWalkers.some(w => w.name === slot.name)) {
          allWalkers.push({
            name: slot.name,
            colorIndex: getWalkerColorIndexSync(slot.name),
            phone: slot.phone
          });
        }
      });
    });
    
    // Filter by query
    return allWalkers.filter(walker => 
      walker.name.toLowerCase().includes(query.toLowerCase())
    );
  }),
  
  updateWalker: vi.fn(async (name: string, phone?: string) => {
    let walker = mockWalkers.find(w => w.name === name);
    
    if (!walker) {
      walker = { 
        name, 
        colorIndex: mockWalkers.length % 10,
        phone 
      };
      mockWalkers.push(walker);
    } else if (phone) {
      walker.phone = phone;
    }
    
    return { ...walker };
  }),
  
  getLeaderboardAllTime: vi.fn(async () => {
    return [
      { name: 'Arpoo', totalWalks: 2, colorIndex: 0 },
      { name: 'Bruno', totalWalks: 1, colorIndex: 1 }
    ];
  }),
  
  getLeaderboardNextWeek: vi.fn(async () => {
    return [
      { name: 'Arpoo', totalWalks: 1, colorIndex: 0 }
    ];
  })
};

// Reset all mock data
export function resetMockStorage() {
  Object.keys(mockSlots).forEach(date => {
    if (date === '2025-04-20') {
      mockSlots[date] = [
        {
          date: '2025-04-20',
          time: '1200',
          name: 'Arpoo',
          notes: 'Regular walk',
          timestamp: Date.now() - 100000
        }
      ];
    } else {
      mockSlots[date] = [];
    }
  });
  
  // Reset call history for all mocks
  vi.clearAllMocks();
}