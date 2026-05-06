import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  // 基础推荐规则
  {
    ...js.configs.recommended,
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'warn',
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
    },
  },

  // Vue 3 推荐规则
  ...pluginVue.configs['flat/essential'],

  // 浏览器环境（src/ 前端代码）
  {
    files: ['src/**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-reserved-component-names': 'off',
    },
  },

  // Node.js 环境（api/, scripts/, 配置文件）
  {
    files: ['api/**/*.js', 'scripts/**/*.{js,cjs}', '*.config.js', 'vitest.config.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        Buffer: 'readonly',
      },
    },
  },

  // 忽略目录
  {
    ignores: [
      'node_modules/',
      'dist/',
      'api/node_modules/',
      'coverage/',
      '.claude/',
      '*.min.js',
    ],
  },
]
