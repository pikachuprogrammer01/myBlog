# 工具函数（Utils）

前端通用工具函数，涵盖缓存、日期处理、存储操作、确认对话框、错误处理等功能。

## 文件列表

| 文件 | 导出 | 功能说明 |
|------|------|----------|
| `cache.js` | `getCache(key)`, `setCache(key, data)`, `removeCache(key)` | localStorage 缓存读写（带 JSON 序列化/反序列化） |
| `confirm.js` | `confirmThen(message, title, type, fn)` | Element Plus 确认对话框封装，确认后执行回调 |
| `date.js` | 多个函数 | 基于 Day.js 的日期格式化工具 |
| `error.js` | `errMsg(error, prefix)` | 从 Axios 错误对象中提取可读的错误消息 |
| `storage.js` | `getStorage(key, fallback)`, `setStorage(key, value)`, `removeStorage(key)` | localStorage 安全读写（带 try-catch 保护） |
| `article-cover.js` | — | 文章封面图片处理（默认封面、路径解析） |
| `export-article.js` | — | 文章 HTML/JSON 导出工具 |
| `image.js` | — | 图片处理工具（Base64 转换、压缩等） |

## 核心工具

### cache.js

```js
import { getCache, setCache, removeCache } from '@/utils/cache'

// 写入缓存
setCache('myKey', { name: 'value' })

// 读取缓存（不存在返回 null）
const data = getCache('myKey')

// 清除缓存
removeCache('myKey')
```

与 `storage.js` 的区别：`cache.js` 在存取时自动做 JSON 序列化/反序列化，适合存储对象和数组。

### confirm.js

```js
import { confirmThen } from '@/utils/confirm'

// 弹出确认对话框，用户点击确定后执行回调
confirmThen('确定要删除吗？', '删除确认', 'warning', async () => {
  await deleteApi()
  ElMessage.success('已删除')
})
// type 可选值：'warning' | 'error' | 'info' | 'success'
```

### error.js

```js
import { errMsg } from '@/utils/error'

try {
  await someApi()
} catch (error) {
  // 自动从 error.response.data.message 提取错误信息
  ElMessage.error(errMsg(error, '操作失败: '))
}
```

### storage.js

```js
import { getStorage, setStorage, removeStorage } from '@/utils/storage'

// 带默认值的读取
const token = getStorage('TOKEN_KEY', null)

// 写入
setStorage('TOKEN_KEY', 'xxx')

// 删除
removeStorage('TOKEN_KEY')
```

带 `try-catch` 保护，在 localStorage 不可用时静默失败。
