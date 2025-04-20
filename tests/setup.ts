import { expect, afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { server } from './mocks/server';

// Add missing matchers that TypeScript needs
declare global {
  namespace Vi {
    interface Assertion {
      toBeInTheDocument(): void;
      toHaveClass(className: string): void;
      toBeDisabled(): void;
      toHaveAttribute(attr: string, value?: string): void;
      toBeVisible(): void;
      toBeChecked(): void;
    }
  }
}

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset handlers after each test (important for test isolation)
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Close server after all tests
afterAll(() => server.close());