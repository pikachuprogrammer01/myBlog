<template>
  <div class="categories">
    <h1 class="blog-page-title">
      <el-icon><Folder /></el-icon>
      文章分类
    </h1>
    <div class="blog-card">
      <!-- 分类导航 -->
      <div class="category-navigation">
        <h3>
          <el-icon><Folder /></el-icon>
          分类导航
        </h3>
        <div class="category-list">
          <el-tag
            v-for="category in categories"
            :key="category.id"
            :type="getCategoryType(category.count)"
            size="large"
            class="category-tag"
            @click="selectCategory(category.id)"
          >
            <el-icon><Folder /></el-icon>
            {{ category.name }}
            <span class="category-count">({{ category.count }})</span>
          </el-tag>
        </div>
      </div>

      <!-- 选中的分类文章列表 -->
      <div v-if="selectedCategory" class="selected-category-section">
        <div class="category-header">
          <h3>
            <el-icon><Folder /></el-icon>
            分类：{{ selectedCategoryName }}
          </h3>
          <el-button link @click="clearSelectedCategory">
            <el-icon><Close /></el-icon>
            清除筛选
          </el-button>
        </div>

        <div v-if="filteredArticles.length === 0" class="empty-state">
          <p>暂无相关文章</p>
        </div>
        <div v-else>
          <el-table :data="filteredArticles" style="width: 100%">
            <el-table-column prop="title" label="文章标题">
              <template #header>
                <span class="table-header">
                  <el-icon><Document /></el-icon>
                  文章标题
                </span>
              </template>
              <template #default="{ row }">
                <router-link :to="`/article/${row.id}`" class="article-link">
                  <el-icon><Document /></el-icon>
                  {{ row.title }}
                </router-link>
              </template>
            </el-table-column>
            <el-table-column prop="date" label="发布日期" width="120">
              <template #header>
                <span class="table-header">
                  <el-icon><Calendar /></el-icon>
                  发布日期
                </span>
              </template>
              <template #default="{ row }">
                <div class="date-cell">
                  <el-icon><Calendar /></el-icon>
                  {{ formatDate(row.date) }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="标签" width="200">
              <template #header>
                <span class="table-header">
                  <el-icon><PriceTag /></el-icon>
                  标签
                </span>
              </template>
              <template #default="{ row }">
                <div class="article-tags">
                  <el-tag
                    v-for="tag in row.tags"
                    :key="tag"
                    size="small"
                    class="article-tag"
                    @click="selectTag(tag)"
                  >
                    <el-icon><PriceTag /></el-icon>
                    {{ tag }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 所有分类统计 -->
      <div class="all-categories-section">
        <h3>
          <el-icon><DataAnalysis /></el-icon>
          所有分类统计
        </h3>
        <div class="categories-stats">
          <div v-for="category in categories" :key="category.id" class="category-stat-item">
            <div class="category-name">
              <el-icon><Folder /></el-icon>
              {{ category.name }}
            </div>
            <div class="category-progress">
              <el-progress
                :percentage="getCategoryPercentage(category.count)"
                :show-text="false"
                :stroke-width="6"
              />
            </div>
            <div class="category-count">{{ category.count }}篇</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticles } from '@/composables/useArticles'
import { formatDate } from '@/utils/date'
import {
  Folder,
  Document,
  Calendar,
  PriceTag,
  DataAnalysis,
  Close
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const { getCategories, getArticlesByCategory } = useArticles()

const selectedCategory = computed(() => {
  return typeof route.query.category === 'string' ? route.query.category : ''
})

const categories = computed(() => getCategories())

// 根据选中的分类筛选文章
const filteredArticles = computed(() => {
  if (!selectedCategory.value) return []
  return getArticlesByCategory(selectedCategory.value)
})

// 获取选中的分类名称
const selectedCategoryName = computed(() => {
  if (!selectedCategory.value) return ''
  const category = categories.value.find(c => c.id === selectedCategory.value)
  return category ? category.name : ''
})

// 根据文章数量获取分类类型
const getCategoryType = (count) => {
  if (count >= 10) return 'danger'
  if (count >= 5) return 'warning'
  if (count >= 3) return 'success'
  return 'info'
}

// 计算分类百分比
const getCategoryPercentage = (count) => {
  const maxCount = Math.max(...categories.value.map(c => c.count), 1)
  return Math.round((count / maxCount) * 100)
}

// 选择分类
const selectCategory = (categoryId) => {
  router.push({
    path: '/categories',
    query: { category: categoryId }
  })
}

// 选择标签（跳转到标签页面）
const selectTag = (tag) => {
  router.push({
    path: '/tags',
    query: { tag }
  })
}

// 清除选中的分类
const clearSelectedCategory = () => {
  router.push('/categories')
}
</script>

<style scoped lang="scss">
.categories {
  padding: var(--blog-spacing-md) 0;

  .blog-page-title {
    display: flex;
    align-items: center;
    gap: var(--blog-spacing-sm);

    .el-icon {
      color: var(--blog-primary-color);
    }
  }

  .category-navigation {
    margin-bottom: var(--blog-spacing-xl);

    h3 {
      margin-bottom: var(--blog-spacing-lg);
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: var(--blog-spacing-xs);

      .el-icon {
        color: var(--blog-primary-color);
      }
    }

    .category-list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--blog-spacing-sm);
    }

    .category-tag {
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--blog-shadow);
      }

      .el-icon {
        font-size: 14px;
      }

      .category-count {
        font-size: 0.8em;
        opacity: 0.8;
      }
    }
  }

  .selected-category-section {
    margin-bottom: var(--blog-spacing-xl);

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--blog-spacing-lg);

      .el-button {
        display: flex;
        align-items: center;
        gap: var(--blog-spacing-xs);
      }

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: var(--blog-spacing-xs);

        .el-icon {
          color: var(--blog-primary-color);
        }
      }
    }

    .article-link {
      color: var(--blog-text-primary);
      text-decoration: none;

      &:hover {
        color: var(--blog-primary-color);
        text-decoration: underline;
      }
    }

    .article-tags {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;

      .article-tag {
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 3px;
      }
    }

    .table-header {
      display: flex;
      align-items: center;
      gap: var(--blog-spacing-xs);

      .el-icon {
        font-size: 14px;
        color: var(--blog-primary-color);
      }
    }

    .date-cell {
      display: flex;
      align-items: center;
      gap: var(--blog-spacing-xs);

      .el-icon {
        font-size: 14px;
        color: var(--blog-info-color);
      }
    }

    .article-link {
      display: flex;
      align-items: center;
      gap: var(--blog-spacing-xs);

      .el-icon {
        font-size: 14px;
        color: var(--blog-info-color);
      }
    }

    .empty-state {
      text-align: center;
      padding: var(--blog-spacing-xl);
      color: var(--blog-text-secondary);
    }
  }

  .all-categories-section {
    h3 {
      margin-bottom: var(--blog-spacing-lg);
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: var(--blog-spacing-xs);

      .el-icon {
        color: var(--blog-primary-color);
      }
    }

    .categories-stats {
      display: flex;
      flex-direction: column;
      gap: var(--blog-spacing-md);
    }

    .category-stat-item {
      display: grid;
      grid-template-columns: 100px 1fr 60px;
      align-items: center;
      gap: var(--blog-spacing-md);

      .category-name {
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: var(--blog-spacing-xs);

        .el-icon {
          color: var(--blog-primary-color);
          font-size: 14px;
        }
      }

      .category-progress {
        flex: 1;
      }

      .category-count {
        text-align: right;
        color: var(--blog-text-secondary);
        font-size: 14px;
      }
    }
  }
}
</style>
