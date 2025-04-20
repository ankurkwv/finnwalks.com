import { vi } from 'vitest';
import type { IStorage } from '../../server/storage';
import type { WalkingSlot, InsertSlot } from '../../shared/schema';

/**
 * A simple in-memory hash function for consistent color mapping
 */
function getWalkerColorIndexSync(name: string): number {
  // Simple hash function to get a number between 0-9 for a given name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash % 10); // Return value between 0-9
}

// In-memory storage for testing
const mockSlots: Record<string, WalkingSlot> = {};
const mockWalkers: Record<string, { colorIndex: number, phone?: string }> = {};

export const mockStorage: IStorage = {
  // Schedule methods
  getSchedule: vi.fn(async (startDate: string): Promise<Record<string, WalkingSlot[]>> => {
    // Generate a week of dates
    const start = new Date(startDate);
    const schedule: Record<string, WalkingSlot[]> = {};
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find slots for this date
      schedule[dateStr] = Object.values(mockSlots).filter(slot => slot.date === dateStr);
    }
    
    return schedule;
  }),
  
  getSlot: vi.fn(async (date: string, time: string): Promise<WalkingSlot | null> => {
    const key = `${date}:${time}`;
    return mockSlots[key] || null;
  }),
  
  addSlot: vi.fn(async (slotData: InsertSlot): Promise<WalkingSlot> => {
    const { date, time, name, phone, notes } = slotData;
    const key = `${date}:${time}`;
    
    // Check if slot is already booked
    if (mockSlots[key]) {
      throw new Error('Slot already booked');
    }
    
    // Create a new slot
    const newSlot: WalkingSlot = {
      date,
      time,
      name,
      phone,
      notes,
      timestamp: Date.now()
    };
    
    mockSlots[key] = newSlot;
    
    // Add walker if not exists
    if (!mockWalkers[name]) {
      mockWalkers[name] = { colorIndex: getWalkerColorIndexSync(name), phone };
    }
    
    return newSlot;
  }),
  
  removeSlot: vi.fn(async (date: string, time: string): Promise<boolean> => {
    const key = `${date}:${time}`;
    
    if (!mockSlots[key]) {
      return false;
    }
    
    delete mockSlots[key];
    return true;
  }),
  
  // Walker methods
  getWalkerColorIndex: vi.fn(async (name: string): Promise<number> => {
    if (mockWalkers[name]) {
      return mockWalkers[name].colorIndex;
    }
    
    // If walker doesn't exist, create a new one
    const colorIndex = getWalkerColorIndexSync(name);
    mockWalkers[name] = { colorIndex };
    return colorIndex;
  }),
  
  getAllWalkers: vi.fn(async (): Promise<{name: string, colorIndex: number, phone?: string}[]> => {
    return Object.entries(mockWalkers).map(([name, data]) => ({
      name,
      colorIndex: data.colorIndex,
      phone: data.phone
    }));
  }),
  
  searchWalkers: vi.fn(async (query: string): Promise<{name: string, colorIndex: number, phone?: string}[]> => {
    const lowerQuery = query.toLowerCase();
    return Object.entries(mockWalkers)
      .filter(([name]) => name.toLowerCase().includes(lowerQuery))
      .map(([name, data]) => ({
        name,
        colorIndex: data.colorIndex,
        phone: data.phone
      }));
  }),
  
  updateWalker: vi.fn(async (name: string, phone?: string): Promise<{name: string, colorIndex: number, phone?: string}> => {
    if (mockWalkers[name]) {
      if (phone !== undefined) {
        mockWalkers[name].phone = phone;
      }
    } else {
      mockWalkers[name] = {
        colorIndex: getWalkerColorIndexSync(name),
        phone
      };
    }
    
    return {
      name,
      colorIndex: mockWalkers[name].colorIndex,
      phone: mockWalkers[name].phone
    };
  }),
  
  // Leaderboard methods
  getLeaderboardAllTime: vi.fn(async (): Promise<Array<{name: string, totalWalks: number, colorIndex: number}>> => {
    // Count the number of walks for each walker
    const walkerCounts: Record<string, number> = {};
    
    Object.values(mockSlots).forEach(slot => {
      walkerCounts[slot.name] = (walkerCounts[slot.name] || 0) + 1;
    });
    
    // Convert to leaderboard format
    return Object.entries(walkerCounts)
      .map(([name, totalWalks]) => ({
        name,
        totalWalks,
        colorIndex: mockWalkers[name]?.colorIndex || getWalkerColorIndexSync(name)
      }))
      .sort((a, b) => b.totalWalks - a.totalWalks);
  }),
  
  getLeaderboardNextWeek: vi.fn(async (startDate: string): Promise<Array<{name: string, totalWalks: number, colorIndex: number}>> => {
    // Generate a week of dates
    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + 7);
    
    // Count walks for each walker in the next week only
    const walkerCounts: Record<string, number> = {};
    
    Object.values(mockSlots).forEach(slot => {
      const slotDate = new Date(slot.date);
      if (slotDate >= start && slotDate < endDate) {
        walkerCounts[slot.name] = (walkerCounts[slot.name] || 0) + 1;
      }
    });
    
    // Convert to leaderboard format
    return Object.entries(walkerCounts)
      .map(([name, totalWalks]) => ({
        name,
        totalWalks,
        colorIndex: mockWalkers[name]?.colorIndex || getWalkerColorIndexSync(name)
      }))
      .sort((a, b) => b.totalWalks - a.totalWalks);
  })
};

// Reset function to clear all mock data
export function resetMockStorage() {
  // Clear all slots
  Object.keys(mockSlots).forEach(key => {
    delete mockSlots[key];
  });
  
  // Clear all walkers
  Object.keys(mockWalkers).forEach(key => {
    delete mockWalkers[key];
  });
  
  // Reset mock function call history
  vi.clearAllMocks();
}