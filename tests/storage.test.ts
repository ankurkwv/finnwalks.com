import { describe, test, expect, beforeEach } from 'vitest';
import { mockStorage, resetMockStorage } from './mocks/storage.mock';

describe('Storage Tests', () => {
  beforeEach(() => {
    resetMockStorage();
  });

  test('should add a slot successfully', async () => {
    const slot = {
      date: '2025-04-20',
      time: '1200',
      name: 'Test Walker',
      notes: 'Test notes',
      phone: '+12345678910'
    };

    const result = await mockStorage.addSlot(slot);
    
    expect(result.date).toBe(slot.date);
    expect(result.time).toBe(slot.time);
    expect(result.name).toBe(slot.name);
    expect(result.notes).toBe(slot.notes);
    expect(result.phone).toBe(slot.phone);
    expect(result.timestamp).toBeTypeOf('number');
  });

  test('should retrieve a slot by date and time', async () => {
    const slot = {
      date: '2025-04-20',
      time: '1200',
      name: 'Test Walker',
      notes: 'Test notes'
    };

    await mockStorage.addSlot(slot);
    const result = await mockStorage.getSlot(slot.date, slot.time);
    
    expect(result).not.toBeNull();
    expect(result?.date).toBe(slot.date);
    expect(result?.time).toBe(slot.time);
    expect(result?.name).toBe(slot.name);
  });

  test('should remove a slot successfully', async () => {
    const slot = {
      date: '2025-04-20',
      time: '1200',
      name: 'Test Walker',
      notes: 'Test notes'
    };

    await mockStorage.addSlot(slot);
    const result = await mockStorage.removeSlot(slot.date, slot.time);
    
    expect(result).toBe(true);
    
    const checkSlot = await mockStorage.getSlot(slot.date, slot.time);
    expect(checkSlot).toBeNull();
  });

  test('should get a weekly schedule', async () => {
    const startDate = '2025-04-20';
    const slots = [
      {
        date: '2025-04-20',
        time: '1200',
        name: 'Walker 1',
        notes: 'Notes 1'
      },
      {
        date: '2025-04-21',
        time: '1300',
        name: 'Walker 2',
        notes: 'Notes 2'
      },
      {
        date: '2025-04-22',
        time: '1400',
        name: 'Walker 3',
        notes: 'Notes 3'
      }
    ];

    // Add slots
    for (const slot of slots) {
      await mockStorage.addSlot(slot);
    }

    // Get schedule
    const schedule = await mockStorage.getSchedule(startDate);
    
    // Check if all dates for the week are present
    expect(Object.keys(schedule).length).toBe(7);
    
    // Check if slots are correctly assigned to their dates
    expect(schedule['2025-04-20'].length).toBe(1);
    expect(schedule['2025-04-21'].length).toBe(1);
    expect(schedule['2025-04-22'].length).toBe(1);
    expect(schedule['2025-04-23'].length).toBe(0); // Empty day
    
    // Check slot content
    expect(schedule['2025-04-20'][0].name).toBe('Walker 1');
    expect(schedule['2025-04-21'][0].name).toBe('Walker 2');
    expect(schedule['2025-04-22'][0].name).toBe('Walker 3');
  });

  test('should get and update walker color index', async () => {
    const name = 'Test Walker';
    
    // Get color index for new walker
    const colorIndex = await mockStorage.getWalkerColorIndex(name);
    expect(colorIndex).toBeTypeOf('number');
    expect(colorIndex).toBeGreaterThanOrEqual(0);
    expect(colorIndex).toBeLessThan(10); // MAX_COLORS
    
    // Get same color index for same walker
    const sameColorIndex = await mockStorage.getWalkerColorIndex(name);
    expect(sameColorIndex).toBe(colorIndex);
  });

  test('should search walkers by name', async () => {
    // Add multiple walkers
    await mockStorage.updateWalker('John Doe');
    await mockStorage.updateWalker('Jane Doe');
    await mockStorage.updateWalker('Alice Smith');
    
    // Search with exact match
    const exactResults = await mockStorage.searchWalkers('John Doe');
    expect(exactResults.length).toBe(1);
    expect(exactResults[0].name).toBe('John Doe');
    
    // Search with partial match
    const partialResults = await mockStorage.searchWalkers('Doe');
    expect(partialResults.length).toBe(2);
    expect(partialResults.map(w => w.name)).toContain('John Doe');
    expect(partialResults.map(w => w.name)).toContain('Jane Doe');
    
    // Search with no match
    const noResults = await mockStorage.searchWalkers('XYZ');
    expect(noResults.length).toBe(0);
  });

  test('should generate all-time leaderboard', async () => {
    // Add slots with different walkers
    await mockStorage.addSlot({ date: '2025-04-20', time: '1000', name: 'Walker A' });
    await mockStorage.addSlot({ date: '2025-04-20', time: '1100', name: 'Walker B' });
    await mockStorage.addSlot({ date: '2025-04-21', time: '1000', name: 'Walker A' });
    await mockStorage.addSlot({ date: '2025-04-21', time: '1100', name: 'Walker A' });
    await mockStorage.addSlot({ date: '2025-04-22', time: '1000', name: 'Walker C' });
    
    // Get leaderboard
    const leaderboard = await mockStorage.getLeaderboardAllTime();
    
    // Check leaderboard order (by total walks descending)
    expect(leaderboard.length).toBe(3);
    expect(leaderboard[0].name).toBe('Walker A');
    expect(leaderboard[0].totalWalks).toBe(3);
    
    expect(leaderboard[1].name).toBe('Walker B');
    expect(leaderboard[1].totalWalks).toBe(1);
    
    expect(leaderboard[2].name).toBe('Walker C');
    expect(leaderboard[2].totalWalks).toBe(1);
  });

  test('should generate next week leaderboard', async () => {
    const startDate = '2025-04-20';
    
    // Add slots within the week
    await mockStorage.addSlot({ date: '2025-04-20', time: '1000', name: 'Walker A' });
    await mockStorage.addSlot({ date: '2025-04-21', time: '1000', name: 'Walker A' });
    await mockStorage.addSlot({ date: '2025-04-22', time: '1000', name: 'Walker B' });
    
    // Add slots outside the week
    await mockStorage.addSlot({ date: '2025-04-28', time: '1000', name: 'Walker A' });
    await mockStorage.addSlot({ date: '2025-04-29', time: '1000', name: 'Walker B' });
    
    // Get next week leaderboard
    const leaderboard = await mockStorage.getLeaderboardNextWeek(startDate);
    
    // Check leaderboard
    expect(leaderboard.length).toBe(2);
    expect(leaderboard[0].name).toBe('Walker A');
    expect(leaderboard[0].totalWalks).toBe(2);
    
    expect(leaderboard[1].name).toBe('Walker B');
    expect(leaderboard[1].totalWalks).toBe(1);
  });
});