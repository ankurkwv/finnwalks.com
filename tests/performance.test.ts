import { describe, test, expect } from 'vitest';
import express from 'express';
import { type Server } from 'http';
import request from 'supertest';
import { registerRoutes } from '../server/routes';

// Mock Twilio service to avoid sending real SMS in tests
vi.mock('../server/twilio', () => ({
  sendSmsNotification: vi.fn().mockResolvedValue(true)
}));

describe('Performance Tests', () => {
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
  
  test('handles concurrent schedule requests (10 concurrent requests)', async () => {
    const concurrentRequests = 10;
    const startTime = Date.now();
    
    // Create an array of concurrent requests
    const requests = Array(concurrentRequests).fill(0).map(() => 
      request(app).get('/api/schedule').query({ start: '2025-04-20' })
    );
    
    // Execute all requests concurrently
    const results = await Promise.all(requests);
    
    // All requests should succeed
    for (const response of results) {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('2025-04-20');
    }
    
    // Total time should be reasonable
    const totalTime = Date.now() - startTime;
    console.log(`10 concurrent requests took ${totalTime}ms`);
  });
  
  test('handles rapid booking and cancellation', async () => {
    // Book 5 slots in rapid succession
    const bookRequests = Array(5).fill(0).map((_, index) => {
      return request(app)
        .post('/api/slot')
        .send({
          date: '2025-04-30',
          time: `${10 + index}00`,  // 1000, 1100, 1200, 1300, 1400
          name: `PerformanceTest${index}`,
          notes: 'Performance test'
        });
    });
    
    const bookResults = await Promise.all(bookRequests);
    
    // All should succeed
    for (const response of bookResults) {
      expect(response.status).toBe(201);
    }
    
    // Get the schedule to verify all slots were booked
    const scheduleResponse = await request(app)
      .get('/api/schedule')
      .query({ start: '2025-04-30' });
    
    expect(scheduleResponse.status).toBe(200);
    expect(scheduleResponse.body['2025-04-30'].length).toBeGreaterThanOrEqual(5);
    
    // Now cancel all slots
    const cancelRequests = Array(5).fill(0).map((_, index) => {
      return request(app)
        .delete('/api/slot')
        .send({
          date: '2025-04-30',
          time: `${10 + index}00`,
          name: `PerformanceTest${index}`
        });
    });
    
    const cancelResults = await Promise.all(cancelRequests);
    
    // All cancellations should succeed
    for (const response of cancelResults) {
      expect(response.status).toBe(200);
    }
  });
  
  test('handles load on walker search and color endpoints', async () => {
    // First add some walkers by booking slots
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/slot')
        .send({
          date: '2025-05-01',
          time: `${10 + i}00`,
          name: `LoadTestWalker${i}`,
          notes: 'Load test'
        });
    }
    
    // Now search for these walkers with concurrent requests
    const startTime = Date.now();
    
    const searchRequests = Array(20).fill(0).map((_, index) => 
      request(app)
        .get('/api/walkers/search')
        .query({ q: 'LoadTestWalker' + (index % 10) })
    );
    
    const colorRequests = Array(20).fill(0).map((_, index) => 
      request(app)
        .get(`/api/walker-color/LoadTestWalker${index % 10}`)
    );
    
    // Execute all requests concurrently
    const results = await Promise.all([...searchRequests, ...colorRequests]);
    
    // All requests should succeed
    for (const response of results) {
      expect(response.status).toBe(200);
    }
    
    // Total time should be reasonable
    const totalTime = Date.now() - startTime;
    console.log(`40 concurrent walker requests took ${totalTime}ms`);
  });
});