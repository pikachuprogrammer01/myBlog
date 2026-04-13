<template>
  <div class="markdown-renderer" ref="containerRef">
    <!-- 目录导航 -->
    <div v-if="showToc && tocItems.length > 0" class="toc-container">
      <div class="toc-header">
        <h4>目录</h4>
        <el-button
          v-if="showTocToggle"
          link
          size="small"
          @click="toggleToc"
        >
          {{ tocCollapsed ? '展开' : '收起' }}
        </el-button>
      </div>
      <transition name="toc-collapse">
        <div v-show="!tocCollapsed" class="toc-content">
          <nav class="toc-nav">
            <ul>
              <li
                v-for="item in tocItems"
                :key="item.id"
                :class="[
                  `toc-level-${item.level}`,
                  { 'toc-active': activeHeadingId === item.id }
                ]"
              >
                <a
                  :href="`#${item.id}`"
                  class="toc-link"
                  @click.prevent="scrollToHeading(item.id)"
                >
                  {{ item.text }}
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </transition>
    </div>

    <!-- Markdown内容 -->
    <div
      class="markdown-content"
      :class="{ 'with-toc': showToc && tocItems.length > 0 }"
      v-html="renderedContent"
      @click="handleContentClick"
    />

    <!-- 阅读进度 -->
    <div v-if="showProgress" class="reading-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${readingProgress}%` }" />
      </div>
      <div class="progress-text">
        <span>{{ Math.round(readingProgress) }}% 已读</span>
        <el-button
          v-if="readingProgress > 90"
          link
          size="small"
          @click="scrollToComments"
        >
          去评论
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import markdownItTaskLists from 'markdown-it-task-lists'
import { full as markdownItEmoji } from 'markdown-it-emoji'
import markdownItFootnote from 'markdown-it-footnote'

const props = defineProps({
  // Markdown源文本
  content: {
    type: String,
    default: ''
  },
  // 是否显示目录
  showToc: {
    type: Boolean,
    default: true
  },
  // 目录最大级别
  tocMaxLevel: {
    type: Number,
    default: 3,
    validator: (value) => value >= 1 && value <= 6
  },
  // 是否可折叠目录
  showTocToggle: {
    type: Boolean,
    default: true
  },
  // 是否显示阅读进度
  showProgress: {
    type: Boolean,
    default: true
  },
  // 是否启用代码高亮
  highlight: {
    type: Boolean,
    default: true
  },
  // 是否启用数学公式渲染
  math: {
    type: Boolean,
    default: false
  },
  // 是否启用任务列表
  taskLists: {
    type: Boolean,
    default: true
  },
  // 是否启用脚注
  footnotes: {
    type: Boolean,
    default: true
  },
  // 是否启用emoji
  emoji: {
    type: Boolean,
    default: true
  },
  // 自定义MarkdownIt配置
  markdownOptions: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['heading-click', 'content-rendered'])

// 响应式状态
const containerRef = ref(null)
const tocCollapsed = ref(false)
const activeHeadingId = ref('')
const readingProgress = ref(0)

// 创建MarkdownIt实例
const md = computed(() => {
  const options = {
    html: true, // 允许HTML标签
    linkify: true, // 自动转换链接
    typographer: true, // 启用排版优化
    breaks: false, // 不将换行转换为<br>
    ...props.markdownOptions
  }

  const mdInstance = new MarkdownIt(options)

  // 添加插件（如果启用）
  if (props.taskLists) {
    mdInstance.use(markdownItTaskLists)
  }

  if (props.emoji) {
    mdInstance.use(markdownItEmoji)
  }

  if (props.footnotes) {
    mdInstance.use(markdownItFootnote)
  }

  if (props.math) {
    // 需要额外安装markdown-it-mathjax或类似插件
    // mdInstance.use(require('markdown-it-mathjax'))
  }

  // 自定义渲染规则：为标题添加ID和锚点
  mdInstance.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const level = token.tag.slice(1) // h1 -> 1, h2 -> 2, etc.
    const nextToken = tokens[idx + 1]

    if (nextToken && nextToken.type === 'inline') {
      const headingText = nextToken.content
      const id = generateHeadingId(headingText, level)

      // 保存到环境变量中供后续使用
      if (!env.headings) env.headings = []
      env.headings.push({
        id,
        level: parseInt(level),
        text: headingText
      })

      return `<${token.tag} id="${id}">`
    }

    return self.renderToken(tokens, idx, options)
  }

  return mdInstance
})

