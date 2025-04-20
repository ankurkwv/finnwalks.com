import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import { Server } from 'http';
import request from 'supertest';
import { registerRoutes } from '../server/routes';
import { mockStorage, resetMockStorage } from './mocks/storage.mock';

// Mock the storage module to use our mock implementation
vi.mock('../server/storage', () => ({
  storage: mockStorage
}));

// Mock Twilio to prevent real SMS sending during tests
vi.mock('../server/twilio', () => ({
  sendSmsNotification: vi.fn().mockResolvedValue(true)
}));

describe('Performance Tests', () => {
  let app: express.Express;
  let server: Server;
  
  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
    resetMockStorage();
    
    // Set up some test data
    for (let i = 0; i < 10; i++) {
      await mockStorage.addSlot({
        date: '2025-04-20',
        time: `${i + 10}00`,
        name: `Walker${i}`,
        phone: '+19876543210',
        notes: `Test booking ${i}`
      });
    }
  });
  
  afterAll(() => {
    server.close();
  });
  
  test('can handle multiple simultaneous GET requests', async () => {
    const NUM_REQUESTS = 50;
    const start = performance.now();
    
    const requests = Array(NUM_REQUESTS).fill(null).map(() => 
      request(app).get('/api/schedule').query({ start: '2025-04-20' })
    );
    
    const responses = await Promise.all(requests);
    const end = performance.now();
    
    // All requests should succeed
    for (const response of responses) {
      expect(response.status).toBe(200);
    }
    
    // Check performance metrics
    const totalTime = end - start;
    const avgTime = totalTime / NUM_REQUESTS;
    
    console.log(`Completed ${NUM_REQUESTS} GET requests in ${totalTime.toFixed(2)}ms`);
    console.log(`Average response time: ${avgTime.toFixed(2)}ms per request`);
    
    // Reasonable performance expectation (adjust as needed)
    expect(avgTime).toBeLessThan(100); // Average less than 100ms per request
  });
  
  test('can handle multiple simultaneous POST requests', async () => {
    const NUM_REQUESTS = 20;
    const start = performance.now();
    
    const baseDate = new Date('2025-04-22');
    
    const requests = Array(NUM_REQUESTS).fill(null).map((_, i) => {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + Math.floor(i / 8)); // Spread over multiple days
      
      return request(app)
        .post('/api/slot')
        .send({
          date: date.toISOString().split('T')[0],
          time: `${(i % 8) + 10}00`, // 10:00, 11:00, etc.
          name: `PerfTest${i}`,
          phone: '+19876543210',
          notes: `Performance test ${i}`
        });
    });
    
    const responses = await Promise.all(requests);
    const end = performance.now();
    
    // All requests should succeed or fail with 409 (conflict)
    for (const response of responses) {
      expect([201, 409]).toContain(response.status);
    }
    
    // Check performance metrics
    const totalTime = end - start;
    const avgTime = totalTime / NUM_REQUESTS;
    
    console.log(`Completed ${NUM_REQUESTS} POST requests in ${totalTime.toFixed(2)}ms`);
    console.log(`Average response time: ${avgTime.toFixed(2)}ms per request`);
    
    // Reasonable performance expectation (adjust as needed)
    expect(avgTime).toBeLessThan(200); // Average less than 200ms per request for writes
  });
  
  test('handles high concurrency when fetching leaderboard', async () => {
    const NUM_REQUESTS = 30;
    const start = performance.now();
    
    // Mix of all-time and next-week leaderboard requests
    const requests = Array(NUM_REQUESTS).fill(null).map((_, i) => 
      i % 2 === 0
        ? request(app).get('/api/leaderboard/all-time')
        : request(app).get('/api/leaderboard/next-week').query({ start: '2025-04-20' })
    );
    
    const responses = await Promise.all(requests);
    const end = performance.now();
    
    // All requests should succeed
    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    }
    
    // Check performance metrics
    const totalTime = end - start;
    const avgTime = totalTime / NUM_REQUESTS;
    
    console.log(`Completed ${NUM_REQUESTS} leaderboard requests in ${totalTime.toFixed(2)}ms`);
    console.log(`Average response time: ${avgTime.toFixed(2)}ms per request`);
    
    // Reasonable performance expectation (adjust as needed)
    expect(avgTime).toBeLessThan(150); // Average less than 150ms per request
  });
});