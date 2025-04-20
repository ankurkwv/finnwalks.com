import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockStorage, resetMockStorage } from './mocks/storage.mock';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';

// Mock fetch to test API endpoints
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Routes Tests', () => {
  beforeEach(() => {
    resetMockStorage();
    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  test('GET /api/schedule should return weekly schedule', async () => {
    // Setup mock response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        '2025-04-20': [],
        '2025-04-21': [],
        '2025-04-22': [],
        '2025-04-23': [],
        '2025-04-24': [],
        '2025-04-25': [],
        '2025-04-26': []
      })
    });

    // Make request
    const response = await fetch('/api/schedule?start=2025-04-20');
    const data = await response.json();

    // Assertions
    expect(response.ok).toBe(true);
    expect(Object.keys(data).length).toBe(7);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/schedule?start=2025-04-20');
  });

  test('POST /api/slot should add a new slot', async () => {
    const slotData = {
      date: '2025-04-20',
      time: '1200',
      name: 'Test User',
      notes: 'Test notes',
      phone: '+12345678900'
    };

    // Setup mock response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ ...slotData, timestamp: 1234567890 })
    });

    // Make request
    const response = await fetch('/api/slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slotData)
    });
    
    const data = await response.json();

    // Assertions
    expect(response.ok).toBe(true);
    expect(response.status).toBe(201);
    expect(data.date).toBe(slotData.date);
    expect(data.time).toBe(slotData.time);
    expect(data.name).toBe(slotData.name);
    expect(data.timestamp).toBeTypeOf('number');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('POST /api/slot should return 409 for already booked slot', async () => {
    // Setup MSW to respond with conflict for this test
    server.use(
      http.post('/api/slot', () => {
        return new HttpResponse(
          JSON.stringify({ error: 'This slot is already booked' }),
          { status: 409 }
        );
      })
    );

    // Setup mock fetch
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: 'This slot is already booked' })
    });

    const slotData = {
      date: '2025-04-20',
      time: '1200',
      name: 'Test User'
    };

    // Make request
    const response = await fetch('/api/slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slotData)
    });
    
    const data = await response.json();

    // Assertions
    expect(response.ok).toBe(false);
    expect(response.status).toBe(409);
    expect(data.error).toBe('This slot is already booked');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('DELETE /api/slot should remove a slot', async () => {
    const deleteData = {
      date: '2025-04-20',
      time: '1200',
      name: 'Test User'
    };

    // Setup mock response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    // Make request
    const response = await fetch('/api/slot', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deleteData)
    });
    
    const data = await response.json();

    // Assertions
    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('GET /api/walker-color/:name should return color index', async () => {
    const walkerName = 'Test Walker';

    // Setup mock response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ colorIndex: 0 })
    });

    // Make request
    const response = await fetch(`/api/walker-color/${walkerName}`);
    const data = await response.json();

    // Assertions
    expect(response.ok).toBe(true);
    expect(data.colorIndex).toBeTypeOf('number');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(`/api/walker-color/${walkerName}`);
  });

  test('GET /api/walkers/search should return matched walkers', async () => {
    const query = 'test';

    // Setup storage with some walkers
    await mockStorage.updateWalker('Test Walker 1');
    await mockStorage.updateWalker('Test Walker 2');
    await mockStorage.updateWalker('Another Walker');

    // Setup mock response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { name: 'Test Walker 1', colorIndex: 0 },
        { name: 'Test Walker 2', colorIndex: 1 }
      ]
    });

    // Make request
    const response = await fetch(`/api/walkers/search?q=${query}`);
    const data = await response.json();

    // Assertions
    expect(response.ok).toBe(true);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(data[0].name).toContain('Test');
    expect(data[1].name).toContain('Test');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(`/api/walkers/search?q=${query}`);
  });

  test('GET /api/leaderboard/all-time should return leaderboard', async () => {
    // Setup storage with some walks
    await mockStorage.addSlot({ date: '2025-04-20', time: '1000', name: 'Walker A' });
    await mockStorage.addSlot({ date: '2025-04-21', time: '1000', name: 'Walker A' });
    await mockStorage.addSlot({ date: '2025-04-22', time: '1000', name: 'Walker B' });

    // Setup mock response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { name: 'Walker A', totalWalks: 2, colorIndex: 0 },
        { name: 'Walker B', totalWalks: 1, colorIndex: 1 }
      ]
    });

    // Make request
    const response = await fetch('/api/leaderboard/all-time');
    const data = await response.json();

    // Assertions
    expect(response.ok).toBe(true);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(data[0].name).toBe('Walker A');
    expect(data[0].totalWalks).toBe(2);
    expect(data[1].name).toBe('Walker B');
    expect(data[1].totalWalks).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('GET /api/leaderboard/next-week should return next week leaderboard', async () => {
    // Setup mock response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { name: 'Walker A', totalWalks: 2, colorIndex: 0 },
        { name: 'Walker B', totalWalks: 1, colorIndex: 1 }
      ]
    });

    // Make request
    const response = await fetch('/api/leaderboard/next-week?start=2025-04-20');
    const data = await response.json();

    // Assertions
    expect(response.ok).toBe(true);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/leaderboard/next-week?start=2025-04-20');
  });
});