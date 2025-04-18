import Database from "@replit/database";
import { WalkingSlot, InsertSlot } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  getSchedule(startDate: string): Promise<Record<string, WalkingSlot[]>>;
  getSlot(date: string, time: string): Promise<WalkingSlot | null>;
  addSlot(slot: InsertSlot): Promise<WalkingSlot>;
  removeSlot(date: string, time: string): Promise<boolean>;
}

// In-memory implementation for development
class MemStorage implements IStorage {
  private slots: Record<string, WalkingSlot> = {};

  private createSlotKey(date: string, time: string): string {
    return `${date}:${time}`;
  }

  async getSchedule(startDate: string): Promise<Record<string, WalkingSlot[]>> {
    const result: Record<string, WalkingSlot[]> = {};
    
    // Generate dates for 7 days
    const start = new Date(startDate);
    const dates: string[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);
      result[dateStr] = [];
    }

    // Group slots by date
    for (const key in this.slots) {
      const slot = this.slots[key];
      const { date } = slot;
      
      if (dates.includes(date)) {
        if (!result[date]) {
          result[date] = [];
        }
        result[date].push(slot);
      }
    }

    // Sort by time
    for (const date in result) {
      result[date].sort((a, b) => a.time.localeCompare(b.time));
    }

    return result;
  }

  async getSlot(date: string, time: string): Promise<WalkingSlot | null> {
    const key = this.createSlotKey(date, time);
    return this.slots[key] || null;
  }

  async addSlot(slotData: InsertSlot): Promise<WalkingSlot> {
    const { date, time, name, notes } = slotData;
    const key = this.createSlotKey(date, time);
    
    // Check if slot exists
    if (this.slots[key]) {
      throw new Error('Slot is already booked');
    }

    // Create new slot
    const newSlot: WalkingSlot = {
      date,
      time,
      name,
      notes: notes || '',
      timestamp: Date.now()
    };

    // Store it
    this.slots[key] = newSlot;
    return newSlot;
  }

  async removeSlot(date: string, time: string): Promise<boolean> {
    const key = this.createSlotKey(date, time);
    
    // Check if slot exists
    if (!this.slots[key]) {
      return false;
    }

    // Delete it
    delete this.slots[key];
    return true;
  }
}

// Replit Database implementation
export class ReplitStorage implements IStorage {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  // Helper to create consistent slot keys
  private createSlotKey(date: string, time: string): string {
    return `slots:${date}:${time}`;
  }

  // Get schedule for a week
  async getSchedule(startDate: string): Promise<Record<string, WalkingSlot[]>> {
    const schedule: Record<string, WalkingSlot[]> = {};
    
    // Generate 7 days from start date
    const dates: string[] = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);
      schedule[dateStr] = [];
    }

    try {
      // Get all keys using non-filter approach since filter may not work reliably
      const allKeys = await this.db.list();
      const keyArray = typeof allKeys === 'object' && !Array.isArray(allKeys) 
        ? Object.keys(allKeys) 
        : allKeys;
        
      // Manual filtering to find relevant keys
      const relevantKeys: string[] = [];
      if (Array.isArray(keyArray)) {
        for (const key of keyArray) {
          for (const date of dates) {
            if (key.indexOf(`slots:${date}:`) === 0) {
              relevantKeys.push(key);
              break;
            }
          }
        }
      }
      
      // Fetch all slots and organize by date
      for (const key of relevantKeys) {
        try {
          const value = await this.db.get(key);
          if (value) {
            const parts = key.split(':');
            if (parts.length === 3) {
              const date = parts[1];
              if (schedule[date]) {
                // Convert to expected type
                const slot = {
                  date: parts[1], 
                  time: parts[2],
                  name: value.name || 'Unknown',
                  notes: value.notes || '',
                  timestamp: value.timestamp || Date.now()
                } as WalkingSlot;
                
                schedule[date].push(slot);
              }
            }
          }
        } catch (e) {
          console.error('Error fetching slot:', key, e);
        }
      }

      // Sort slots by time
      for (const date in schedule) {
        schedule[date].sort((a, b) => a.time.localeCompare(b.time));
      }
    } catch (error) {
      console.error('Schedule fetch error:', error);
    }

    return schedule;
  }

  // Get specific slot
  async getSlot(date: string, time: string): Promise<WalkingSlot | null> {
    const key = this.createSlotKey(date, time);
    try {
      const value = await this.db.get(key);
      if (!value) return null;
      
      // Convert to expected type
      return {
        date,
        time,
        name: value.name || 'Unknown',
        notes: value.notes || '',
        timestamp: value.timestamp || Date.now()
      } as WalkingSlot;
    } catch (error) {
      console.error('Error getting slot:', error);
      return null;
    }
  }

  // Add a new slot
  async addSlot(slotData: InsertSlot): Promise<WalkingSlot> {
    const { date, time, name, notes } = slotData;
    const key = this.createSlotKey(date, time);
    
    // Check if slot already exists
    const existingSlot = await this.getSlot(date, time);
    if (existingSlot) {
      throw new Error('Slot is already booked');
    }

    // Create the new slot
    const newSlot: WalkingSlot = {
      date,
      time,
      name,
      notes: notes || '',
      timestamp: Date.now()
    };

    // Save to database
    await this.db.set(key, newSlot);
    return newSlot;
  }

  // Remove a slot
  async removeSlot(date: string, time: string): Promise<boolean> {
    const key = this.createSlotKey(date, time);
    
    // Check if slot exists
    const existingSlot = await this.getSlot(date, time);
    if (!existingSlot) {
      return false;
    }

    // Delete the slot
    await this.db.delete(key);
    return true;
  }
}

// Decide which storage to use
const useInMemory = process.env.NODE_ENV === 'development';

// Create and export a storage instance
export const storage = useInMemory 
  ? new MemStorage() 
  : new ReplitStorage();
