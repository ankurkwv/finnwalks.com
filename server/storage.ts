import Database from "@replit/database";
import { WalkingSlot, InsertSlot } from "@shared/schema";
import { eq, and, desc, asc, gte, lte } from 'drizzle-orm';
import { db } from './db';
import { walkingSlots, walkerColors } from '@shared/schema';

// Interface for storage operations
export interface IStorage {
  getSchedule(startDate: string): Promise<Record<string, WalkingSlot[]>>;
  getSlot(date: string, time: string): Promise<WalkingSlot | null>;
  addSlot(slot: InsertSlot): Promise<WalkingSlot>;
  removeSlot(date: string, time: string): Promise<boolean>;
  
  // Methods for walker management
  getWalkerColorIndex(name: string): Promise<number>;
  getAllWalkers(): Promise<{name: string, colorIndex: number, phone?: string}[]>;
  searchWalkers(query: string): Promise<{name: string, colorIndex: number, phone?: string}[]>;
  updateWalker(name: string, phone?: string): Promise<{name: string, colorIndex: number, phone?: string}>;
  
  // Leaderboard methods
  getLeaderboardAllTime(): Promise<Array<{name: string, totalWalks: number, colorIndex: number}>>;
  getLeaderboardNextWeek(startDate: string): Promise<Array<{name: string, totalWalks: number, colorIndex: number}>>;
}

// In-memory implementation for development
class MemStorage implements IStorage {
  private slots: Record<string, WalkingSlot> = {};
  // Track walkers and their color indices
  private walkers: Record<string, number> = {};
  // Total number of colors available in the app
  private readonly MAX_COLORS = 10;

  private createSlotKey(date: string, time: string): string {
    return `${date}:${time}`;
  }
  
  // Helper to create a consistent walker key
  private createWalkerKey(name: string): string {
    return `walker:${name}`;
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
  
  // Get walker color index - creates a new entry if walker doesn't exist
  async getWalkerColorIndex(name: string): Promise<number> {
    // If walker exists, return their color index
    if (this.walkers[name] !== undefined) {
      return this.walkers[name];
    }
    
    // Get the next available color index by finding the lowest unused index
    const existingIndices = Object.values(this.walkers);
    let nextIndex = 0;
    
    // Find the lowest available index
    while (existingIndices.includes(nextIndex)) {
      nextIndex = (nextIndex + 1) % this.MAX_COLORS;
    }
    
    // Assign and save the new color index
    this.walkers[name] = nextIndex;
    return nextIndex;
  }
  
  // Get all walkers with their color indices
  async getAllWalkers(): Promise<{name: string, colorIndex: number, phone?: string}[]> {
    return Object.entries(this.walkers).map(([name, colorIndex]) => ({
      name,
      colorIndex
    }));
  }
  
  // Search walkers by partial name match
  async searchWalkers(query: string): Promise<{name: string, colorIndex: number, phone?: string}[]> {
    if (!query) {
      return this.getAllWalkers();
    }
    
    const lowerQuery = query.toLowerCase();
    const walkers = await this.getAllWalkers();
    
    return walkers.filter(walker => 
      walker.name.toLowerCase().includes(lowerQuery)
    );
  }
  
  // Update walker information
  async updateWalker(name: string, phone?: string): Promise<{name: string, colorIndex: number, phone?: string}> {
    // Get or create the color index for this walker
    const colorIndex = await this.getWalkerColorIndex(name);
    
    // Return the updated walker info (note: in-memory implementation doesn't store phone numbers)
    return {
      name,
      colorIndex,
      phone
    };
  }
}

// Helper types for database values
type WalkerData = {
  colorIndex: number;
};

type SlotData = {
  name: string;
  notes: string;
  timestamp: number;
};

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
  
  // Helper to create consistent walker keys
  private createWalkerKey(name: string): string {
    return `walker:${name}`;
  }
  
  // Total number of colors available in the app
  private readonly MAX_COLORS = 10;

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
  
  // Get walker color index - creates a new entry if walker doesn't exist
  async getWalkerColorIndex(name: string): Promise<number> {
    try {
      const walkerKey = this.createWalkerKey(name);
      
      // Check if walker exists in database
      const colorData = await this.db.get(walkerKey);
      if (colorData && typeof colorData.colorIndex === 'number') {
        return colorData.colorIndex;
      }
      
      // Walker doesn't exist, need to assign a new color
      
      // Get all walkers to find the next available color index
      const walkers = await this.getAllWalkers();
      const existingIndices = walkers.map(walker => walker.colorIndex);
      
      // Find next available color index
      let nextIndex = 0;
      while (existingIndices.includes(nextIndex)) {
        nextIndex = (nextIndex + 1) % this.MAX_COLORS;
      }
      
      // Save the new walker with assigned color
      await this.db.set(walkerKey, { colorIndex: nextIndex });
      
      return nextIndex;
    } catch (error) {
      console.error('Error getting walker color:', error);
      // Return a default value in case of error
      return 0;
    }
  }
  
