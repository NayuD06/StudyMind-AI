import { defineConfig } from 'vitest/config'
import { testEnv } from './tests/test-env.js'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    env: testEnv,
    globalSetup: './tests/global-setup.ts',
    // Các file test dùng chung một database nên chạy lần lượt
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
})
