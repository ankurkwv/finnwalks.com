# FinnWalks Testing Guide

This document provides instructions for running the automated integration tests for the FinnWalks application.

## Test Structure

The tests are organized into several categories:

1. **Component Tests**:
   - `Home.test.tsx` - Tests for the Home page component
   - `Schedule.test.tsx` - Tests for the Schedule component
   - `BookingModal.test.tsx` - Tests for the BookingModal component
   - `Leaderboard.test.tsx` - Tests for the Leaderboard component

2. **API Tests**:
   - `api.test.ts` - Tests for the backend API endpoints

3. **End-to-End Tests**:
   - `e2e.test.tsx` - Complete user flow tests

4. **Performance Tests**:
   - `performance.test.ts` - Load testing and concurrency tests

## Running the Tests

To run the tests, use the following command:

```bash
npx vitest run
```

To run tests in watch mode (useful during development):

```bash
npx vitest
```

To run a specific test file:

```bash
npx vitest run tests/Home.test.tsx
```

To run tests with coverage report:

```bash
npx vitest run --coverage
```

## Test Commands by Category

Run specific categories of tests:

```bash
# Run component tests
npx vitest run tests/Home.test.tsx tests/Schedule.test.tsx tests/BookingModal.test.tsx tests/Leaderboard.test.tsx

# Run API tests
npx vitest run tests/api.test.ts

# Run end-to-end tests
npx vitest run tests/e2e.test.tsx

# Run performance tests
npx vitest run tests/performance.test.ts
```

## Testing Architecture

### Mock Service Worker (MSW)

We use MSW to intercept and mock API requests during testing. This allows tests to run in isolation without requiring a running server or a real database.

The MSW setup is located in:
- `tests/mocks/handlers.ts` - API request handlers
- `tests/mocks/server.ts` - Server setup

### Testing Utilities

Common testing utilities are available in:
- `tests/utils.tsx` - Custom render function with providers
- `tests/setup.ts` - Global test setup and teardown

### Test Environment

The tests run in a Node.js environment using Happy DOM to emulate browser APIs. This provides a fast and reliable environment for testing React components.

## Creating New Tests

When creating new tests:

1. Use the existing patterns and utilities
2. Keep tests focused and isolated
3. Use descriptive test names
4. Mock external dependencies
5. Use the custom render function from `tests/utils.tsx`

## Testing Best Practices

1. Test component behavior, not implementation details
2. Use accessible queries when possible (e.g., `getByRole`, `getByLabelText`)
3. Write tests that are resilient to UI changes
4. Test error states and edge cases
5. Keep tests independent and stateless