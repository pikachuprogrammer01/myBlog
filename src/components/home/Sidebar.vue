<template>
  <aside class="home-sidebar">
    <!-- 运行监控模块 -->
    <div class="sidebar-widget monitor-panel">
      <div class="panel-header">
        <span class="sys-dot"></span>
        <span class="panel-title">系统监控</span>
        <span class="sys-status">运行中</span>
      </div>
      <div class="monitor-lines">
        <div class="monitor-row">
          <span class="label">文章数</span>
          <span class="value">{{ stats.articleCount }}</span>
        </div>
        <div class="monitor-row">
          <span class="label">分类数</span>
          <span class="value">{{ stats.categoryCount }}</span>
        </div>
        <div class="monitor-row">
          <span class="label">在线率</span>
          <span class="value">99.8%</span>
        </div>
        <div class="monitor-row">
          <span class="label">响应时间</span>
          <span class="value">{{ stats.responseTime }}ms</span>
        </div>
      </div>
      <div class="monitor-footer">
        <span class="cursor-blink">_</span>
      </div>
    </div>

    <!-- 博主信息模块 -->
    <div class="sidebar-widget author-panel">
      <div class="panel-header">
        <span class="sys-dot"></span>
        <span class="panel-title">博主信息</span>
      </div>
      <div class="author-inner">
        <el-avatar class="avatar" :size="56" :src="authorAvatar" />
        <div class="author-detail">
          <h3 class="name">{{ authorName }}</h3>
          <p class="bio">{{ authorBio }}</p>
        </div>
      </div>
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-num">{{ stats.articleCount }}</span>
          <span class="stat-label">文章</span>
        </div>
        <div class="stat-divider">|</div>
        <div class="stat-item">
          <span class="stat-num">{{ stats.projectCount }}</span>
          <span class="stat-label">项目</span>
        </div>
      </div>
    </div>

    <!-- 标签模块 -->
    <div class="sidebar-widget tags-panel">
      <div class="panel-header">
        <span class="sys-dot"></span>
        <span class="panel-title">标签</span>
      </div>
      <div class="tag-flex">
        <span v-for="t in displayTags" :key="t.tag || t" class="cable-tag">
          #&nbsp;{{ t.tag || t }}
        </span>
      </div>
    </div>

    <!-- 版本号 -->
    <div class="ver-string">版本: 2.0.4-STABLE // 构建: 2026-05-05</div>
  </aside>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useArticleStore } from "@/stores/article";
import { getProjects } from "@/api/services/projectService";

const props = defineProps({
  tags: {
    type: Array,
    default: () => [],
  },
});

const articleStore = useArticleStore();

const authorAvatar = "/avatar.jpg";
const authorName = "wushu";
const authorBio = "Exploring Vue 3 Ecosystem";

const responseTimeMs = ref(42);
const projectCount = ref(5);

const stats = computed(() => {
  const articles = articleStore.getAllArticles();
  const categories = articleStore.categories;
  return {
    articleCount: articles.length || 21,
    categoryCount: categories.length || 5,
    projectCount: projectCount.value,
    responseTime: responseTimeMs.value,
  };
});

const displayTags = computed(() => {
  if (props.tags && props.tags.length > 0) return props.tags.slice(0, 10);
  const popular = articleStore.getPopularTags;
  if (Array.isArray(popular) && popular.length > 0) return popular.slice(0, 10);
  return [{ tag: "Vue3" }, { tag: "Element+" }, { tag: "Vite" }, { tag: "Sass" }, { tag: "Pinia" }];
});

