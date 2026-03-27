import { defineConfig } from 'vitest/config'

/**
 * Vitest 测试配置
 */
export default defineConfig({
  test: {
    // 启用全局 API（describe, it, expect 等）
    globals: true,
    // 测试环境：Node.js
    environment: 'node',
    // 排除的文件和目录
    exclude: ['node_modules', 'dist', 'tmp'],
    // 覆盖率配置
    coverage: {
      // 覆盖率报告格式
      reporter: ['text', 'json', 'html'],
    },
  },
})