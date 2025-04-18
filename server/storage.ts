import Database from "@replit/database";
import { WalkingSlot, InsertSlot } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  getSchedule(startDate: string): Promise<Record<string, WalkingSlot[]>>;
  getSlot(date: string, time: string): Promise<WalkingSlot | null>;
  addSlot(slot: InsertSlot): Promise<WalkingSlot>;
  removeSlot(date: string, time: string): Promise<boolean>;
}

export class ReplitStorage implements IStorage {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  // Helper to create slot key
  private createSlotKey(date: string, time: string): string {
    return `slots:${date}:${time}`;
  }

  // Get all slots for a week starting from startDate
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

    // Get all keys that match our date range
    const allKeys = await this.db.list();
    const relevantKeys = allKeys.filter(key => {
      for (const date of dates) {
        if (key.startsWith(`slots:${date}:`)) {
          return true;
        }
      }
      return false;
    });

    // Fetch all slots and organize by date
    if (relevantKeys.length > 0) {
      const slotData = await Promise.all(
        relevantKeys.map(async (key) => {
          const value = await this.db.get(key);
          return { key, value };
        })
      );

      for (const { key, value } of slotData) {
        const parts = key.split(':');
        if (parts.length === 3) {
          const date = parts[1];
          const slot = value as WalkingSlot;
          
          if (!schedule[date]) {
            schedule[date] = [];
          }
          
          schedule[date].push(slot);
        }
      }

      // Sort slots by time
      for (const date in schedule) {
        schedule[date].sort((a, b) => a.time.localeCompare(b.time));
      }
    }

    return schedule;
  }

  // Get a specific slot
  async getSlot(date: string, time: string): Promise<WalkingSlot | null> {
    const key = this.createSlotKey(date, time);
    try {
      const slot = await this.db.get(key) as WalkingSlot | null;
      return slot;
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

// Create and export a storage instance
export const storage = new ReplitStorage();
