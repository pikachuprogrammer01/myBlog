<template>
  <div class="tags-container">
    <div class="blog-card stats-overview">
      <div class="stat-item">
        <span class="label">标签总数</span>
        <span class="value">{{ allTags.length }}</span>
      </div>
      <el-divider direction="vertical" />
      <div class="stat-item">
        <span class="label">文章总数</span>
        <span class="value">{{ allArticles.length }}</span>
      </div>
    </div>

    <div class="blog-card tag-cloud-card">
      <h3 class="section-title">
        <el-icon><DataAnalysis /></el-icon> 智能标签云
      </h3>
      <div class="cloud-wrapper">
        <el-tag
          v-for="tag in popularTags"
          :key="tag.tag"
          class="interactive-tag"
          :class="{ 'is-active': selectedTag === tag.tag }"
          :style="{ backgroundColor: getTagColor(tag.count), borderColor: getTagColor(tag.count), color: '#fff' }"
          @click="selectTag(tag.tag)"
        >
          <el-icon><PriceTag /></el-icon>
          {{ tag.tag }}
          <span class="count-badge">{{ tag.count }}</span>
        </el-tag>
      </div>
    </div>

    <transition name="el-zoom-in-top">
      <div v-if="selectedTag" class="selected-tag-section">
        <div class="blog-card list-card">
          <div class="list-header">
            <div class="current-tag">
              <el-icon><CollectionTag /></el-icon>
              正在查看：<span class="highlight">{{ selectedTag }}</span>
            </div>
            <el-button link type="primary" @click="clearSelectedTag">
              <el-icon><Close /></el-icon> 清除筛选
            </el-button>
          </div>

          <el-table :data="filteredArticles" class="custom-table" stripe>
            <el-table-column prop="title" label="文章标题">
              <template #default="{ row }">
                <router-link
                  :to="`/article/${row.id}`"
                  class="article-title-link"
                >
                  {{ row.title }}
                </router-link>
              </template>
            </el-table-column>
            <el-table-column
              prop="date"
              label="发布日期"
              width="150"
              align="center"
            >
              <template #default="{ row }">
                <span class="date-text">{{ formatDate(row.date) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </transition>

    <div class="blog-card statistics-card">
      <h3 class="section-title">
        <el-icon><TrendCharts /></el-icon> 标签热度分布
      </h3>
      <div class="stats-grid">
        <div v-for="tag in allTags" :key="tag.tag" class="stat-bar-item">
          <div class="bar-info">
            <span class="name">{{ tag.tag }}</span>
            <span class="percent">{{ tag.count }} 篇</span>
          </div>
          <el-progress
            :percentage="getTagPercentage(tag.count)"
            :color="customColors"
            :stroke-width="8"
            striped
            striped-flow
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useArticles } from "@/composables/useArticles";
import { getTags } from "@/api/services/articleService";
import { formatDate } from "@/utils/date";
import {
  PriceTag,
  DataAnalysis,
  Close,
  CollectionTag,
  TrendCharts,
} from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();
const { getPopularTags, getArticlesByTag, getArticles } = useArticles();

const apiTags = ref(null); // null=loading, []=API failed, [...] = success
const tagLoading = ref(true);

async function loadTags() {
  tagLoading.value = true;
  try {
    const res = await getTags();
    if (res.data.success) {
      apiTags.value = res.data.data;
    } else {
      apiTags.value = [];
    }
  } catch {
    apiTags.value = []; // API failed, use store fallback
  } finally {
    tagLoading.value = false;
  }
}

const selectedTag = computed(() =>
  typeof route.query.tag === "string" ? route.query.tag : "",
);

const popularTags = computed(() => {
  if (apiTags.value && apiTags.value.length > 0) {
    return apiTags.value.filter((t) => t.articleCount > 0).slice(0, 10).map((t) => ({ tag: t.name, count: t.articleCount }));
  }
  // Still loading — avoid flashing store data that will change
  if (tagLoading.value) return [];
  // API failed or returned empty — use store fallback
  return getPopularTags();
});

const allArticles = computed(() => getArticles());

const allTags = computed(() => {
  if (apiTags.value && apiTags.value.length > 0) {
    return apiTags.value.map((t) => ({ tag: t.name, count: t.articleCount }));
  }
  // Still loading
  if (tagLoading.value) return [];
  // API failed — use store fallback
  const tagCount = {};
  allArticles.value.forEach((article) => {
    article.tags?.forEach((tag) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });
  return Object.entries(tagCount)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
});

const filteredArticles = computed(() =>
  selectedTag.value ? getArticlesByTag(selectedTag.value) : [],
);

const tagColors = [
  '#409eff', // 蓝色
  '#67c23a', // 绿色
  '#e6a23c', // 橙色
  '#f56c6c', // 红色
  '#9b59b6', // 紫色
  '#1abc9c', // 青色
];

const getTagColor = (count) => {
  const max = Math.max(...allTags.value.map((t) => t.count), 1);
  const ratio = count / max;
  // 按百分比分配颜色：低热度蓝色 -> 高热度红色
  const idx = Math.min(Math.floor(ratio * (tagColors.length - 1)), tagColors.length - 1);
  return tagColors[idx];
};

const getTagPercentage = (count) => {
  const max = Math.max(...allTags.value.map((t) => t.count), 1);
  return Math.round((count / max) * 100);
};

const customColors = [
  { color: "#909399", percentage: 20 },
  { color: "#409eff", percentage: 40 },
  { color: "#67c23a", percentage: 60 },
  { color: "#e6a23c", percentage: 80 },
  { color: "#f56c6c", percentage: 100 },
];

const selectTag = (tag) => {
  router.push({
    path: "/tags",
    query: { tag },
  });
};

const clearSelectedTag = () => {
  router.push("/tags");
};

onMounted(() => {
  loadTags();
});
</script>

<style scoped lang="scss">
.tags-container {
  padding: 20px 0;

  // 1. 数据概览卡片
  .stats-overview {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px !important;
    margin-bottom: 25px;
    gap: 40px;

    .stat-item {
      text-align: center;
      .label {
        color: #909399;
        font-size: 14px;
        margin-right: 8px;
      }
      .value {
        color: var(--el-color-primary);
        font-size: 24px;
        font-weight: bold;
      }
    }
  }

  // 2. 标签云
  .tag-cloud-card {
    padding: 30px !important;
    margin-bottom: 25px;

    .cloud-wrapper {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      justify-content: center;
    }

    .interactive-tag {
      height: 40px;
      padding: 0 20px;
      border-radius: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid transparent;

      &:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
      }

      &.is-active {
        background: var(--el-color-primary);
        color: white;
        border-color: var(--el-color-primary);
        .count-badge {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }
      }

      .count-badge {
        background: #f0f2f5;
        color: #909399;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 12px;
        transition: all 0.3s;
      }
    }
  }

  // 3. 筛选列表
  .list-card {
    margin-bottom: 25px;
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #f0f2f5;
      margin-bottom: 10px;

      .current-tag {
        font-size: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        .highlight {
          color: var(--el-color-primary);
          font-weight: bold;
        }
      }
    }

    .article-title-link {
      color: var(--el-text-color-primary);
      text-decoration: none;
      font-weight: 500;
      &:hover {
        color: var(--el-color-primary);
      }
    }

    .date-text {
      color: #909399;
      font-size: 13px;
    }
  }

  // 4. 统计统计
  .statistics-card {
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 30px;
      margin-top: 20px;
    }

    .stat-bar-item {
      .bar-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
        .name {
          font-weight: bold;
        }
        .percent {
          color: #909399;
        }
      }
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    margin-top: 0;
    margin-bottom: 25px;
    color: var(--el-text-color-primary);

    .el-icon {
      color: var(--el-color-primary);
    }
  }
}
</style>
