import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Element Plus 基础 CSS 变量（组件 CSS 由 unplugin-vue-components 按需导入）
import 'element-plus/theme-chalk/base.css'
// 命令式 API 的 CSS（ElMessageBox / ElMessage）需全局导入
// unplugin-vue-components 只处理 <template> 中的组件，<script> 中的 API 调用不会触发自动导入
// ElMessageBox 内部依赖 ElOverlay + ElDialog，它们的 CSS 也需显式导入
import 'element-plus/theme-chalk/el-overlay.css'
import 'element-plus/theme-chalk/el-dialog.css'
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-message.css'
// 导入全局样式
import './assets/styles/main.scss'

async function init() {
  const app = createApp(App)

  app.use(createPinia())
  app.use(router)

  // 等待路由初始导航完成
  await router.isReady()

  // GitHub Pages SPA 回退：从 404.html 恢复原始路径
  const redirect = sessionStorage.getItem('spa-redirect')
  if (redirect) {
    sessionStorage.removeItem('spa-redirect')
    await router.replace(redirect)
  }

  app.mount('#app')
}

init()