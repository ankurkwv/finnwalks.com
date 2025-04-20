# FinnWalks Testing Documentation

This document outlines the testing approach for the FinnWalks application, which is a dog walking scheduling service.

## Testing Framework

The FinnWalks application uses the following testing stack:

- **Vitest**: The core testing framework, compatible with Jest APIs
- **Happy DOM**: Browser environment emulation for testing React components
- **Testing Library**: For testing React components in a user-centric way
- **MSW (Mock Service Worker)**: For mocking API requests during tests
- **Supertest**: For HTTP API endpoint testing

## Test Types

### 1. Unit Tests

Unit tests focus on testing individual components and functions in isolation. These tests verify that each small piece of code behaves as expected.

### 2. API Tests

API tests validate that the server endpoints function correctly, returning proper responses for different input scenarios. These tests ensure that data flows correctly between the client and server.

### 3. Storage Tests

Storage tests verify that the data layer behaves correctly, properly storing and retrieving data according to the application's requirements.

### 4. End-to-End Tests

End-to-end tests simulate real user behavior, testing complete workflows from the user's perspective. These tests validate that all components work together as expected.

### 5. Performance Tests

Performance tests measure the application's behavior under load, ensuring it can handle multiple concurrent requests efficiently.

## Running Tests

To run all tests:

```bash
npx vitest run
```

To run a specific test file:

```bash
npx vitest run tests/storage.test.ts
```

To run tests in watch mode:

```bash
npx vitest
```

## Test Files

### Storage Tests (`tests/storage.test.ts`)

Tests for the storage layer, validating that data operations work correctly:
- Retrieval of weekly schedules
- Creation of walking slots
- Deletion of walking slots
- Walker color index consistency
- Walker search functionality
- Walker information updates
- Leaderboard generation

### API Routes Tests (`tests/api-routes.test.ts`)

Tests for the server API endpoints:
- Schedule retrieval
- Slot booking
- Slot cancellation
- Walker color retrieval
- Walker search functionality
- Walker information updates
- Leaderboard retrieval

### End-to-End Tests (`tests/e2e.test.tsx`)

Simulates user interactions to test complete features:
- Initial page layout rendering
- Week navigation
- Slot booking process
- Error handling for already booked slots
- Booking cancellation
- User authorization for cancellations
- Leaderboard functionality
- Walker name autocomplete
- User information persistence

### Performance Tests (`tests/performance.test.ts`)

Tests application performance under load:
- Multiple simultaneous GET requests
- Multiple simultaneous POST requests
- Concurrent leaderboard retrieval

## Mock Implementation

The tests use mockStorage (in `tests/mocks/storage.mock.ts`) to simulate the storage layer without requiring a real database. This enables fast, reliable testing.

Key mock components:
- `mockStorage`: Implements the `IStorage` interface for testing
- `resetMockStorage()`: Clears mock data between tests
- Mock Service Worker to intercept and simulate API requests

## Best Practices

1. **Test Reset**: Each test resets the state to ensure isolation.
2. **Async Testing**: All API and storage operations are properly tested with async/await.
3. **User-Centric Testing**: End-to-end tests focus on user actions rather than implementation details.
4. **Performance Benchmarks**: Performance tests include specific thresholds for response times.
5. **Error Cases**: Tests include validation of error cases and edge conditions.

## Testing Caveats

- The tests use a fixed date (April 20, 2025) to ensure consistency.
- Local storage operations are mocked in the testing environment.
- Some API endpoints rely on environment variables like Twilio credentials, which are mocked during testing.