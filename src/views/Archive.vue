<template>
  <div class="archive">
    <h1 class="blog-page-title">
      <el-icon><Calendar /></el-icon>
      文章归档
    </h1>
    <div class="blog-card">
      <!-- 归档统计 -->
      <div class="archive-stats">
        <div class="stat-item">
          <div class="stat-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-value">{{ totalArticles }}</div>
          <div class="stat-label">文章总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="stat-value">{{ years.length }}</div>
          <div class="stat-label">归档年份</div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <el-icon><PriceTag /></el-icon>
          </div>
          <div class="stat-value">{{ totalTags }}</div>
          <div class="stat-label">标签数量</div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <el-icon><DataAnalysis /></el-icon>
          </div>
          <div class="stat-value">{{ mostActiveYear }}</div>
          <div class="stat-label">最活跃年份</div>
        </div>
      </div>

      <!-- 按年月归档 -->
      <div class="archive-timeline">
        <h3>
          <el-icon><Clock /></el-icon>
          按时间归档
        </h3>
        <div v-if="archiveData.length === 0" class="empty-state">
          <p>暂无文章归档数据</p>
        </div>
        <div v-else class="timeline-container">
          <div
            v-for="yearData in archiveData"
            :key="yearData.year"
            class="year-section"
            :data-year="yearData.year"
          >
            <div class="year-header">
              <h4>
                <el-icon><Calendar /></el-icon>
                {{ yearData.year }}年
              </h4>
              <span class="year-count">({{ yearData.total }}篇)</span>
            </div>
            <div class="months-container">
              <div v-for="monthData in yearData.months" :key="monthData.month" class="month-section">
                <div class="month-header">
                  <h5>
                    <el-icon><Clock /></el-icon>
                    {{ monthData.month }}月
                  </h5>
                  <span class="month-count">({{ monthData.count }}篇)</span>
                </div>
                <div class="articles-list">
                  <div v-for="article in monthData.articles" :key="article.id" class="article-item">
                    <div class="article-date">
                      <el-icon><Calendar /></el-icon>
                      {{ formatDay(article.date) }}
                    </div>
                    <router-link :to="`/article/${article.id}`" class="article-title">
                      <el-icon><Document /></el-icon>
                      {{ article.title }}
                    </router-link>
                    <div class="article-tags">
                      <el-tag
                        v-for="tag in article.tags"
                        :key="tag"
                        size="small"
                        class="tag"
                        @click="navigateToTag(tag)"
                      >
                        <el-icon><PriceTag /></el-icon>
                        {{ tag }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 年份导航 -->
      <div class="year-navigation">
        <h3>
          <el-icon><Calendar /></el-icon>
          快速导航
        </h3>
        <div class="year-buttons">
          <el-button
            v-for="year in years"
            :key="year"
            :type="selectedYear === year ? 'primary' : ''"
            @click="scrollToYear(year)"
          >
            <el-icon><Calendar /></el-icon>
            {{ year }}年
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useArticles } from '@/composables/useArticles'
import {
  Calendar,
  Document,
  PriceTag,
  DataAnalysis,
  Clock,
} from '@element-plus/icons-vue'

const router = useRouter()
const { getArticles } = useArticles()

// 获取所有文章
const allArticles = computed(() => getArticles())

// 归档数据
const archiveData = computed(() => {
  const articles = allArticles.value
  if (!articles || articles.length === 0) return []

  // 按年月分组
  const archiveMap = {}

  articles.forEach(article => {
    const date = new Date(article.date)
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // 0-11 → 1-12
    const day = date.getDate()

    // 初始化年份数据
    if (!archiveMap[year]) {
      archiveMap[year] = {
        year,
        total: 0,
        months: {}
      }
    }

    // 初始化月份数据
    if (!archiveMap[year].months[month]) {
      archiveMap[year].months[month] = {
        month,
        count: 0,
        articles: []
      }
    }

    // 添加文章
    archiveMap[year].months[month].articles.push({
      ...article,
      day
    })
    archiveMap[year].months[month].count++
    archiveMap[year].total++
  })

  // 转换为数组并排序
  return Object.values(archiveMap)
    .sort((a, b) => b.year - a.year)
    .map(yearData => ({
      ...yearData,
      months: Object.values(yearData.months)
        .sort((a, b) => b.month - a.month)
        .map(monthData => ({
          ...monthData,
          articles: monthData.articles.sort((a, b) => new Date(b.date) - new Date(a.date))
        }))
    }))
})

