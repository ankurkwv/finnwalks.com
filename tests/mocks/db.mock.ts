import { vi } from 'vitest';
import { walkingSlots, walkerColors } from '../../shared/schema';

// Mock the database connection
export const mockDb = {
  select: vi.fn().mockImplementation(() => ({
    from: vi.fn().mockImplementation(() => ({
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([])
    }))
  })),
  insert: vi.fn().mockImplementation(() => ({
    into: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation(() => ({
        returning: vi.fn().mockResolvedValue([
          { 
            date: '2025-04-21',
            time: '1400',
            name: 'TestUser',
            phone: '+19876543210',
            notes: 'Test notes',
            timestamp: Date.now()
          }
        ])
      }))
    }))
  })),
  delete: vi.fn().mockImplementation(() => ({
    from: vi.fn().mockImplementation(() => ({
      where: vi.fn().mockImplementation(() => ({
        execute: vi.fn().mockResolvedValue({ rowCount: 1 })
      }))
    }))
  })),
  transaction: vi.fn().mockImplementation((callback) => {
    return Promise.resolve(callback(mockDb));
  })
};

// Mock the Pool object
export const mockPool = {
  query: vi.fn().mockResolvedValue({ rows: [] }),
  connect: vi.fn().mockResolvedValue({
    query: vi.fn().mockResolvedValue({ rows: [] }),
    release: vi.fn()
  })
};

// Create specific mock returns for different queries
export function setupMockDbResponses() {
  // For get schedule
  mockDb.select.mockImplementation((cols) => ({
    from: (table) => {
      if (table === walkingSlots) {
        return {
          where: () => ({
            orderBy: () => ({
              execute: vi.fn().mockResolvedValue([
                { 
                  date: '2025-04-20',
                  time: '1200',
                  name: 'Arpoo',
                  notes: 'Regular walk',
                  timestamp: Date.now() - 100000
                }
              ])
            })
          })
        };
      }
      
      if (table === walkerColors) {
        return {
          where: () => ({
            execute: vi.fn().mockResolvedValue([
              { name: 'Arpoo', color_index: 0 },
              { name: 'Bruno', color_index: 1 }
            ])
          })
        };
      }
      
      return {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([])
      };
    }
  }));
}