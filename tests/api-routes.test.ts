import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import { Server } from 'http';
import request from 'supertest';
import { registerRoutes } from '../server/routes';
import { mockStorage, resetMockStorage } from './mocks/storage.mock';
import { WalkingSlot } from '../shared/schema';

// Mock the storage module to use our mock implementation
vi.mock('../server/storage', () => ({
  storage: mockStorage
}));

// Mock Twilio to prevent real SMS sending during tests
vi.mock('../server/twilio', () => ({
  sendSmsNotification: vi.fn().mockResolvedValue(true)
}));

describe('API Routes Tests', () => {
  let app: express.Express;
  let server: Server;
  
  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });
  
  beforeEach(() => {
    resetMockStorage();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  afterAll(() => {
    server.close();
  });
  
  describe('GET /api/schedule', () => {
    test('returns weekly schedule with default date', async () => {
      const response = await request(app).get('/api/schedule');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('2025-04-20');
      expect(Array.isArray(response.body['2025-04-20'])).toBe(true);
    });
    
    test('returns weekly schedule with specified date', async () => {
      const response = await request(app)
        .get('/api/schedule')
        .query({ start: '2025-04-21' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('2025-04-21');
      expect(Array.isArray(response.body['2025-04-21'])).toBe(true);
    });
  });
  
  describe('POST /api/slot', () => {
    test('creates a new walking slot successfully', async () => {
      const newSlot = {
        date: '2025-04-21',
        time: '1400',
        name: 'TestUser',
        phone: '+19876543210',
        notes: 'Test booking'
      };
      
      const response = await request(app)
        .post('/api/slot')
        .send(newSlot);
      
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        date: newSlot.date,
        time: newSlot.time,
        name: newSlot.name,
        phone: newSlot.phone,
        notes: newSlot.notes
      });
      expect(response.body).toHaveProperty('timestamp');
    });
    
    test('returns 400 for missing required fields', async () => {
      const incompleteSlot = {
        date: '2025-04-21',
        // Missing time field
        name: 'TestUser'
      };
      
      const response = await request(app)
        .post('/api/slot')
        .send(incompleteSlot);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    test('returns 409 when slot is already booked', async () => {
      // First booking
      const slot = {
        date: '2025-04-21',
        time: '1500',
        name: 'TestUser1',
        phone: '+19876543210'
      };
      
      await request(app).post('/api/slot').send(slot);
      
      // Attempt to book the same slot
      const duplicateSlot = {
        date: '2025-04-21',
        time: '1500',
        name: 'TestUser2',
        phone: '+18765432109'
      };
      
      const response = await request(app)
        .post('/api/slot')
        .send(duplicateSlot);
      
      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('DELETE /api/slot', () => {
    test('deletes an existing slot successfully', async () => {
      // Create a slot to delete
      const slot: Partial<WalkingSlot> = {
        date: '2025-04-21',
        time: '1600',
        name: 'DeleteTest',
        phone: '+19876543210'
      };
      
      await mockStorage.addSlot(slot);
      
      // Delete the slot
      const response = await request(app)
        .delete('/api/slot')
        .send({
          date: slot.date,
          time: slot.time,
          name: slot.name
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      
      // Verify it's gone
      const getResponse = await request(app)
        .get('/api/schedule')
        .query({ start: slot.date });
      
      const slots = getResponse.body[slot.date];
      expect(slots.find((s: WalkingSlot) => s.time === slot.time)).toBeUndefined();
    });
    
    test('returns 404 when slot does not exist', async () => {
      const response = await request(app)
        .delete('/api/slot')
        .send({
          date: '2025-04-21',
          time: '1700',
          name: 'NonExistentUser'
        });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
    
    test('returns 403 when user is not authorized to delete slot', async () => {
      // Create a slot
      const slot: Partial<WalkingSlot> = {
        date: '2025-04-21',
        time: '1800',
        name: 'OwnerUser',
        phone: '+19876543210'
      };
      
      await mockStorage.addSlot(slot);
      
      // Try to delete with different name
      const response = await request(app)
        .delete('/api/slot')
        .send({
          date: slot.date,
          time: slot.time,
          name: 'DifferentUser'
        });
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /api/walker-color/:name', () => {
    test('returns consistent color index for a walker', async () => {
      const name = 'TestWalker';
      
      const response = await request(app)
        .get(`/api/walker-color/${name}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('colorIndex');
      expect(typeof response.body.colorIndex).toBe('number');
      
      // Should return the same color index on second request
      const secondResponse = await request(app)
        .get(`/api/walker-color/${name}`);
      
      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body.colorIndex).toBe(response.body.colorIndex);
    });
  });
  
  describe('GET /api/walkers/search', () => {
    test('searches walkers by name', async () => {
      // Add some test walkers
      await mockStorage.updateWalker('SearchTest1');
      await mockStorage.updateWalker('SearchTest2');
      await mockStorage.updateWalker('DifferentName');
      
      const response = await request(app)
        .get('/api/walkers/search')
        .query({ q: 'Search' });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body.some((w: any) => w.name === 'SearchTest1')).toBe(true);
      expect(response.body.some((w: any) => w.name === 'SearchTest2')).toBe(true);
      expect(response.body.some((w: any) => w.name === 'DifferentName')).toBe(false);
    });
    
    test('returns empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/walkers/search')
        .query({ q: 'NonExistentName' });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });
  
  describe('POST /api/walkers/update', () => {
    test('creates or updates walker information', async () => {
      const walkerData = {
        name: 'UpdateTest',
        phone: '+19876543210'
      };
      
      const response = await request(app)
        .post('/api/walkers/update')
        .send(walkerData);
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: walkerData.name,
        phone: walkerData.phone
      });
      expect(response.body).toHaveProperty('colorIndex');
      
      // Update the phone number
      const updateResponse = await request(app)
        .post('/api/walkers/update')
        .send({
          name: walkerData.name,
          phone: '+18765432109'
        });
      
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body).toMatchObject({
        name: walkerData.name,
        phone: '+18765432109'
      });
      
      // Color index should remain the same
      expect(updateResponse.body.colorIndex).toBe(response.body.colorIndex);
    });
    
    test('returns 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/walkers/update')
        .send({
          phone: '+19876543210'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /api/leaderboard/all-time', () => {
    test('returns all-time leaderboard', async () => {
      const response = await request(app)
        .get('/api/leaderboard/all-time');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Check leaderboard structure
      if (response.body.length > 0) {
        const entry = response.body[0];
        expect(entry).toHaveProperty('name');
        expect(entry).toHaveProperty('totalWalks');
        expect(entry).toHaveProperty('colorIndex');
        expect(typeof entry.totalWalks).toBe('number');
      }
    });
  });
  
  describe('GET /api/leaderboard/next-week', () => {
    test('returns next week leaderboard with default date', async () => {
      const response = await request(app)
        .get('/api/leaderboard/next-week');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    test('returns next week leaderboard with specified date', async () => {
      const response = await request(app)
        .get('/api/leaderboard/next-week')
        .query({ start: '2025-04-21' });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});