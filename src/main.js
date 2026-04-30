import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Element Plus 基础 CSS 变量（组件 CSS 由 unplugin-vue-components 按需导入）
import 'element-plus/theme-chalk/base.css'
// 导入全局样式
import './assets/styles/main.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')