  // Get all walkers with their color indices
  async getAllWalkers(): Promise<{name: string, colorIndex: number, phone?: string}[]> {
    const walkers: {name: string, colorIndex: number, phone?: string}[] = [];
    
    try {
      // Get all keys from database
      const allKeys = await this.db.list();
      const keyArray = typeof allKeys === 'object' && !Array.isArray(allKeys) 
        ? Object.keys(allKeys) 
        : allKeys;
        
      // Filter for walker keys and extract data
      if (Array.isArray(keyArray)) {
        const walkerKeys = keyArray.filter(key => key.startsWith('walker:'));
        
        for (const key of walkerKeys) {
          try {
            const value = await this.db.get(key);
            if (value && typeof value.colorIndex === 'number') {
              const name = key.substring(7); // Remove 'walker:' prefix
              walkers.push({
                name,
                colorIndex: value.colorIndex,
                phone: value.phone
              });
            }
          } catch (e) {
            console.error('Error fetching walker data:', key, e);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching walkers:', error);
    }
    
    return walkers;
  }
  
  // Search walkers by partial name match
  async searchWalkers(query: string): Promise<{name: string, colorIndex: number, phone?: string}[]> {
    if (!query) {
      return this.getAllWalkers();
    }
    
    const lowerQuery = query.toLowerCase();
    const walkers = await this.getAllWalkers();
    
    return walkers.filter(walker => 
      walker.name.toLowerCase().includes(lowerQuery)
    );
  }
  
  // Update walker information
  async updateWalker(name: string, phone?: string): Promise<{name: string, colorIndex: number, phone?: string}> {
    try {
      const walkerKey = this.createWalkerKey(name);
      
      // Get the current color index or generate a new one
      const colorIndex = await this.getWalkerColorIndex(name);
      
      // Update the walker data with the phone number
      await this.db.set(walkerKey, { 
        colorIndex,
        phone: phone || undefined
      });
      
      return {
        name,
        colorIndex,
        phone
      };
    } catch (error) {
      console.error('Error updating walker:', error);
      return {
        name,
        colorIndex: 0,
        phone
      };
    }
  }
}

// PostgreSQL database implementation
export class DatabaseStorage implements IStorage {
  // Total number of colors available in the app
  private readonly MAX_COLORS = 10;

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
      // Get all slots for the date range
      const endDate = dates[dates.length - 1];
      const slots = await db.select().from(walkingSlots)
        .where(and(
          gte(walkingSlots.date, startDate),
          lte(walkingSlots.date, endDate)
        ))
        .orderBy(asc(walkingSlots.date), asc(walkingSlots.time));
      
      // Organize slots by date
      for (const slot of slots) {
        if (schedule[slot.date]) {
          schedule[slot.date].push({
            date: slot.date,
            time: slot.time,
            name: slot.name,
            notes: slot.notes || '',
            timestamp: slot.timestamp
          });
        }
      }
    } catch (error) {
      console.error('Schedule fetch error:', error);
    }

    return schedule;
  }

  // Get specific slot
  async getSlot(date: string, time: string): Promise<WalkingSlot | null> {
    try {
      const [slot] = await db.select().from(walkingSlots)
        .where(and(
          eq(walkingSlots.date, date),
          eq(walkingSlots.time, time)
        ));
      
      if (!slot) return null;
      
      return {
        date: slot.date,
        time: slot.time,
        name: slot.name,
        notes: slot.notes || '',
        timestamp: slot.timestamp
      };
    } catch (error) {
      console.error('Error getting slot:', error);
      return null;
    }
  }

  // Add a new slot
  async addSlot(slotData: InsertSlot): Promise<WalkingSlot> {
    const { date, time, name, phone, notes } = slotData;
    
    // Check if slot already exists
    const existingSlot = await this.getSlot(date, time);
    if (existingSlot) {
      throw new Error('Slot is already booked');
    }

    // Create the new slot
    const newSlot = {
      date,
      time,
      name,
      phone: phone || undefined,
      notes: notes || '',
      timestamp: Math.floor(Date.now() / 1000)
    };

    // Insert into database
    await db.insert(walkingSlots).values(newSlot);
    
    return newSlot;
  }

  // Remove a slot
  async removeSlot(date: string, time: string): Promise<boolean> {
    // Check if slot exists
    const existingSlot = await this.getSlot(date, time);
    if (!existingSlot) {
      return false;
    }

    // Delete the slot
    await db.delete(walkingSlots)
      .where(and(
        eq(walkingSlots.date, date),
        eq(walkingSlots.time, time)
      ));
    
    return true;
  }
  
  // Get walker color index - creates a new entry if walker doesn't exist
  async getWalkerColorIndex(name: string): Promise<number> {
    try {
      // Check if walker exists in database
      const [walker] = await db.select().from(walkerColors)
        .where(eq(walkerColors.name, name));
      
      if (walker) {
        return walker.colorIndex;
      }
      
      // Walker doesn't exist, need to assign a new color
      
      // Get all walkers to find the next available color index
      const walkers = await this.getAllWalkers();
      const existingIndices = walkers.map(walker => walker.colorIndex);
      
      // Find next available color index
      let nextIndex = 0;
      while (existingIndices.includes(nextIndex)) {
        nextIndex = (nextIndex + 1) % this.MAX_COLORS;
      }
      
      // Save the new walker with assigned color
      await db.insert(walkerColors).values({
        name,
        colorIndex: nextIndex
      });
      
      return nextIndex;
    } catch (error) {
      console.error('Error getting walker color:', error);
      // Return a default value in case of error
      return 0;
    }
  }
  
  // Get all walkers with their color indices and phone numbers
  async getAllWalkers(): Promise<{name: string, colorIndex: number, phone?: string}[]> {
    try {
      const walkers = await db.select().from(walkerColors);
      return walkers.map(walker => ({
        name: walker.name,
        colorIndex: walker.colorIndex,
        phone: walker.phone
      }));
    } catch (error) {
      console.error('Error fetching walkers:', error);
      return [];
    }
  }
  
  // Search walkers by partial name match
  async searchWalkers(query: string): Promise<{name: string, colorIndex: number, phone?: string}[]> {
    try {
      if (!query || query.trim() === '') {
        return this.getAllWalkers();
      }
      
      // Get all walkers and filter by name (case-insensitive)
      const allWalkers = await this.getAllWalkers();
      const lowerQuery = query.toLowerCase();
      
      return allWalkers.filter(walker => 
        walker.name.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching walkers:', error);
      return [];
    }
  }
  
  // Update or create a walker with phone number
  async updateWalker(name: string, phone?: string): Promise<{name: string, colorIndex: number, phone?: string}> {
    try {
      // Check if walker exists
      const [walker] = await db.select().from(walkerColors)
        .where(eq(walkerColors.name, name));
      
      if (walker) {
        // Update existing walker
        await db.update(walkerColors)
          .set({ phone })
          .where(eq(walkerColors.name, name));
        
        return {
          name,
          colorIndex: walker.colorIndex,
          phone
        };
      } else {
        // Create new walker with a color index
        const colorIndex = await this.getWalkerColorIndex(name);
        
        // Update with phone number
        await db.update(walkerColors)
          .set({ phone })
          .where(eq(walkerColors.name, name));
        
        return {
          name,
          colorIndex,
          phone
        };
      }
    } catch (error) {
      console.error('Error updating walker:', error);
      // Return a default value in case of error
      return {
        name,
        colorIndex: 0,
        phone
      };
    }
  }
  
  // Get leaderboard of walkers with the most walks (all time)
  async getLeaderboardAllTime(): Promise<Array<{name: string, totalWalks: number, colorIndex: number}>> {
    try {
      // Get all slots from the database
      const slots = await db.select().from(walkingSlots);
      
      // Count walks per walker
      const walkCounts: Record<string, number> = {};
      for (const slot of slots) {
        const walkerName = slot.name;
        walkCounts[walkerName] = (walkCounts[walkerName] || 0) + 1;
      }
      
      // Convert to array and sort by count (descending)
      const leaderboard = await Promise.all(
        Object.entries(walkCounts).map(async ([name, totalWalks]) => {
          // Get color index for each walker
          const colorIndex = await this.getWalkerColorIndex(name);
          return { name, totalWalks, colorIndex };
        })
      );
      
      // Sort by total walks (descending)
      return leaderboard.sort((a, b) => b.totalWalks - a.totalWalks);
    } catch (error) {
      console.error("Error fetching all-time leaderboard:", error);
      return [];
    }
  }
  
  // Get leaderboard for the next 7 days
  async getLeaderboardNextWeek(startDate: string): Promise<Array<{name: string, totalWalks: number, colorIndex: number}>> {
    try {
      // Calculate the date range
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(startDate);
      endDateObj.setDate(endDateObj.getDate() + 6);
      
      // Convert to ISO date strings for comparison
      const startDateStr = startDateObj.toISOString().split('T')[0];
      const endDateStr = endDateObj.toISOString().split('T')[0];
      
      // Get slots for the date range
      const slots = await db.select().from(walkingSlots)
        .where(and(
          gte(walkingSlots.date, startDateStr),
          lte(walkingSlots.date, endDateStr)
        ));
      
      // Count walks per walker for this week
      const walkCounts: Record<string, number> = {};
      for (const slot of slots) {
        const walkerName = slot.name;
        walkCounts[walkerName] = (walkCounts[walkerName] || 0) + 1;
      }
      
      // Convert to array and get color indices
      const leaderboard = await Promise.all(
        Object.entries(walkCounts).map(async ([name, totalWalks]) => {
          // Get color index for each walker
          const colorIndex = await this.getWalkerColorIndex(name);
          return { name, totalWalks, colorIndex };
        })
      );
      
      // Sort by total walks (descending)
      return leaderboard.sort((a, b) => b.totalWalks - a.totalWalks);
    } catch (error) {
      console.error("Error fetching next week leaderboard:", error);
      return [];
    }
  }
}

// Create and export a database storage instance
export const storage = new DatabaseStorage();
