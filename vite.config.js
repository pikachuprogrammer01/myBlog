import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// process.cwd() 在 vite build/dev 时始终为项目根目录，ESM/CJS 均可使用
const root = process.cwd()

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '')
  return {
  plugins: [
    vue(),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: 'css' })],
      dts: resolve(root, 'src/components.d.ts'),
    }),
  ],
  base: env.VITE_BASE || '/',
  resolve: {
    alias: {
      '@': resolve(root, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  build: {
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // ECharts 仅管理后台使用，独立拆包
            if (id.includes('echarts') || id.includes('zrender')) {
              return 'vendor-echarts'
            }
            // Vue 生态 + Element Plus + 其他依赖统一拆包，长期缓存
            return 'vendor'
          }
        },
      }
    }
  }
  }
})