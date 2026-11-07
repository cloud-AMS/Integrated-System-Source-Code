import { defineConfig } from 'vitest/config';

// Harness unit-test sebagai golden baseline regresi matematika bisnis.
// Environment 'node' — tidak ada DOM; hanya fungsi murni (src/utils) & seed (src/data) yang diuji.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/domain/**/*.test.ts'],
    globals: false,
  },
});
