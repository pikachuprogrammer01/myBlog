import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import App from './App.vue'
import router from './router'
// 导入所有Element Plus图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 导入Element Plus样式
import 'element-plus/dist/index.css'
// 导入全局样式
import './assets/styles/main.scss'

const app = createApp(App)

// 注册Element Plus组件库
app.use(ElementPlus)

// 注册所有Element Plus图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)

app.mount('#app')