// 渲染后的内容
const renderedContent = computed(() => {
  if (!props.content) return ''

  const env = {}
  const html = md.value.render(props.content, env)

  // 提取目录项
  tocItems.value = env.headings || []

  emit('content-rendered', { html, tocItems: tocItems.value })
  return html
})

// 目录项
const tocItems = ref([])

// 生成标题ID
const generateHeadingId = (text, level) => {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '') // 移除非字母数字中文和空格连字符
    .replace(/\s+/g, '-') // 空格替换为连字符
    .replace(/-+/g, '-') // 合并多个连字符
    .replace(/^-|-$/g, '') // 移除首尾连字符
    .slice(0, 50) // 限制长度
    || `heading-${level}-${Date.now()}`
}

// 切换目录折叠状态
const toggleToc = () => {
  tocCollapsed.value = !tocCollapsed.value
}

// 滚动到指定标题
const scrollToHeading = (id) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
    emit('heading-click', { id, element })
  }
}

// 计算阅读进度
const updateReadingProgress = () => {
  if (!containerRef.value) return

  const container = containerRef.value
  const contentHeight = container.scrollHeight - container.clientHeight
  const scrollTop = container.scrollTop

  if (contentHeight > 0) {
    readingProgress.value = Math.min(100, (scrollTop / contentHeight) * 100)
  }
}

