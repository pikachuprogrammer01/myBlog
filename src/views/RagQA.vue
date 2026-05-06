<template>
  <div class="rag-qa-page">
    <div class="rag-header">
      <h1>AI 知识问答</h1>
      <p>基于博客文章内容，用 AI 回答你的技术问题</p>
    </div>

    <div class="chat-container" ref="chatContainerRef">
      <div v-if="messages.length === 0 && !loading" class="chat-empty">
        <el-icon class="empty-icon"><ChatDotRound /></el-icon>
        <p>试试这些问题：</p>
        <div class="suggestions">
          <span
            v-for="q in suggestions"
            :key="q"
            class="suggestion-tag"
            @click="askSuggestion(q)"
          >{{ q }}</span>
        </div>
      </div>

      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        :class="['message', msg.role]"
      >
        <div class="message-avatar">
          <el-icon v-if="msg.role === 'user'" :size="18"><User /></el-icon>
          <span v-else class="ai-avatar">AI</span>
        </div>
        <div class="message-body">
          <div class="message-content" v-html="msg.rendered"></div>
          <div v-if="msg.sources && msg.sources.length" class="message-sources">
            <span class="sources-label">参考来源：</span>
            <router-link
              v-for="s in msg.sources"
              :key="s.id"
              :to="`/article/${s.id}`"
              class="source-link"
            >{{ s.title }}</router-link>
          </div>
        </div>
      </div>

      <div v-if="loading" class="message ai">
        <div class="message-avatar">
          <span class="ai-avatar">AI</span>
        </div>
        <div class="message-body">
          <div class="typing-indicator">
            <span>正在检索文章并生成回答</span>
            <span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>
          </div>
        </div>
      </div>

      <div v-if="errorMsg && !loading" class="chat-error">
        <el-icon><WarningFilled /></el-icon>
        <span>{{ errorMsg }}</span>
        <el-button link type="primary" @click="retryLast">重试</el-button>
      </div>
    </div>

    <div class="chat-input-area">
      <el-input
        v-model="question"
        placeholder="输入你的问题，例如：如何优化前端性能？"
        :disabled="loading"
        @keydown="handleKeydown"
        clearable
        size="large"
      >
        <template #append>
          <el-button
            :icon="Promotion"
            :disabled="loading || !question.trim()"
            @click="handleAsk"
            type="primary"
          >发送</el-button>
        </template>
      </el-input>
      <p class="input-hint">Enter 发送 · Shift+Enter 换行</p>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Promotion, ChatDotRound, User, WarningFilled } from '@element-plus/icons-vue';
import MarkdownIt from 'markdown-it';
import { askQuestion } from '@/api/services/ragService';

const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

const chatContainerRef = ref(null);
const messages = ref([]);
const question = ref('');
const loading = ref(false);
const errorMsg = ref('');
let lastQuestion = '';

const suggestions = [
  '如何优化前端性能？',
  'Node.js 后端如何设计 API？',
  'MySQL 数据库优化技巧有哪些？',
  '如何部署前端项目到 GitHub Pages？',
];

function scrollToBottom() {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
    }
  });
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleAsk();
  }
}

async function handleAsk() {
  const q = question.value.trim();
  if (!q || loading.value) return;

  errorMsg.value = '';
  lastQuestion = q;
  messages.value.push({ role: 'user', content: q, rendered: md.render(q), sources: [] });
  question.value = '';
  loading.value = true;
  scrollToBottom();

  try {
    const res = await askQuestion(q);
    if (res.data.success) {
      const { answer, sources } = res.data.data;
      messages.value.push({
        role: 'ai',
        content: answer,
        rendered: md.render(answer),
        sources: sources || [],
      });
    } else {
      errorMsg.value = res.data.message || '问答失败，请稍后重试';
    }
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      errorMsg.value = '请求超时，请稍后重试';
    } else if (err.response) {
      const msg = err.response.data?.message || '服务异常';
      if (err.response.status === 503) {
        errorMsg.value = '语义搜索未配置，请联系管理员配置 EMBEDDING_API_KEY';
      } else {
        errorMsg.value = msg;
      }
    } else {
      errorMsg.value = '网络错误，请检查连接后重试';
    }
  } finally {
    loading.value = false;
    scrollToBottom();
  }
}

function askSuggestion(q) {
  question.value = q;
  handleAsk();
}

function retryLast() {
  errorMsg.value = '';
  if (lastQuestion) {
    question.value = lastQuestion;
    handleAsk();
  }
}

watch(messages, () => scrollToBottom(), { deep: true });
</script>

<style scoped lang="scss">
.rag-qa-page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--blog-spacing-lg);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  min-height: 500px;
}