// 统计信息
const totalArticles = computed(() => allArticles.value.length)

const years = computed(() => {
  return archiveData.value.map(item => item.year).sort((a, b) => b - a)
})

const totalTags = computed(() => {
  const tagSet = new Set()
  allArticles.value.forEach(article => {
    if (article.tags) {
      article.tags.forEach(tag => tagSet.add(tag))
    }
  })
  return tagSet.size
})

const mostActiveYear = computed(() => {
  if (archiveData.value.length === 0) return '-'
  const mostActive = archiveData.value.reduce((prev, current) =>
    prev.total > current.total ? prev : current
  )
  return mostActive.year
})

// 选中的年份（用于快速导航）
const selectedYear = ref(null)

// 格式化日期（仅显示日）
const formatDay = (dateString) => {
  const date = new Date(dateString)
  return date.getDate()
}

// 跳转到标签页面
const navigateToTag = (tag) => {
  router.push({
    path: '/tags',
    query: { tag }
  })
}

// 滚动到指定年份
const scrollToYear = (year) => {
  selectedYear.value = year
  const element = document.querySelector(`[data-year="${year}"]`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped lang="scss">
.archive {
  padding: var(--blog-spacing-md) 0;

  .archive-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--blog-spacing-md);
    margin-bottom: var(--blog-spacing-xl);

    .stat-item {
      text-align: center;
      padding: var(--blog-spacing-lg);
      background-color: var(--blog-bg-gray);
      border-radius: var(--blog-border-radius);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--blog-shadow);
      }

      .stat-value {
        font-size: 32px;
        font-weight: 600;
        color: var(--blog-primary-color);
        margin-bottom: var(--blog-spacing-xs);
      }

      .stat-label {
        font-size: 14px;
        color: var(--blog-text-secondary);
      }
    }
  }

  .archive-timeline {
    margin-bottom: var(--blog-spacing-xl);

    h3 {
      margin-bottom: var(--blog-spacing-lg);
      font-size: 18px;
      font-weight: 600;
    }

    .empty-state {
      text-align: center;
      padding: var(--blog-spacing-xl);
      color: var(--blog-text-secondary);
    }

    .timeline-container {
      .year-section {
        margin-bottom: var(--blog-spacing-xl);
        padding-left: var(--blog-spacing-lg);
        border-left: 2px solid var(--blog-border-color);
        position: relative;

        &::before {
          content: '';
          position: absolute;
          left: -6px;
          top: 0;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: var(--blog-primary-color);
        }

        .year-header {
          display: flex;
          align-items: center;
          margin-bottom: var(--blog-spacing-md);
          margin-left: -20px;

          h4 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            color: var(--blog-primary-color);
          }

          .year-count {
            margin-left: var(--blog-spacing-sm);
            color: var(--blog-text-secondary);
            font-size: 14px;
          }
        }

        .months-container {
          .month-section {
            margin-bottom: var(--blog-spacing-lg);

            .month-header {
              display: flex;
              align-items: center;
              margin-bottom: var(--blog-spacing-sm);

              h5 {
                margin: 0;
                font-size: 16px;
                font-weight: 500;
              }

              .month-count {
                margin-left: var(--blog-spacing-sm);
                color: var(--blog-text-secondary);
                font-size: 14px;
              }
            }

            .articles-list {
              .article-item {
                display: grid;
                grid-template-columns: 40px 1fr auto;
                align-items: center;
                gap: var(--blog-spacing-md);
                padding: var(--blog-spacing-sm) var(--blog-spacing-md);
                margin-bottom: var(--blog-spacing-xs);
                border-radius: var(--blog-border-radius);
                background-color: var(--blog-bg-gray);
                transition: all 0.3s ease;

                &:hover {
                  transform: translateX(4px);
                  box-shadow: var(--blog-shadow);
                }

                .article-date {
                  text-align: center;
                  font-weight: 600;
                  color: var(--blog-primary-color);
                }

                .article-title {
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

                  .tag {
                    cursor: pointer;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  .year-navigation {
    h3 {
      margin-bottom: var(--blog-spacing-lg);
      font-size: 18px;
      font-weight: 600;
    }

    .year-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: var(--blog-spacing-sm);
    }
  }
}
</style>
