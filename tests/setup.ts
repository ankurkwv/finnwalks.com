import { expect, afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { server } from './mocks/server';

// Extend Vitest's expect method with methods from @testing-library/jest-dom
expect.extend(matchers);

// Run cleanup after each test
afterEach(() => {
  cleanup();
});

// Setup MSW handlers before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers between tests
afterEach(() => {
  server.resetHandlers();
});

// Clean up after tests
afterAll(() => {
  server.close();
});

// Extend Vitest's expect method with testing library matchers
declare global {
  namespace Vi {
    interface Assertion {
      toBeInTheDocument(): void;
      toBeVisible(): void;
      toBeChecked(): void;
      toBeDisabled(): void;
      toHaveAttribute(attr: string, value?: string): void;
      toHaveClass(className: string): void;
      toHaveStyle(style: Record<string, any>): void;
      toHaveValue(value: any): void;
      toHaveFocus(): void;
      toBeRequired(): void;
      toBeValid(): void;
      toBeInvalid(): void;
      toBeEmptyDOMElement(): void;
      toHaveTextContent(text: string | RegExp): void;
      toHaveDescription(description: string | RegExp): void;
      toContainElement(element: HTMLElement | null): void;
      toContainHTML(html: string): void;
    }
  }
}