import { InsertSlot, WalkingSlot, Walker } from '../../shared/schema';
import { IStorage } from '../../server/storage';

// Mock storage implementation for testing
class MockStorage implements IStorage {
  private slots: Record<string, WalkingSlot> = {};
  private walkers: Record<string, { colorIndex: number; phone?: string }> = {};
  private readonly MAX_COLORS = 10;

  private createSlotKey(date: string, time: string): string {
    return `${date}:${time}`;
  }

  // Schedule methods
  async getSchedule(startDate: string): Promise<Record<string, WalkingSlot[]>> {
    const result: Record<string, WalkingSlot[]> = {};
    
    // Create a week's worth of dates starting from startDate
    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      result[dateStr] = [];
    }
    
    // Fill in the slots
    Object.values(this.slots).forEach(slot => {
      if (result[slot.date]) {
        result[slot.date].push({ ...slot });
      }
    });
    
    return result;
  }

  async getSlot(date: string, time: string): Promise<WalkingSlot | null> {
    const key = this.createSlotKey(date, time);
    return this.slots[key] ? { ...this.slots[key] } : null;
  }

  async addSlot(slotData: InsertSlot): Promise<WalkingSlot> {
    const { date, time, name, notes = '', phone } = slotData;
    
    // Create a new slot
    const newSlot: WalkingSlot = {
      date,
      time,
      name,
      notes,
      timestamp: Date.now(),
    };
    
    if (phone) {
      newSlot.phone = phone;
    }
    
    // Save to "database"
    const key = this.createSlotKey(date, time);
    this.slots[key] = newSlot;
    
    // Ensure walker has a color index
    if (!this.walkers[name]) {
      await this.updateWalker(name, phone);
    }
    
    return { ...newSlot };
  }

  async removeSlot(date: string, time: string): Promise<boolean> {
    const key = this.createSlotKey(date, time);
    if (this.slots[key]) {
      delete this.slots[key];
      return true;
    }
    return false;
  }

  // Walker methods
  async getWalkerColorIndex(name: string): Promise<number> {
    if (!this.walkers[name]) {
      // Assign a new color index if this is a new walker
      const colorIndex = Object.keys(this.walkers).length % this.MAX_COLORS;
      this.walkers[name] = { colorIndex };
    }
    return this.walkers[name].colorIndex;
  }

  async getAllWalkers(): Promise<{ name: string; colorIndex: number; phone?: string }[]> {
    return Object.entries(this.walkers).map(([name, data]) => ({
      name,
      colorIndex: data.colorIndex,
      phone: data.phone
    }));
  }

  async searchWalkers(query: string): Promise<{ name: string; colorIndex: number; phone?: string }[]> {
    const lowerQuery = query.toLowerCase();
    return Object.entries(this.walkers)
      .filter(([name]) => name.toLowerCase().includes(lowerQuery))
      .map(([name, data]) => ({
        name,
        colorIndex: data.colorIndex,
        phone: data.phone
      }));
  }

  async updateWalker(name: string, phone?: string): Promise<{ name: string; colorIndex: number; phone?: string }> {
    if (!this.walkers[name]) {
      const colorIndex = Object.keys(this.walkers).length % this.MAX_COLORS;
      this.walkers[name] = { colorIndex };
    }
    
    if (phone !== undefined) {
      this.walkers[name].phone = phone;
    }
    
    return {
      name,
      colorIndex: this.walkers[name].colorIndex,
      phone: this.walkers[name].phone
    };
  }
  
  // Leaderboard methods
  async getLeaderboardAllTime(): Promise<Array<{ name: string; totalWalks: number; colorIndex: number }>> {
    const walkCounts: Record<string, number> = {};
    
    // Count walks for each walker
    Object.values(this.slots).forEach(slot => {
      walkCounts[slot.name] = (walkCounts[slot.name] || 0) + 1;
    });
    
    // Create and sort leaderboard entries
    const leaderboard = Object.entries(walkCounts).map(([name, totalWalks]) => ({
      name,
      totalWalks,
      colorIndex: this.walkers[name]?.colorIndex || 0
    }));
    
    // Sort by walk count (descending)
    return leaderboard.sort((a, b) => b.totalWalks - a.totalWalks);
  }
  
  async getLeaderboardNextWeek(startDate: string): Promise<Array<{ name: string; totalWalks: number; colorIndex: number }>> {
    const walkCounts: Record<string, number> = {};
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    
    // Count walks for each walker in the specified week
    Object.values(this.slots).forEach(slot => {
      const slotDate = new Date(slot.date);
      if (slotDate >= start && slotDate < end) {
        walkCounts[slot.name] = (walkCounts[slot.name] || 0) + 1;
      }
    });
    
    // Create and sort leaderboard entries
    const leaderboard = Object.entries(walkCounts).map(([name, totalWalks]) => ({
      name,
      totalWalks,
      colorIndex: this.walkers[name]?.colorIndex || 0
    }));
    
    // Sort by walk count (descending)
    return leaderboard.sort((a, b) => b.totalWalks - a.totalWalks);
  }
}

// Create a single instance of the mock storage
export const mockStorage = new MockStorage();

// Reset function to clear mock data between tests
export function resetMockStorage(): void {
  (mockStorage as any).slots = {};
  (mockStorage as any).walkers = {};
}