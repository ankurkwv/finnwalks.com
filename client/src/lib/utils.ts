import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Combine class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Capitalize a full name properly
export function capitalizeFullName(name: string): string {
  if (!name) return '';
  
  return name.split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
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

/**
 * Convert a Date to a YYYY-MM-DD date string in ET timezone
 * This ensures consistency in date handling throughout the application
 */
export function toDateString(date: Date): string {
  // Create a formatter that will output the date in ET timezone
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    timeZone: 'America/New_York' // Eastern Time
  };
  
  // Get the YYYY-MM-DD format in ET timezone
  const formatted = new Intl.DateTimeFormat('fr-CA', options).format(date);
  return formatted; // returns YYYY-MM-DD format
}

/**
 * Get the current date in ET timezone as a YYYY-MM-DD string
 */
export function getCurrentDateET(): string {
  return toDateString(new Date());
}

/**
 * Generate a Date object from a YYYY-MM-DD string
 * This will create a date at midnight in the local timezone
 */
export function fromDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(num => parseInt(num));
  return new Date(year, month - 1, day); // month is 0-indexed in JS Date
}

// Format date for display
export function formatDate(dateStr: string): string {
  // For display formatting, use the browser's timezone which is what the user sees
  const date = fromDateString(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Format date with short month for display
export function formatDateShort(dateStr: string): string {
  // For display formatting, use the browser's timezone which is what the user sees
  const date = fromDateString(dateStr);
  return date.toLocaleDateString("en-US", {
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
    dates.push(toDateString(date));
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

// Cache of walker color indices to minimize API requests
const walkerColorCache: Record<string, number> = {};

// Get color index based on walker's name using the server API
export async function getWalkerColorIndex(name: string): Promise<number> {
  // If empty name, return default color index
  if (!name) return 0;
  
  // Check if we already have this name in our cache
  if (walkerColorCache[name] !== undefined) {
    return walkerColorCache[name];
  }

  try {
    // Fetch the color index from the server
    const response = await fetch(`/api/walker-color/${encodeURIComponent(name)}`);
    
    if (!response.ok) {
      console.error('Failed to get walker color index:', await response.text());
      return 0; // Default color in case of failure
    }
    
    const data = await response.json();
    
    // Cache the result for future use
    walkerColorCache[name] = data.colorIndex;
    
    return data.colorIndex;
  } catch (error) {
    console.error('Error fetching walker color index:', error);
    return 0; // Default color in case of failure
  }
}

// Synchronous version for immediate display while async version loads
// This provides a smooth experience without flicker
export function getWalkerColorIndexSync(name: string): number {
  // If empty name, return default color index
  if (!name) return 0;
  
  // If we have it cached, return the cached value
  if (walkerColorCache[name] !== undefined) {
    return walkerColorCache[name];
  }
  
  // If not cached, return a temporary placeholder
  // This will later be updated by the async version
  return 0;
}
