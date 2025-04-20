import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mockStorage, resetMockStorage } from './mocks/storage.mock';
import { InsertSlot } from '../shared/schema';

describe('Storage Layer Tests', () => {
  beforeEach(() => {
    resetMockStorage();
  });
  
  afterEach(() => {
    resetMockStorage();
  });
  
  test('getSchedule returns weekly schedule', async () => {
    // Add some test data
    await mockStorage.addSlot({
      date: '2025-04-20',
      time: '1200',
      name: 'TestUser',
      notes: 'Test walk'
    });
    
    await mockStorage.addSlot({
      date: '2025-04-21',
      time: '1400',
      name: 'AnotherUser',
      notes: 'Another test walk'
    });
    
    const schedule = await mockStorage.getSchedule('2025-04-20');
    
    // Check schedule structure
    expect(schedule).toHaveProperty('2025-04-20');
    expect(schedule).toHaveProperty('2025-04-21');
    expect(Array.isArray(schedule['2025-04-20'])).toBe(true);
    expect(Array.isArray(schedule['2025-04-21'])).toBe(true);
    
    // Check slots content
    expect(schedule['2025-04-20'].length).toBe(1);
    expect(schedule['2025-04-20'][0].name).toBe('TestUser');
    expect(schedule['2025-04-21'].length).toBe(1);
    expect(schedule['2025-04-21'][0].name).toBe('AnotherUser');
  });
  
  test('addSlot creates a new walking slot', async () => {
    const slotData: InsertSlot = {
      date: '2025-04-20',
      time: '1500',
      name: 'TestUser',
      phone: '+19876543210',
      notes: 'Test walk'
    };
    
    const newSlot = await mockStorage.addSlot(slotData);
    
    // Check return value
    expect(newSlot).toMatchObject(slotData);
    expect(newSlot).toHaveProperty('timestamp');
    
    // Verify it's stored
    const schedule = await mockStorage.getSchedule('2025-04-20');
    expect(schedule['2025-04-20'].length).toBe(1);
    expect(schedule['2025-04-20'][0].date).toBe(slotData.date);
    expect(schedule['2025-04-20'][0].time).toBe(slotData.time);
    expect(schedule['2025-04-20'][0].name).toBe(slotData.name);
  });
  
  test('removeSlot deletes a slot', async () => {
    // Create a test slot
    const slotData: InsertSlot = {
      date: '2025-04-20',
      time: '1600',
      name: 'TestUser'
    };
    
    await mockStorage.addSlot(slotData);
    
    // Verify it exists
    let schedule = await mockStorage.getSchedule('2025-04-20');
    expect(schedule['2025-04-20'].length).toBe(1);
    
    // Remove the slot
    const result = await mockStorage.removeSlot(slotData.date, slotData.time);
    expect(result).toBe(true);
    
    // Verify it's removed
    schedule = await mockStorage.getSchedule('2025-04-20');
    expect(schedule['2025-04-20'].length).toBe(0);
  });
  
  test('getWalkerColorIndex returns consistent color index', async () => {
    const name = 'TestWalker';
    
    // Get color index first time
    const colorIndex1 = await mockStorage.getWalkerColorIndex(name);
    expect(typeof colorIndex1).toBe('number');
    expect(colorIndex1).toBeGreaterThanOrEqual(0);
    expect(colorIndex1).toBeLessThan(10); // MAX_COLORS is 10
    
    // Get color index second time (should match)
    const colorIndex2 = await mockStorage.getWalkerColorIndex(name);
    expect(colorIndex2).toBe(colorIndex1);
  });
  
  test('searchWalkers finds walkers by partial name', async () => {
    // Add some test walkers
    await mockStorage.updateWalker('TestWalker1');
    await mockStorage.updateWalker('TestWalker2');
    await mockStorage.updateWalker('DifferentName');
    
    // Search for 'Test'
    let results = await mockStorage.searchWalkers('Test');
    expect(results.length).toBe(2);
    expect(results.some(w => w.name === 'TestWalker1')).toBe(true);
    expect(results.some(w => w.name === 'TestWalker2')).toBe(true);
    
    // Search for 'Different'
    results = await mockStorage.searchWalkers('Different');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('DifferentName');
    
    // Search for non-existent name
    results = await mockStorage.searchWalkers('NonExistent');
    expect(results.length).toBe(0);
  });
  
  test('updateWalker creates or updates walker info', async () => {
    const name = 'TestWalker';
    const phone = '+19876543210';
    
    // Create a new walker
    let walker = await mockStorage.updateWalker(name, phone);
    expect(walker.name).toBe(name);
    expect(walker.phone).toBe(phone);
    expect(typeof walker.colorIndex).toBe('number');
    
    // Update existing walker
    const newPhone = '+18765432109';
    walker = await mockStorage.updateWalker(name, newPhone);
    expect(walker.name).toBe(name);
    expect(walker.phone).toBe(newPhone);
    expect(typeof walker.colorIndex).toBe('number');
  });
  
  test('getLeaderboardAllTime returns all-time leaderboard', async () => {
    // Add some test slots for different walkers
    await mockStorage.addSlot({
      date: '2025-04-20',
      time: '1000',
      name: 'Walker1'
    });
    
    await mockStorage.addSlot({
      date: '2025-04-20',
      time: '1100',
      name: 'Walker1'
    });
    
    await mockStorage.addSlot({
      date: '2025-04-20',
      time: '1200',
      name: 'Walker2'
    });
    
    // Get leaderboard
    const leaderboard = await mockStorage.getLeaderboardAllTime();
    
    // Check structure and values
    expect(Array.isArray(leaderboard)).toBe(true);
    expect(leaderboard.length).toBe(2);
    
    // Walker1 should be first with 2 walks
    expect(leaderboard[0].name).toBe('Walker1');
    expect(leaderboard[0].totalWalks).toBe(2);
    expect(leaderboard[0]).toHaveProperty('colorIndex');
    
    // Walker2 should be second with 1 walk
    expect(leaderboard[1].name).toBe('Walker2');
    expect(leaderboard[1].totalWalks).toBe(1);
    expect(leaderboard[1]).toHaveProperty('colorIndex');
  });
  
  test('getLeaderboardNextWeek returns next week leaderboard', async () => {
    // Add slots for current week
    await mockStorage.addSlot({
      date: '2025-04-20',
      time: '1000',
      name: 'Walker1'
    });
    
    // Add slots for next week
    await mockStorage.addSlot({
      date: '2025-04-27',
      time: '1000',
      name: 'Walker1'
    });
    
    await mockStorage.addSlot({
      date: '2025-04-28',
      time: '1000',
      name: 'Walker2'
    });
    
    // Get leaderboard for the week starting 2025-04-27
    const leaderboard = await mockStorage.getLeaderboardNextWeek('2025-04-27');
    
    // Check structure and values
    expect(Array.isArray(leaderboard)).toBe(true);
    expect(leaderboard.length).toBe(2);
    
    // Only walks from 2025-04-27 onwards should be counted
    expect(leaderboard.some(e => e.name === 'Walker1' && e.totalWalks === 1)).toBe(true);
    expect(leaderboard.some(e => e.name === 'Walker2' && e.totalWalks === 1)).toBe(true);
  });
});