.rag-header {
  text-align: center;
  margin-bottom: var(--blog-spacing-lg);

  h1 {
    font-size: 28px;
    font-weight: 700;
    color: var(--blog-text-primary);
    margin: 0 0 8px;
  }

  p {
    color: var(--blog-text-secondary);
    font-size: 14px;
    margin: 0;
  }
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--blog-spacing-md);
  background: var(--blog-bg-gray);
  border-radius: var(--blog-border-radius);
  border: 1px solid var(--blog-border-color);
  margin-bottom: var(--blog-spacing-md);

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

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;

  .empty-icon {
    font-size: 48px;
    color: var(--blog-text-secondary);
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    color: var(--blog-text-secondary);
    margin-bottom: 12px;
  }

  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }

  .suggestion-tag {
    display: inline-block;
    padding: 6px 14px;
    background: rgba(242, 201, 76, 0.08);
    border: 1px solid rgba(242, 201, 76, 0.25);
    border-radius: 4px;
    color: #f2c94c;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: rgba(242, 201, 76, 0.15);
      border-color: #f2c94c;
    }
  }
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: var(--blog-spacing-md);

  .message-avatar {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a1d21;
    border: 1px solid var(--blog-border-color);
    color: var(--blog-text-secondary);
    font-size: 12px;

    .ai-avatar {
      font-family: "Courier New", monospace;
      font-weight: 700;
      font-size: 12px;
      color: #f2c94c;
    }
  }

  &.user {
    flex-direction: row-reverse;

    .message-avatar {
      background: rgba(242, 201, 76, 0.1);
      border-color: rgba(242, 201, 76, 0.3);
      color: #f2c94c;
    }

    .message-body {
      align-items: flex-end;

      .message-content {
        background: rgba(242, 201, 76, 0.06);
        border-color: rgba(242, 201, 76, 0.2);
        border-radius: 8px 4px 8px 8px;
      }
    }
  }

  .message-body {
    display: flex;
    flex-direction: column;
    max-width: 75%;
    min-width: 0;
  }

  .message-content {
    padding: 10px 14px;
    background: #0d0f11;
    border: 1px solid var(--blog-border-color);
    border-radius: 4px 8px 8px 8px;
    color: var(--blog-text-primary);
    font-size: 14px;
    line-height: 1.65;
    word-break: break-word;

    :deep(p) {
      margin: 0 0 6px;
      &:last-child { margin-bottom: 0; }
    }

    :deep(pre) {
      background: #0a0e11;
      border: 1px solid #30363d;
      padding: 10px 12px;
      border-radius: 2px;
      overflow-x: auto;
      font-size: 12px;
      margin: 6px 0;
    }

    :deep(code) {
      font-family: "JetBrains Mono", "Fira Code", monospace;
      font-size: 0.85em;
      background: #0a0e11;
      padding: 0.15em 0.35em;
      border-radius: 2px;
      color: #f2c94c;
    }

    :deep(pre code) {
      background: transparent;
      padding: 0;
      color: #e6edf3;
    }

    :deep(blockquote) {
      border-left: 3px solid var(--blog-primary-color);
      margin: 6px 0;
      padding-left: 10px;
      color: var(--blog-text-secondary);
    }

    :deep(a) {
      color: var(--blog-primary-color);
    }

    :deep(ul), :deep(ol) {
      padding-left: 1.5em;
      margin: 4px 0;
    }
  }

  .message-sources {
    margin-top: 6px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;

    .sources-label {
      font-size: 12px;
      color: var(--blog-text-secondary);
    }

    .source-link {
      display: inline-block;
      padding: 2px 8px;
      background: rgba(242, 201, 76, 0.06);
      border: 1px solid rgba(242, 201, 76, 0.2);
      border-radius: 3px;
      color: #f2c94c;
      font-size: 12px;
      text-decoration: none;
      transition: all 0.15s ease;

      &:hover {
        background: rgba(242, 201, 76, 0.12);
        border-color: #f2c94c;
      }
    }
  }
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  background: #0d0f11;
  border: 1px solid var(--blog-border-color);
  border-radius: 4px 8px 8px 8px;
  color: var(--blog-text-secondary);
  font-size: 13px;

  .typing-dots {
    display: inline-flex;

    span {
      animation: dot-bounce 1.4s ease-in-out infinite both;
      font-weight: 700;
      color: #f2c94c;

      &:nth-child(1) { animation-delay: 0s; }
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }
}

@keyframes dot-bounce {
  0%, 80%, 100% { opacity: 0; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-3px); }
}

.chat-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(248, 81, 73, 0.08);
  border: 1px solid rgba(248, 81, 73, 0.25);
  border-radius: var(--blog-border-radius);
  color: #f85149;
  font-size: 13px;
  margin-top: 8px;
}

.chat-input-area {
  .input-hint {
    text-align: center;
    font-size: 11px;
    color: var(--blog-text-secondary);
    margin: 6px 0 0;
    opacity: 0.6;
  }

  :deep(.el-input-group__append) {
    background: transparent;
    border-color: var(--blog-border-color);
  }
}

@media (max-width: 768px) {
  .rag-qa-page {
    padding: var(--blog-spacing-sm);
    height: calc(100vh - 160px);
  }

  .message .message-body {
    max-width: 85%;
  }
}
</style>
