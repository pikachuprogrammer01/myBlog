<template>
  <div class="tags">
    <h1 class="blog-page-title">
      <el-icon><PriceTag /></el-icon>
      标签归档
    </h1>
    <div class="blog-card">
      <!-- 标签云 -->
      <div class="tag-cloud">
        <h3>
          <el-icon><DataAnalysis /></el-icon>
          标签云
        </h3>
        <div class="cloud-container">
          <el-tag
            v-for="tag in popularTags"
            :key="tag.tag"
            :type="getTagType(tag.count)"
            size="large"
            class="cloud-tag"
            @click="selectTag(tag.tag)"
          >
            <el-icon><PriceTag /></el-icon>
            {{ tag.tag }}
            <span class="tag-count">({{ tag.count }})</span>
          </el-tag>
        </div>
      </div>

      <!-- 选中的标签文章列表 -->
      <div v-if="selectedTag" class="selected-tag-section">
        <div class="tag-header">
          <h3>
            <el-icon><PriceTag /></el-icon>
            标签：{{ selectedTag }}
          </h3>
          <el-button link @click="clearSelectedTag">
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

      <!-- 所有标签统计 -->
      <div class="all-tags-section">
        <h3>
          <el-icon><DataAnalysis /></el-icon>
          所有标签统计
        </h3>
        <div class="tags-stats">
          <div v-for="tag in allTags" :key="tag.tag" class="tag-stat-item">
            <div class="tag-name">
              <el-icon><PriceTag /></el-icon>
              {{ tag.tag }}
            </div>
            <div class="tag-progress">
              <el-progress
                :percentage="getTagPercentage(tag.count)"
                :show-text="false"
                :stroke-width="6"
              />
            </div>
            <div class="tag-count">{{ tag.count }}篇</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useArticles } from '@/composables/useArticles'
import { formatDate } from '@/utils/date'
import {
  PriceTag,
  Document,
  Calendar,
  DataAnalysis,
  Close
} from '@element-plus/icons-vue'

const { getPopularTags, getArticlesByTag, getArticles } = useArticles()

const selectedTag = ref('')
const popularTags = computed(() => getPopularTags())

// 获取所有文章以计算标签统计
const allArticles = computed(() => getArticles())
const allTags = computed(() => {
  const tagCount = {}
  allArticles.value.forEach(article => {
    if (article.tags) {
      article.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
    }
  })

  return Object.entries(tagCount)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
})

// 根据选中的标签筛选文章
const filteredArticles = computed(() => {
  if (!selectedTag.value) return []
  return getArticlesByTag(selectedTag.value)
})

// 根据标签数量获取tag类型
const getTagType = (count) => {
  if (count >= 10) return 'danger'
  if (count >= 5) return 'warning'
  if (count >= 3) return 'success'
  return 'info'
}

// 计算标签百分比
const getTagPercentage = (count) => {
  const maxCount = Math.max(...allTags.value.map(t => t.count), 1)
  return Math.round((count / maxCount) * 100)
}

// 选择标签
const selectTag = (tag) => {
  selectedTag.value = tag
  // 滚动到选中标签区域
  setTimeout(() => {
    const element = document.querySelector('.selected-tag-section')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }, 100)
}

// 清除选中的标签
const clearSelectedTag = () => {
  selectedTag.value = ''
}
</script>

<style scoped lang="scss">
.tags {
  padding: var(--blog-spacing-md) 0;

  .blog-page-title {
    display: flex;
    align-items: center;
    gap: var(--blog-spacing-sm);

    .el-icon {
      color: var(--blog-primary-color);
    }
  }

  .tag-cloud {
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

    .cloud-container {
      display: flex;
      flex-wrap: wrap;
      gap: var(--blog-spacing-sm);
    }

    .cloud-tag {
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

      .tag-count {
        font-size: 0.8em;
        opacity: 0.8;
      }
    }
  }

  .selected-tag-section {
    margin-bottom: var(--blog-spacing-xl);

    .tag-header {
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

  .all-tags-section {
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

    .tags-stats {
      display: flex;
      flex-direction: column;
      gap: var(--blog-spacing-md);
    }

    .tag-stat-item {
      display: grid;
      grid-template-columns: 100px 1fr 60px;
      align-items: center;
      gap: var(--blog-spacing-md);

      .tag-name {
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: var(--blog-spacing-xs);

        .el-icon {
          color: var(--blog-primary-color);
          font-size: 14px;
        }
      }

      .tag-progress {
        flex: 1;
      }

      .tag-count {
        text-align: right;
        color: var(--blog-text-secondary);
        font-size: 14px;
      }
    }
  }
}
</style>