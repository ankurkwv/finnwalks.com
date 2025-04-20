import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { type Server } from 'http';
import request from 'supertest';
import { registerRoutes } from '../server/routes';

// Mock Twilio service to avoid sending real SMS in tests
vi.mock('../server/twilio', () => ({
  sendSmsNotification: vi.fn().mockResolvedValue(true)
}));

describe('API Endpoints Tests', () => {
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
  
  test('GET /api/schedule returns weekly schedule', async () => {
    const response = await request(app)
      .get('/api/schedule')
      .query({ start: '2025-04-20' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('2025-04-20');
    expect(Array.isArray(response.body['2025-04-20'])).toBe(true);
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
    
    console.log('Response status:', response.status);
    console.log('Response body:', response.body);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('date', '2025-04-21');
    expect(response.body).toHaveProperty('time', '1400');
    expect(response.body).toHaveProperty('name', 'TestUser');
    expect(response.body).toHaveProperty('phone', '+19876543210');
    expect(response.body).toHaveProperty('notes', 'Test notes');
  });
  
  test('DELETE /api/slot removes a walking slot', async () => {
    // First create a slot
    const newSlot = {
      date: '2025-04-22',
      time: '1500',
      name: 'DeleteTest',
      notes: 'Test delete'
    };
    
    await request(app)
      .post('/api/slot')
      .send(newSlot);
    
    // Then delete it
    const deleteResponse = await request(app)
      .delete('/api/slot')
      .send({
        date: '2025-04-22',
        time: '1500',
        name: 'DeleteTest'
      });
    
    expect(deleteResponse.status).toBe(200);
    
    // Verify it's gone
    const response = await request(app)
      .get('/api/schedule')
      .query({ start: '2025-04-22' });
    
    const slots = response.body['2025-04-22'];
    expect(slots.some((slot: any) => 
      slot.date === '2025-04-22' && 
      slot.time === '1500' && 
      slot.name === 'DeleteTest'
    )).toBe(false);
  });
  
  test('GET /api/walker-color/:name returns color index', async () => {
    const response = await request(app)
      .get('/api/walker-color/TestUser');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('colorIndex');
    expect(typeof response.body.colorIndex).toBe('number');
  });
  
  test('GET /api/walkers/search searches walkers by name', async () => {
    // First create a walker by booking a slot
    const newSlot = {
      date: '2025-04-23',
      time: '1600',
      name: 'SearchTest',
      notes: 'Test search'
    };
    
    await request(app)
      .post('/api/slot')
      .send(newSlot);
    
    // Then search for it
    const response = await request(app)
      .get('/api/walkers/search')
      .query({ q: 'Search' });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // Should find our walker
    const foundWalker = response.body.find((walker: any) => walker.name === 'SearchTest');
    expect(foundWalker).toBeDefined();
    expect(foundWalker).toHaveProperty('colorIndex');
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
  });
});