import '@testing-library/jest-dom';
import { afterEach } from 'vitest';

// Clear localStorage after every test run
afterEach(() => {
  localStorage.clear();
});
