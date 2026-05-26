import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'convex',
          include: ['convex/**/*.test.ts'],
          environment: 'edge-runtime',
        },
      },
      {
        extends: true,
        test: {
          name: 'frontend',
          include: ['src/**/*.test.ts'],
          exclude: ['convex/**'],
          environment: 'node',
        },
      },
    ],
  },
})
