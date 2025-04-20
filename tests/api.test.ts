import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import express from 'express';
import { type Server } from 'http';
import request from 'supertest';
import { registerRoutes } from '../server/routes';
import { storage } from '../server/storage';
import { insertSlotSchema, deleteSlotSchema } from '../shared/schema';

// Mock Twilio service to avoid sending real SMS in tests
vi.mock('../server/twilio', () => ({
  sendSmsNotification: vi.fn().mockResolvedValue(true)
}));

describe('API Endpoint Tests', () => {
  let app: express.Express;
  let server: Server;
  
  // Set up test server before all tests
  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });
  
  // Close server after all tests
  afterAll(() => {
    server.close();
  });
  
  test('GET /api/schedule returns schedule for a date range', async () => {
    const response = await request(app)
      .get('/api/schedule')
      .query({ start: '2025-04-20' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('2025-04-20');
    expect(Array.isArray(response.body['2025-04-20'])).toBe(true);
  });
  
  test('GET /api/schedule returns 400 for invalid date format', async () => {
    const response = await request(app)
      .get('/api/schedule')
      .query({ start: 'invalid-date' });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Invalid date format');
  });
  
  test('POST /api/slot adds a new walking slot', async () => {
    const slotData = {
      date: '2025-04-22',
      time: '1400',
      name: 'API Test User',
      phone: '+1234567890',
      notes: 'API test note'
    };
    
    // Validate with schema
    expect(insertSlotSchema.safeParse(slotData).success).toBe(true);
    
    const response = await request(app)
      .post('/api/slot')
      .send(slotData);
    
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      date: slotData.date,
      time: slotData.time,
      name: slotData.name,
      phone: slotData.phone,
      notes: slotData.notes
    });
    expect(response.body).toHaveProperty('timestamp');
  });
  
  test('POST /api/slot returns 400 for invalid data', async () => {
    const invalidData = {
      date: '2025-04-22',
      // Missing required time field
      name: 'API Test User'
    };
    
    const response = await request(app)
      .post('/api/slot')
      .send(invalidData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  test('DELETE /api/slot removes a walking slot', async () => {
    // First add a slot
    const slotData = {
      date: '2025-04-23',
      time: '1600',
      name: 'Delete Test User',
      notes: 'Delete test'
    };
    
    await request(app)
      .post('/api/slot')
      .send(slotData);
    
    // Then delete it
    const deleteData = {
      date: '2025-04-23',
      time: '1600',
      name: 'Delete Test User'  // This is needed for notifications
    };
    
    // Validate with schema
    expect(deleteSlotSchema.safeParse(deleteData).success).toBe(true);
    
    const response = await request(app)
      .delete('/api/slot')
      .send(deleteData);
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    
    // Verify slot is deleted
    const getResponse = await request(app)
      .get('/api/schedule')
      .query({ start: '2025-04-23' });
    
    const deletedSlot = getResponse.body['2025-04-23'].find(
      (slot: any) => slot.time === '1600'
    );
    expect(deletedSlot).toBeUndefined();
  });
  
  test('DELETE /api/slot returns 404 for non-existent slot', async () => {
    const deleteData = {
      date: '2025-04-24',
      time: '0900',
      name: 'Non-existent User'
    };
    
    const response = await request(app)
      .delete('/api/slot')
      .send(deleteData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('not found');
  });
  
  test('GET /api/walker-color/:name returns a color index', async () => {
    const response = await request(app)
      .get('/api/walker-color/TestUser');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('colorIndex');
    expect(typeof response.body.colorIndex).toBe('number');
    expect(response.body.colorIndex).toBeGreaterThanOrEqual(0);
    expect(response.body.colorIndex).toBeLessThan(10); // MAX_COLORS is 10
  });
  
  test('GET /api/walkers/search returns filtered walkers', async () => {
    // Add some walkers first by booking slots
    await request(app)
      .post('/api/slot')
      .send({
        date: '2025-04-25',
        time: '1000',
        name: 'SearchTest1',
        notes: 'Search test'
      });
    
    await request(app)
      .post('/api/slot')
      .send({
        date: '2025-04-25',
        time: '1100',
        name: 'SearchTest2',
        notes: 'Search test'
      });
    
    const response = await request(app)
      .get('/api/walkers/search')
      .query({ q: 'SearchTest' });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('colorIndex');
  });
  
  test('GET /api/leaderboard/all-time returns leaderboard data', async () => {
    const response = await request(app)
      .get('/api/leaderboard/all-time');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('totalWalks');
    expect(response.body[0]).toHaveProperty('colorIndex');
  });
  
  test('GET /api/leaderboard/next-week returns leaderboard data for specific week', async () => {
    const response = await request(app)
      .get('/api/leaderboard/next-week')
      .query({ start: '2025-04-20' });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('totalWalks');
      expect(response.body[0]).toHaveProperty('colorIndex');
    }
  });
  
  test('POST /api/walkers/update creates or updates a walker', async () => {
    const response = await request(app)
      .post('/api/walkers/update')
      .send({
        name: 'UpdateTest',
        phone: '+1987654321'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name', 'UpdateTest');
    expect(response.body).toHaveProperty('colorIndex');
    expect(response.body).toHaveProperty('phone', '+1987654321');
  });
  
  test('POST /api/walkers/update returns 400 for missing name', async () => {
    const response = await request(app)
      .post('/api/walkers/update')
      .send({
        phone: '+1987654321'
      });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('required');
  });
});