// 简单测量 API 响应时间
async function measureResponseTime() {
  const start = performance.now();
  try {
    await fetch("https://myblog-api-five.vercel.app/api/articles?page=1&size=1", {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // ignore
  }
  const elapsed = Math.round(performance.now() - start);
  if (elapsed > 0 && elapsed < 5000) {
    responseTimeMs.value = elapsed;
  }
}

async function fetchProjectCount() {
  try {
    const res = await getProjects();
    if (res.data.success && Array.isArray(res.data.data)) {
      projectCount.value = res.data.data.length;
    }
  } catch {
    // keep fallback value
  }
}

onMounted(() => {
  measureResponseTime();
  fetchProjectCount();
});
</script>

<style lang="scss" scoped>
$bg-panel: #161b22;
$border-color: #30363d;
$accent-gold: #f2c94c;
$text-bright: #e6edf3;
$text-muted: #8b949e;
$monitor-green: #3fb950;
$radius: 2px;

.home-sidebar {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 992px) {
    width: 100%;
  }

  .sidebar-widget {
    background: #0d1117;
    border: 1px solid $border-color;
    border-radius: $radius;
    box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.4);
    overflow: hidden;

    .panel-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #0a0e13;
      border-bottom: 1px solid $border-color;
      font-family: "Courier New", "Source Code Pro", monospace;
      font-size: 11px;
      letter-spacing: 1.5px;
      color: $text-muted;

      .sys-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: $monitor-green;
        box-shadow: 0 0 6px rgba(63, 185, 80, 0.6);
      }

      .panel-title {
        flex: 1;
        font-weight: 700;
      }

      .sys-status {
        color: $monitor-green;
        font-size: 10px;
      }
    }
  }

  // 监控面板
  .monitor-panel {
    .monitor-lines {
      padding: 12px 16px;
    }

    .monitor-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      font-family: "Courier New", "Source Code Pro", monospace;
      font-size: 12px;

      .label {
        color: $text-muted;
        letter-spacing: 1px;
      }

      .value {
        color: $monitor-green;
        font-weight: 700;
        text-shadow: 0 0 4px rgba(63, 185, 80, 0.4);
      }
    }

    .monitor-footer {
      padding: 8px 16px;
      border-top: 1px solid $border-color;
      text-align: right;

      .cursor-blink {
        color: $monitor-green;
        font-family: "Courier New", monospace;
        font-size: 14px;
        animation: cursor-blink 1s step-end infinite;
      }
    }
  }

  // 博主面板
  .author-panel {
    .author-inner {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;

      .avatar {
        border: 1px solid $border-color;
        border-radius: $radius;
      }

      .author-detail {
        .name {
          font-size: 15px;
          font-weight: 600;
          color: $text-bright;
          margin: 0 0 4px;
        }

        .bio {
          font-size: 12px;
          color: $text-muted;
          margin: 0;
          font-family: "Courier New", monospace;
        }
      }
    }

    .stats-row {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      padding: 12px 16px;
      border-top: 1px solid $border-color;
      font-family: "Courier New", "Source Code Pro", monospace;

      .stat-item {
        text-align: center;

        .stat-num {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: $accent-gold;
        }

        .stat-label {
          font-size: 10px;
          color: $text-muted;
          letter-spacing: 2px;
        }
      }

      .stat-divider {
        color: $border-color;
        font-size: 18px;
      }
    }
  }

  // 标签面板
  .tags-panel {
    .tag-flex {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 14px 16px;

      .cable-tag {
        font-family: "Courier New", "Source Code Pro", monospace;
        font-size: 11px;
        color: $text-muted;
        background: transparent;
        border: 1px solid rgba($border-color, 0.6);
        padding: 4px 10px;
        border-radius: 2px 6px 2px 6px;
        cursor: pointer;
        transition: all 0.12s ease;

        &:hover {
          color: $accent-gold;
          border-color: rgba(242, 201, 76, 0.35);
          background: rgba(242, 201, 76, 0.04);
        }
      }
    }
  }

  .ver-string {
    font-family: "Courier New", monospace;
    font-size: 10px;
    color: rgba($text-muted, 0.5);
    text-align: center;
    letter-spacing: 1px;
    padding: 4px 0;
  }
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
