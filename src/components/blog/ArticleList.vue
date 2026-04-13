<template>
  <div class="article-list">
    <!-- 列表模式 -->
    <div v-if="layout === 'list'" class="article-list-grid list-layout">
      <ArticleCard
        v-for="article in displayedArticles"
        :key="article.id"
        :article="article"
        :show-category="showCategory"
        :show-views="showViews"
        :show-comments="showComments"
        :show-tags="showTags"
        :show-actions="showActions"
        :max-tags="maxTags"
        class="list-item"
      />
    </div>

    <!-- 网格模式 -->
    <div v-else-if="layout === 'grid'" class="article-list-grid grid-layout">
      <ArticleCard
        v-for="article in displayedArticles"
        :key="article.id"
        :article="article"
        :show-category="showCategory"
        :show-views="showViews"
        :show-comments="showComments"
        :show-tags="showTags"
        :show-actions="showActions"
        :max-tags="maxTags"
        class="grid-item"
      />
    </div>

    <!-- 卡片模式 -->
    <div v-else-if="layout === 'card'" class="article-list-cards">
      <div
        v-for="article in displayedArticles"
        :key="article.id"
        class="article-card-large"
        @click="handleArticleClick(article)"
      >
        <div v-if="article.cover" class="card-cover">
          <img :src="article.cover" :alt="article.title" />
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ article.title }}</h3>
          <p v-if="article.excerpt" class="card-excerpt">
            {{ article.excerpt }}
          </p>
          <div class="card-meta">
            <span class="meta-date">{{ formatDate(article.date) }}</span>
            <span v-if="article.tags && article.tags.length > 0" class="meta-tag">
              {{ article.tags[0] }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && displayedArticles.length === 0" class="empty-state">
      <el-empty :description="emptyText" />
      <el-button v-if="showReset" type="primary" @click="handleReset">
        重置筛选
      </el-button>
    </div>

    <!-- 分页 -->
    <div v-if="showPagination && totalPages > 1" class="article-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="localPageSize"
        :page-sizes="[12, 24, 36, 48]"
        :small="paginationSmall"
        :disabled="loading"
        :background="paginationBackground"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalItems"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        @update:page-size="handlePageSizeUpdate"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import ArticleCard from './ArticleCard.vue'

const props = defineProps({
  // 文章数据
  articles: {
    type: Array,
    default: () => []
  },
  // 布局模式：list（列表）、grid（网格）、card（卡片）
  layout: {
    type: String,
    default: 'grid',
    validator: (value) => ['list', 'grid', 'card'].includes(value)
  },
  // 每页显示数量
  pageSize: {
    type: Number,
    default: 12
  },
  // 是否显示分页
  showPagination: {
    type: Boolean,
    default: true
  },
  // 是否正在加载
  loading: {
    type: Boolean,
    default: false
  },
  // 空状态文本
  emptyText: {
    type: String,
    default: '暂无文章'
  },
  // 是否显示重置按钮
  showReset: {
    type: Boolean,
    default: false
  },
  // ArticleCard 配置
  showCategory: {
    type: Boolean,
    default: true
  },
  showViews: {
    type: Boolean,
    default: true
  },
  showComments: {
    type: Boolean,
    default: true
  },
  showTags: {
    type: Boolean,
    default: true
  },
  showActions: {
    type: Boolean,
    default: true
  },
  maxTags: {
    type: Number,
    default: 3
  },
  // 分页配置
  paginationSmall: {
    type: Boolean,
    default: false
  },
  paginationBackground: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'page-change',
  'size-change',
  'article-click',
  'reset'
])

const router = useRouter()

// 当前页码
const currentPage = ref(1)
// 本地pageSize，用于v-model绑定
const localPageSize = ref(props.pageSize)

// 计算总页数
const totalItems = computed(() => props.articles.length)
const totalPages = computed(() => Math.ceil(totalItems.value / localPageSize.value))

// 计算当前页显示的文章
const displayedArticles = computed(() => {
  if (!props.showPagination) {
    return props.articles
  }

  const start = (currentPage.value - 1) * localPageSize.value
  const end = start + localPageSize.value
  return props.articles.slice(start, end)
})

// 格式化日期
const formatDate = (date) => {
  if (!date) return '未知日期'
  return dayjs(date).format('YYYY-MM-DD')
}

// 处理文章点击
const handleArticleClick = (article) => {
  emit('article-click', article)
  router.push(`/article/${article.id}`)
}

// 处理分页大小变化（来自size-change事件）
const handleSizeChange = (size) => {
  emit('size-change', size)
  // 重置到第一页
  currentPage.value = 1
}

// 处理page-size更新（来自update:page-size事件）
const handlePageSizeUpdate = (size) => {
  localPageSize.value = size
  emit('size-change', size)
  // 重置到第一页
  currentPage.value = 1
}

// 处理当前页变化
const handleCurrentChange = (page) => {
  emit('page-change', page)
}

// 处理重置
const handleReset = () => {
  emit('reset')
  currentPage.value = 1
}

// 监听文章数据变化，重置页码
watch(() => props.articles, () => {
  currentPage.value = 1
}, { deep: true })

// 监听pageSize prop变化，更新本地值
watch(() => props.pageSize, (newSize) => {
  localPageSize.value = newSize
})
</script>

<style scoped lang="scss">
.article-list {
  position: relative;
  min-height: 200px;

  // 网格布局
  .article-list-grid {
    display: grid;
    gap: var(--blog-spacing-lg);

    &.list-layout {
      grid-template-columns: 1fr;
    }

    &.grid-layout {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
  }

  // 卡片布局
  .article-list-cards {
    display: flex;
    flex-direction: column;
    gap: var(--blog-spacing-md);

    .article-card-large {
      background: var(--blog-bg-card);
      border-radius: var(--blog-border-radius-lg);
      overflow: hidden;
      box-shadow: var(--blog-shadow-sm);
      transition: all 0.3s ease;
      cursor: pointer;
      display: flex;
      align-items: stretch;
      min-height: 150px;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--blog-shadow-lg);
      }

      .card-cover {
        flex: 0 0 200px;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        &:hover img {
          transform: scale(1.05);
        }
      }

      .card-content {
        flex: 1;
        padding: var(--blog-spacing-lg);
        display: flex;
        flex-direction: column;
        justify-content: center;

        .card-title {
          font-size: 18px;
          font-weight: 600;
          line-height: 1.4;
          margin: 0 0 var(--blog-spacing-sm) 0;
          color: var(--blog-text-primary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-excerpt {
          font-size: 14px;
          line-height: 1.6;
          color: var(--blog-text-secondary);
          margin: 0 0 var(--blog-spacing-md) 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-meta {
          display: flex;
          align-items: center;
          gap: var(--blog-spacing-md);
          font-size: 13px;
          color: var(--blog-text-muted);

          .meta-date {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .meta-tag {
            background: var(--blog-bg-gray);
            color: var(--blog-text-secondary);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
          }
        }
      }
    }
  }

  // 加载状态
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    color: var(--blog-text-muted);

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--blog-border-color);
      border-top-color: var(--blog-primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: var(--blog-spacing-md);
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  }

  // 空状态
  .empty-state {
    padding: 80px 0;
    text-align: center;

    .el-empty {
      margin-bottom: var(--blog-spacing-lg);
    }
  }

  // 分页
  .article-pagination {
    margin-top: var(--blog-spacing-xl);
    padding-top: var(--blog-spacing-lg);
    border-top: 1px solid var(--blog-border-light);
    display: flex;
    justify-content: center;

    :deep(.el-pagination) {
      .el-pagination__total {
        color: var(--blog-text-secondary);
      }

      .el-pager li {
        background: var(--blog-bg-card);
        border: 1px solid var(--blog-border-color);
        margin: 0 4px;

        &:hover {
          color: var(--blog-primary-color);
        }

        &.active {
          background: var(--blog-primary-color);
          color: white;
          border-color: var(--blog-primary-color);
        }
      }

      .btn-prev,
      .btn-next {
        background: var(--blog-bg-card);
        border: 1px solid var(--blog-border-color);
        border-radius: 4px;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .article-list {
    .article-list-grid.grid-layout {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
  }
}

@media (max-width: 992px) {
  .article-list {
    .article-list-cards {
      .article-card-large {
        .card-cover {
          flex: 0 0 150px;
        }

        .card-content {
          padding: var(--blog-spacing-md);

          .card-title {
            font-size: 16px;
          }

          .card-excerpt {
            font-size: 13px;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .article-list {
    .article-list-grid.grid-layout {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: var(--blog-spacing-md);
    }

    .article-list-cards {
      .article-card-large {
        flex-direction: column;
        min-height: auto;

        .card-cover {
          flex: 0 0 160px;
        }

        .card-content {
          padding: var(--blog-spacing-md);
        }
      }
    }

    .article-pagination {
      :deep(.el-pagination) {
        --el-pagination-font-size: 12px;

        .el-pagination__total,
        .el-pagination__jump {
          display: none;
        }
      }
    }
  }
}

@media (max-width: 576px) {
  .article-list {
    .article-list-grid.grid-layout {
      grid-template-columns: 1fr;
    }
  }
}
</style>