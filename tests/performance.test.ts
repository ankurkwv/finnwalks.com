import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { Server } from 'http';
import request from 'supertest';
import { registerRoutes } from '../server/routes';
import { mockStorage, resetMockStorage } from './mocks/storage.mock';

// Mock dependencies
vi.mock('../server/storage', () => ({
  storage: mockStorage
}));

vi.mock('../server/twilio', () => ({
  sendSmsNotification: vi.fn().mockResolvedValue(true)
}));

describe('API Performance Tests', () => {
  let app: express.Express;
  let server: Server;
  
  // Set up test server before all tests
  beforeAll(async () => {
    resetMockStorage();
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });
  
  // Close server after all tests
  afterAll(() => {
    server.close();
  });
  
  test('can handle 50 simultaneous schedule requests', async () => {
    const NUM_REQUESTS = 50;
    const startTime = Date.now();
    
    // Create array of promises for concurrent requests
    const requests = Array(NUM_REQUESTS).fill(null).map(() => 
      request(app)
        .get('/api/schedule')
        .query({ start: '2025-04-20' })
    );
    
    // Execute all requests concurrently
    const responses = await Promise.all(requests);
    
    // Verify all responses are successful
    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('2025-04-20');
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`Processed ${NUM_REQUESTS} concurrent requests in ${totalTime}ms`);
    console.log(`Average response time: ${totalTime / NUM_REQUESTS}ms`);
    
    // Basic expectation for reasonability
    expect(totalTime).toBeLessThan(5000); // Should handle 50 requests in under 5 seconds
  });
  
  test('can handle rapid slot bookings and cancellations', async () => {
    const NUM_OPERATIONS = 20;
    const startTime = Date.now();
    
    // Book slots
    for (let i = 0; i < NUM_OPERATIONS; i++) {
      const hour = String(10 + Math.floor(i / 2)).padStart(2, '0');
      const minutes = (i % 2) * 30;
      const minutesStr = String(minutes).padStart(2, '0');
      
      const newSlot = {
        date: '2025-04-21',
        time: `${hour}${minutesStr}`,
        name: `PerformanceUser${i}`,
        phone: '+10000000000',
        notes: 'Performance test'
      };
      
      const response = await request(app)
        .post('/api/slot')
        .send(newSlot);
      
      expect(response.status).toBe(201);
    }
    
    // Get the schedule to verify bookings
    const scheduleResponse = await request(app)
      .get('/api/schedule')
      .query({ start: '2025-04-21' });
    
    expect(scheduleResponse.status).toBe(200);
    expect(scheduleResponse.body['2025-04-21'].length).toBe(NUM_OPERATIONS);
    
    // Cancel half of the bookings
    for (let i = 0; i < NUM_OPERATIONS / 2; i++) {
      const hour = String(10 + Math.floor(i / 2)).padStart(2, '0');
      const minutes = (i % 2) * 30;
      const minutesStr = String(minutes).padStart(2, '0');
      
      const deleteResponse = await request(app)
        .delete('/api/slot')
        .send({
          date: '2025-04-21',
          time: `${hour}${minutesStr}`,
          name: `PerformanceUser${i}`
        });
      
      expect(deleteResponse.status).toBe(200);
    }
    
    // Get the schedule after cancellations
    const finalScheduleResponse = await request(app)
      .get('/api/schedule')
      .query({ start: '2025-04-21' });
    
    expect(finalScheduleResponse.status).toBe(200);
    expect(finalScheduleResponse.body['2025-04-21'].length).toBe(NUM_OPERATIONS / 2);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`Processed ${NUM_OPERATIONS * 1.5} operations in ${totalTime}ms`);
    console.log(`Average operation time: ${totalTime / (NUM_OPERATIONS * 1.5)}ms`);
    
    // Basic expectation for reasonability
    expect(totalTime).toBeLessThan(10000); // Should handle operations in under 10 seconds
  });
  
  test('can handle concurrent walker searches', async () => {
    const NUM_SEARCHES = 30;
    const startTime = Date.now();
    
    // Create walkers for searching
    for (let i = 0; i < 5; i++) {
      await mockStorage.updateWalker(`PerformanceWalker${i}`, `+1000000000${i}`);
    }
    
    // Create array of promises for concurrent searches
    const searches = Array(NUM_SEARCHES).fill(null).map((_, i) => 
      request(app)
        .get('/api/walkers/search')
        .query({ q: 'Performance' })
    );
    
    // Execute all searches concurrently
    const responses = await Promise.all(searches);
    
    // Verify all responses are successful
    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(5); // At least the 5 we created
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`Processed ${NUM_SEARCHES} concurrent searches in ${totalTime}ms`);
    console.log(`Average search time: ${totalTime / NUM_SEARCHES}ms`);
    
    // Basic expectation for reasonability
    expect(totalTime).toBeLessThan(5000); // Should handle searches in under 5 seconds
  });
});