// 监听滚动以更新活跃标题
const updateActiveHeading = () => {
  if (!containerRef.value) return

  const headings = Array.from(containerRef.value.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  const scrollTop = containerRef.value.scrollTop

  let activeHeading = null
  let maxOffset = -Infinity

  for (const heading of headings) {
    const offset = heading.offsetTop - scrollTop
    if (offset <= 100 && offset > maxOffset) {
      maxOffset = offset
      activeHeading = heading
    }
  }

  if (activeHeading) {
    activeHeadingId.value = activeHeading.id
  }
}

// 滚动到评论区
const scrollToComments = () => {
  const commentsSection = document.querySelector('.comments-section')
  if (commentsSection) {
    commentsSection.scrollIntoView({ behavior: 'smooth' })
  }
}

// 处理内容点击（例如链接点击）
const handleContentClick = (event) => {
  // 如果是内部锚点链接
  if (event.target.tagName === 'A' && event.target.hash) {
    const id = event.target.hash.slice(1)
    const element = document.getElementById(id)
    if (element) {
      event.preventDefault()
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

// 处理滚动事件
const handleScroll = () => {
  updateReadingProgress()
  updateActiveHeading()
}

// 初始化
const init = () => {
  if (containerRef.value) {
    containerRef.value.addEventListener('scroll', handleScroll)
    // 初始更新
    updateReadingProgress()
    updateActiveHeading()
  }
}

// 清理
const cleanup = () => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('scroll', handleScroll)
  }
}

// 监听内容变化
watch(() => props.content, () => {
  // 内容变化后重置状态
  activeHeadingId.value = ''
  readingProgress.value = 0

  // 等待DOM更新
  setTimeout(() => {
    updateReadingProgress()
    updateActiveHeading()
  }, 100)
})

// 生命周期
onMounted(() => {
  init()
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped lang="scss">
.markdown-renderer {
  position: relative;
  min-height: 200px;

  .toc-container {
    position: sticky;
    top: 20px;
    float: right;
    width: 280px;
    margin-left: var(--blog-spacing-lg);
    margin-bottom: var(--blog-spacing-lg);
    background-color: var(--blog-bg-gray);
    border-radius: var(--blog-border-radius);
    padding: var(--blog-spacing-md);
    z-index: 10;

    .toc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--blog-spacing-sm);

      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
    }

    .toc-content {
      max-height: 400px;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--blog-border-color);
        border-radius: 2px;
      }
    }

    .toc-nav {
      ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      li {
        margin-bottom: var(--blog-spacing-xs);
        line-height: 1.4;

        &.toc-level-1 {
          font-weight: 600;
        }

        &.toc-level-2 {
          padding-left: var(--blog-spacing-md);
          font-weight: 500;
        }

        &.toc-level-3 {
          padding-left: calc(var(--blog-spacing-md) * 2);
          font-size: 14px;
        }

        &.toc-level-4,
        &.toc-level-5,
        &.toc-level-6 {
          padding-left: calc(var(--blog-spacing-md) * 3);
          font-size: 13px;
          color: var(--blog-text-secondary);
        }

        &.toc-active {
          .toc-link {
            color: var(--blog-primary-color);
            font-weight: 600;
          }
        }
      }

      .toc-link {
        display: block;
        padding: 4px 0;
        color: var(--blog-text-primary);
        text-decoration: none;
        transition: color 0.2s ease;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &:hover {
          color: var(--blog-primary-color);
        }
      }
    }
  }

  .toc-collapse-enter-active,
  .toc-collapse-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .toc-collapse-enter-from,
  .toc-collapse-leave-to {
    max-height: 0;
    opacity: 0;
  }

  .markdown-content {
    &.with-toc {
      margin-right: 300px; // 为目录留出空间
    }

    :deep() {
      // Markdown内容样式
      font-size: 16px;
      line-height: 1.7;
      color: var(--blog-text-primary);

      // 标题样式
      h1, h2, h3, h4, h5, h6 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
        line-height: 1.3;
        color: var(--blog-text-primary);
        position: relative;

        &:first-child {
          margin-top: 0;
        }

        &:hover::before {
          content: '#';
          position: absolute;
          left: -1em;
          color: var(--blog-primary-color);
          opacity: 0.5;
        }
      }

      h1 { font-size: 2em; }
      h2 { font-size: 1.5em; }
      h3 { font-size: 1.25em; }
      h4 { font-size: 1.125em; }
      h5 { font-size: 1em; }
      h6 { font-size: 0.875em; }

      // 段落和列表
      p {
        margin-bottom: 1em;
      }

      ul, ol {
        margin-bottom: 1em;
        padding-left: 2em;
      }

      li {
        margin-bottom: 0.5em;
      }

      // 代码块
      pre {
        background-color: var(--blog-bg-gray);
        border-radius: var(--blog-border-radius);
        padding: var(--blog-spacing-md);
        margin-bottom: 1em;
        overflow-x: auto;

        code {
          background-color: transparent;
          padding: 0;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-size: 0.9em;
        }
      }

      // 行内代码
      code {
        background-color: var(--blog-bg-gray);
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 0.9em;
      }

      // 引用块
      blockquote {
        border-left: 4px solid var(--blog-primary-color);
        margin: 1em 0;
        padding: 0.5em 1em;
        background-color: var(--blog-bg-gray);
        border-radius: 0 var(--blog-border-radius) var(--blog-border-radius) 0;
        font-style: italic;

        p:last-child {
          margin-bottom: 0;
        }
      }

      // 表格
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1em;

        th, td {
          padding: 0.5em 1em;
          border: 1px solid var(--blog-border-color);
          text-align: left;
        }

        th {
          background-color: var(--blog-bg-gray);
          font-weight: 600;
        }

        tr:hover {
          background-color: var(--blog-bg-gray);
        }
      }

      // 图片
      img {
        max-width: 100%;
        height: auto;
        border-radius: var(--blog-border-radius);
        box-shadow: var(--blog-shadow);
      }

      // 链接
      a {
        color: var(--blog-primary-color);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      // 分隔线
      hr {
        border: none;
        border-top: 1px solid var(--blog-border-color);
        margin: 2em 0;
      }

      // 任务列表
      .task-list-item {
        list-style-type: none;

        input[type="checkbox"] {
          margin-right: 0.5em;
        }
      }
    }
  }

  .reading-progress {
    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: white;
    padding: var(--blog-spacing-md) 0;
    border-top: 1px solid var(--blog-border-color);
    z-index: 10;

    .progress-bar {
      height: 4px;
      background-color: var(--blog-bg-gray);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: var(--blog-spacing-sm);

      .progress-fill {
        height: 100%;
        background-color: var(--blog-primary-color);
        transition: width 0.3s ease;
      }
    }

    .progress-text {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      color: var(--blog-text-secondary);
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .markdown-renderer {
    .toc-container {
      position: static;
      float: none;
      width: 100%;
      margin-left: 0;
      margin-bottom: var(--blog-spacing-lg);
    }

    .markdown-content {
      &.with-toc {
        margin-right: 0;
      }
    }
  }
}

@media (max-width: 768px) {
  .markdown-renderer {
    .markdown-content {
      :deep() {
        font-size: 15px;

        h1 { font-size: 1.75em; }
        h2 { font-size: 1.4em; }
        h3 { font-size: 1.2em; }

        pre {
          padding: var(--blog-spacing-sm);
        }
      }
    }
  }
}
</style>