import { describe, test, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { mockStorage, resetMockStorage } from './mocks/storage.mock';

// Mock the storage import in the routes module
vi.mock('../server/storage', () => ({
  storage: mockStorage
}));

// Mock Twilio service to avoid sending real SMS in tests
vi.mock('../server/twilio', () => ({
  sendSmsNotification: vi.fn().mockResolvedValue(true)
}));

// Load the routes module AFTER mocking dependencies
import { registerRoutes } from '../server/routes';

describe('API Routes Tests', () => {
  let app: express.Express;
  
  // Set up fresh test server and reset storage before each test
  beforeEach(async () => {
    resetMockStorage();
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });
  
  test('GET /api/schedule returns weekly schedule', async () => {
    const response = await request(app)
      .get('/api/schedule')
      .query({ start: '2025-04-20' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('2025-04-20');
    expect(Array.isArray(response.body['2025-04-20'])).toBe(true);
    
    // Verify the mock was called
    expect(mockStorage.getSchedule).toHaveBeenCalledWith('2025-04-20');
  });
  
  test('POST /api/slot creates a new walking slot', async () => {
    const newSlot = {
      date: '2025-04-21',
      time: '1400',
      name: 'TestUser',
      phone: '+19876543210',
      notes: 'Test notes'
    };
    
    const response = await request(app)
      .post('/api/slot')
      .send(newSlot);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('date', '2025-04-21');
    expect(response.body).toHaveProperty('time', '1400');
    expect(response.body).toHaveProperty('name', 'TestUser');
    expect(response.body).toHaveProperty('phone', '+19876543210');
    expect(response.body).toHaveProperty('notes', 'Test notes');
    
    // Verify mock was called with correct data
    expect(mockStorage.addSlot).toHaveBeenCalledWith(expect.objectContaining(newSlot));
  });
  
  test('DELETE /api/slot removes a walking slot', async () => {
    // First create a slot
    await mockStorage.addSlot({
      date: '2025-04-22',
      time: '1500',
      name: 'DeleteTest',
      notes: 'Test delete'
    });
    
    // Then delete it
    const deleteResponse = await request(app)
      .delete('/api/slot')
      .send({
        date: '2025-04-22',
        time: '1500',
        name: 'DeleteTest'
      });
    
    expect(deleteResponse.status).toBe(200);
    
    // Verify mock was called correctly
    expect(mockStorage.removeSlot).toHaveBeenCalledWith('2025-04-22', '1500');
  });
  
  test('GET /api/walker-color/:name returns color index', async () => {
    const response = await request(app)
      .get('/api/walker-color/TestUser');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('colorIndex');
    expect(typeof response.body.colorIndex).toBe('number');
    
    // Verify mock was called
    expect(mockStorage.getWalkerColorIndex).toHaveBeenCalledWith('TestUser');
  });
  
  test('GET /api/walkers/search searches walkers by name', async () => {
    // Create test walker
    await mockStorage.updateWalker('SearchTestUser', '+1234567890');
    
    // Search for it
    const response = await request(app)
      .get('/api/walkers/search')
      .query({ q: 'Search' });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // Verify mock was called
    expect(mockStorage.searchWalkers).toHaveBeenCalledWith('Search');
  });
  
  test('POST /api/walkers/update updates walker info', async () => {
    const walkerInfo = {
      name: 'UpdateTest',
      phone: '+1234567890'
    };
    
    const response = await request(app)
      .post('/api/walkers/update')
      .send(walkerInfo);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name', 'UpdateTest');
    expect(response.body).toHaveProperty('phone', '+1234567890');
    
    // Verify mock was called with correct parameters
    expect(mockStorage.updateWalker).toHaveBeenCalledWith('UpdateTest', '+1234567890');
  });
  
  test('GET /api/leaderboard/all-time returns all-time leaderboard', async () => {
    const response = await request(app)
      .get('/api/leaderboard/all-time');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    if (response.body.length > 0) {
      const entry = response.body[0];
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('totalWalks');
      expect(entry).toHaveProperty('colorIndex');
    }
    
    // Verify mock was called
    expect(mockStorage.getLeaderboardAllTime).toHaveBeenCalled();
  });
  
  test('GET /api/leaderboard/next-week returns next week leaderboard', async () => {
    const response = await request(app)
      .get('/api/leaderboard/next-week')
      .query({ start: '2025-04-20' });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    if (response.body.length > 0) {
      const entry = response.body[0];
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('totalWalks');
      expect(entry).toHaveProperty('colorIndex');
    }
    
    // Verify mock was called
    expect(mockStorage.getLeaderboardNextWeek).toHaveBeenCalled();
  });
  
  test('handles validation errors correctly', async () => {
    // Missing required fields
    const invalidSlot = {
      date: '2025-04-21',
      // missing time
      name: 'TestUser'
    };
    
    const response = await request(app)
      .post('/api/slot')
      .send(invalidSlot);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  test('handles not found errors correctly', async () => {
    // Try to delete a non-existent slot
    const response = await request(app)
      .delete('/api/slot')
      .send({
        date: '2025-04-99', // Invalid date
        time: '9999',       // Invalid time
        name: 'Nobody'
      });
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});