import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Combine class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format time from HHMM to 12-hour format
export function formatTime(timeStr: string): string {
  const hour = parseInt(timeStr.substring(0, 2));
  const minute = timeStr.substring(2, 4);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

// Format time display for walks (just start time)
export function formatTimeRange(timeStr: string): string {
  // Just show the start time without a range
  return formatTime(timeStr);
}

// Format date
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Format date with short month
export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

// Generate a range of dates
export function generateDateRange(startDate: Date, days: number): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }
  
  return dates;
}

// Get available times (8:00 AM to 8:00 PM in 30-minute increments)
export function getAvailableTimes(bookedSlots: string[] = []): { value: string; label: string }[] {
  const times: { value: string; label: string }[] = [];
  
  // 8:00 AM (08:00) to 8:00 PM (20:00)
  for (let hour = 8; hour <= 20; hour++) {
    // Full hour (XX:00)
    const hourStr = hour.toString().padStart(2, "0");
    const fullHourValue = `${hourStr}00`;
    
    if (!bookedSlots.includes(fullHourValue)) {
      times.push({
        value: fullHourValue,
        label: formatTime(fullHourValue),
      });
    }
    
    // Half hour (XX:30) - except for 8:30 PM
    if (hour < 20) {
      const halfHourValue = `${hourStr}30`;
      
      if (!bookedSlots.includes(halfHourValue)) {
        times.push({
          value: halfHourValue,
          label: formatTime(halfHourValue),
        });
      }
    }
  }
  
  return times;
}

// Get color index based on walker's name
export function getWalkerColorIndex(name: string): number {
  // If empty name, return default color index
  if (!name) return 0;
  
  // Directly map specific common names to fixed indices for consistency
  const nameMap: Record<string, number> = {
    'Alice': 0,
    'Bob': 1,
    'Charlie': 2,
    'David': 3,
    'Emma': 4,
    'Frank': 5,
    'Grace': 6,
    'Henry': 7,
    'Ivy': 8,
    'Jack': 9,
    // Add more mappings if needed
  };
  
  // Check if we have a direct mapping for this name
  if (nameMap[name] !== undefined) {
    return nameMap[name];
  }
  
  // Improved hash function for better distribution
  let hash = 0;
  // Use the first, middle, and last characters plus length to improve uniqueness
  const chars = name.toLowerCase().split('');
  const first = chars[0] ? chars[0].charCodeAt(0) : 0;
  const middle = chars[Math.floor(chars.length/2)] ? chars[Math.floor(chars.length/2)].charCodeAt(0) : 0;
  const last = chars[chars.length-1] ? chars[chars.length-1].charCodeAt(0) : 0;
  
  hash = ((first * 31) ^ (middle * 17) ^ (last * 13)) + name.length;
  
  return Math.abs(hash % 10); // 10 different colors
}
