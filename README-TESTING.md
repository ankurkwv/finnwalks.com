# FinnWalks Testing Guide

This document provides information about the test suite for the FinnWalks application, including how to run tests and an explanation of the testing approach.

## Test Structure

The test suite is organized by test type:

1. **Unit Tests**
   - Test isolated components or functions
   - Located in `tests/*.test.tsx` files
   - Focus on individual UI components and utility functions

2. **Integration Tests**
   - Test interactions between components and modules
   - Located in `tests/api-routes.test.ts`
   - Focus on API endpoints and database operations

3. **End-to-End Tests**
   - Test complete user journeys
   - Located in `tests/e2e.test.tsx`
   - Simulate user interactions with the application

4. **Performance Tests**
   - Test application performance under load
   - Located in `tests/performance.test.ts`
   - Measure response times and throughput

## Running Tests

To run all tests:

```bash
npm test
```

To run a specific test file:

```bash
npx vitest run tests/storage.test.ts
```

To run tests in watch mode (for development):

```bash
npx vitest tests/storage.test.ts
```

## Testing Technologies

- **Vitest**: Test runner and framework
- **Happy DOM**: Browser environment emulation
- **MSW (Mock Service Worker)**: API mocking
- **Testing Library**: DOM testing utilities
- **TanStack Query**: Data fetching testing

## Mocking Strategy

The application uses a comprehensive mocking strategy:

1. **API Mocks**: MSW intercepts HTTP requests and returns mock responses
2. **Storage Mocks**: In-memory implementation of the storage interface
3. **DB Mocks**: Mock database connection and query methods

## Test Coverage

The test suite covers:

- **UI Components**: Rendering and interaction
- **API Endpoints**: Request/response handling
- **Data Fetching**: TanStack Query integration
- **Form Handling**: Input validation and submission
- **State Management**: Local state and context
- **Performance**: Load testing and response times

## Adding New Tests

When adding new tests, follow these guidelines:

1. **Choose the right test type**: Unit, integration, or E2E
2. **Use the existing mocks**: Extend them if needed
3. **Follow the naming convention**: `*.test.tsx` or `*.test.ts`
4. **Maintain isolation**: Tests should not depend on each other
5. **Clean up resources**: Reset mocks and clear state between tests

## Example Tests

### Component Test Example

```typescript
test('renders dog walking slot correctly', () => {
  const slot = {
    date: '2025-04-20',
    time: '1400',
    name: 'John Doe',
    notes: 'Bring treats'
  };
  
  render(<WalkingSlot slot={slot} />);
  
  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('2:00 PM')).toBeInTheDocument();
  expect(screen.getByText('Bring treats')).toBeInTheDocument();
});
```

### API Test Example

```typescript
test('GET /api/schedule returns weekly schedule', async () => {
  const response = await request(app)
    .get('/api/schedule')
    .query({ start: '2025-04-20' });
  
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('2025-04-20');
  expect(Array.isArray(response.body['2025-04-20'])).toBe(true);
});
```

### Performance Test Example

```typescript
test('can handle 50 simultaneous schedule requests', async () => {
  const NUM_REQUESTS = 50;
  const requests = Array(NUM_REQUESTS).fill(null).map(() => 
    request(app).get('/api/schedule').query({ start: '2025-04-20' })
  );
  
  const responses = await Promise.all(requests);
  
  for (const response of responses) {
    expect(response.status).toBe(200);
  }
});
```