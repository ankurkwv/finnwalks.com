import { describe, test, expect, beforeEach } from 'vitest';
import { mockStorage, resetMockStorage } from './mocks/storage.mock';

describe('Storage Layer Tests', () => {
  // Reset mock storage before each test for clean state
  beforeEach(() => {
    resetMockStorage();
  });
  
  test('getSchedule returns weekly schedule', async () => {
    const schedule = await mockStorage.getSchedule('2025-04-20');
    
    // Check that April 20th has one slot
    expect(schedule).toHaveProperty('2025-04-20');
    expect(Array.isArray(schedule['2025-04-20'])).toBe(true);
    expect(schedule['2025-04-20'].length).toBe(1);
    
    // Check that other days are empty
    expect(schedule).toHaveProperty('2025-04-21');
    expect(Array.isArray(schedule['2025-04-21'])).toBe(true);
    expect(schedule['2025-04-21'].length).toBe(0);
  });
  
  test('addSlot creates a new walking slot', async () => {
    const newSlot = {
      date: '2025-04-21',
      time: '1400',
      name: 'TestUser',
      phone: '+19876543210',
      notes: 'Test notes'
    };
    
    const createdSlot = await mockStorage.addSlot(newSlot);
    
    // Check slot was created
    expect(createdSlot).toHaveProperty('date', '2025-04-21');
    expect(createdSlot).toHaveProperty('time', '1400');
    expect(createdSlot).toHaveProperty('name', 'TestUser');
    expect(createdSlot).toHaveProperty('phone', '+19876543210');
    expect(createdSlot).toHaveProperty('notes', 'Test notes');
    expect(createdSlot).toHaveProperty('timestamp');
    
    // Verify it's in the schedule
    const schedule = await mockStorage.getSchedule('2025-04-21');
    expect(schedule['2025-04-21'].length).toBe(1);
    expect(schedule['2025-04-21'][0].name).toBe('TestUser');
  });
  
  test('removeSlot deletes a slot', async () => {
    // First create a slot
    await mockStorage.addSlot({
      date: '2025-04-22',
      time: '1500',
      name: 'DeleteTest',
      notes: 'Test delete'
    });
    
    // Verify it's there
    let schedule = await mockStorage.getSchedule('2025-04-22');
    expect(schedule['2025-04-22'].length).toBe(1);
    
    // Delete it
    const result = await mockStorage.removeSlot('2025-04-22', '1500');
    expect(result).toBe(true);
    
    // Verify it's gone
    schedule = await mockStorage.getSchedule('2025-04-22');
    expect(schedule['2025-04-22'].length).toBe(0);
  });
  
  test('getWalkerColorIndex returns consistent color index', async () => {
    // Test with existing walker
    const color1 = await mockStorage.getWalkerColorIndex('Arpoo');
    const color2 = await mockStorage.getWalkerColorIndex('Arpoo');
    
    // Should be consistent
    expect(color1).toBe(color2);
    
    // Color should be a number between 0-9
    expect(typeof color1).toBe('number');
    expect(color1).toBeGreaterThanOrEqual(0);
    expect(color1).toBeLessThan(10);
  });
  
  test('searchWalkers finds walkers by partial name', async () => {
    // Create some test walkers via addSlot
    await mockStorage.addSlot({
      date: '2025-04-23',
      time: '1000',
      name: 'SearchTest1',
      notes: 'Test search'
    });
    
    await mockStorage.addSlot({
      date: '2025-04-23',
      time: '1100',
      name: 'SearchTest2',
      notes: 'Test search'
    });
    
    await mockStorage.addSlot({
      date: '2025-04-23',
      time: '1200',
      name: 'Different',
      notes: 'Test search'
    });
    
    // Search for them
    const results = await mockStorage.searchWalkers('Search');
    
    // Should have found the two SearchTest walkers
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.some(w => w.name === 'SearchTest1')).toBe(true);
    expect(results.some(w => w.name === 'SearchTest2')).toBe(true);
    
    // Should not have found the 'Different' walker
    expect(results.some(w => w.name === 'Different')).toBe(false);
  });
  
  test('updateWalker creates or updates walker info', async () => {
    // Create a new walker
    const newWalker = await mockStorage.updateWalker('UpdateTest', '+1234567890');
    
    expect(newWalker).toHaveProperty('name', 'UpdateTest');
    expect(newWalker).toHaveProperty('phone', '+1234567890');
    expect(newWalker).toHaveProperty('colorIndex');
    
    // Update existing walker
    const updatedWalker = await mockStorage.updateWalker('UpdateTest', '+9876543210');
    
    expect(updatedWalker).toHaveProperty('name', 'UpdateTest');
    expect(updatedWalker).toHaveProperty('phone', '+9876543210');
    
    // Color index should be preserved
    expect(updatedWalker.colorIndex).toBe(newWalker.colorIndex);
  });
  
  test('getLeaderboardAllTime returns all-time leaderboard', async () => {
    const leaderboard = await mockStorage.getLeaderboardAllTime();
    
    expect(Array.isArray(leaderboard)).toBe(true);
    
    if (leaderboard.length > 0) {
      const entry = leaderboard[0];
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('totalWalks');
      expect(entry).toHaveProperty('colorIndex');
    }
  });
  
  test('getLeaderboardNextWeek returns next week leaderboard', async () => {
    const leaderboard = await mockStorage.getLeaderboardNextWeek('2025-04-20');
    
    expect(Array.isArray(leaderboard)).toBe(true);
    
    if (leaderboard.length > 0) {
      const entry = leaderboard[0];
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('totalWalks');
      expect(entry).toHaveProperty('colorIndex');
    }
  });
});