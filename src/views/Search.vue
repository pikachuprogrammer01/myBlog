<template>
  <div class="search">
    <h1 class="blog-page-title">
      <el-icon><Search /></el-icon>
      搜索文章
    </h1>
    <div class="blog-card">
      <!-- 搜索框 -->
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="请输入关键词搜索文章..."
          size="large"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
          </template>
        </el-input>
        <div class="search-hint">
          <p>支持搜索文章标题、内容、标签等</p>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0" class="search-results">
        <div class="results-header">
          <h3>
            <el-icon><Document /></el-icon>
            搜索结果 ({{ searchResults.length }}篇)
          </h3>
          <el-button v-if="searchKeyword" link @click="clearSearch">
            <el-icon><Close /></el-icon>
            清除搜索
          </el-button>
        </div>

        <div class="results-list">
          <div
            v-for="article in searchResults"
            :key="article.id"
            class="article-item"
          >
            <router-link :to="`/article/${article.id}`" class="article-title">
              <el-icon><Document /></el-icon>
              {{ article.title }}
            </router-link>
            <div class="article-meta">
              <span class="article-date">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(article.date) }}
              </span>
              <span class="article-tags">
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
              </span>
            </div>
            <div class="article-excerpt">
              {{ article.excerpt }}
            </div>
          </div>
        </div>
      </div>

      <!-- 无搜索结果 -->
      <div v-else-if="searchKeyword && !searching" class="no-results">
        <div class="empty-state">
          <el-icon :size="60"><Search /></el-icon>
          <p>未找到包含 "{{ searchKeyword }}" 的文章</p>
          <el-button type="primary" @click="clearSearch">
            <el-icon><List /></el-icon>
            查看所有文章
          </el-button>
        </div>
      </div>

      <!-- 热门搜索 -->
      <div class="popular-searches">
        <h3>
          <el-icon><List /></el-icon>
          热门搜索
        </h3>
        <div class="popular-tags">
          <el-tag
            v-for="tag in popularTags"
            :key="tag"
            class="popular-tag"
            @click="searchByTag(tag)"
          >
            <el-icon><PriceTag /></el-icon>
            {{ tag }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from "vue";
import { useArticles } from "@/composables/useArticles";
import { useRoute, useRouter } from "vue-router";
import {
  Search,
  Document,
  Calendar,
  PriceTag,
  Close,
  List,
} from "@element-plus/icons-vue";
import { formatDate } from "@/utils/date";

const route = useRoute();
const router = useRouter();
const { searchArticles, getPopularTags } = useArticles();

const searchKeyword = ref("");
const searching = ref(false);
const searchResults = ref([]);
let searchTimer = null;

// 从路由参数获取搜索关键词
watch(
  () => route.query.q,
  (newQuery) => {
    const keyword = typeof newQuery === "string" ? newQuery : "";
    searchKeyword.value = keyword;

    if (keyword.trim()) {
      performSearch(keyword);
    } else {
      searchResults.value = [];
    }
  },
  { immediate: true },
);

const popularTags = computed(() => {
  const tags = getPopularTags();
  return Array.isArray(tags) ? tags.slice(0, 10).map((tag) => tag.tag) : [];
});

// 执行搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    return;
  }

  // 更新URL参数
  router.push({
    path: "/search",
    query: { q: searchKeyword.value.trim() },
  });
};

// 执行搜索逻辑
async function performSearch(keyword) {
  searching.value = true;
  try {
    const results = searchArticles(keyword);
    searchResults.value = results || [];
  } catch (error) {
    console.error("搜索失败:", error);
    searchResults.value = [];
  } finally {
    searching.value = false;
  }
}

// 通过标签搜索
const searchByTag = (tag) => {
  searchKeyword.value = tag;
  handleSearch();
};

// 跳转到标签页面
const navigateToTag = (tag) => {
  router.push(`/tags?tag=${encodeURIComponent(tag)}`);
};

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = "";
  searchResults.value = [];
  router.push({ path: "/search" });
};

watch(searchKeyword, (keyword) => {
  if (keyword.trim() === (route.query.q || "")) {
    return;
  }

  clearTimeout(searchTimer);
  if (!keyword.trim()) {
    return;
  }

  searchTimer = setTimeout(() => {
    router.replace({
      path: "/search",
      query: { q: keyword.trim() },
    });
  }, 300);
});

onUnmounted(() => {
  clearTimeout(searchTimer);
});
</script>

<style scoped lang="scss">
.search {
  padding: var(--blog-spacing-md) 0;

  .blog-page-title {
    display: flex;
    align-items: center;
    gap: var(--blog-spacing-sm);

    .el-icon {
      color: var(--blog-primary-color);
    }
  }

  .search-box {
    margin-bottom: var(--blog-spacing-xl);

    .search-hint {
      margin-top: var(--blog-spacing-sm);
      color: var(--blog-text-secondary);
      font-size: 14px;
    }
  }

  .search-results {
    margin-bottom: var(--blog-spacing-xl);

    .results-header {
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

    .results-list {
      display: flex;
      flex-direction: column;
      gap: var(--blog-spacing-lg);
    }

    .article-item {
      padding: var(--blog-spacing-md);
      border-radius: var(--blog-border-radius);
      background-color: var(--blog-bg-gray);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--blog-shadow);
      }

      .article-title {
        display: flex;
        align-items: center;
        gap: var(--blog-spacing-xs);
        font-size: 18px;
        font-weight: 600;
        margin-bottom: var(--blog-spacing-sm);
        color: var(--blog-text-primary);
        text-decoration: none;

        &:hover {
          color: var(--blog-primary-color);
          text-decoration: underline;
        }

        .el-icon {
          font-size: 16px;
          color: var(--blog-info-color);
        }
      }

      .article-meta {
        display: flex;
        align-items: center;
        gap: var(--blog-spacing-md);
        margin-bottom: var(--blog-spacing-sm);
        font-size: 14px;
        color: var(--blog-text-secondary);

        .article-date {
          display: flex;
          align-items: center;
          gap: 4px;

          .el-icon {
            font-size: 12px;
            color: var(--blog-info-color);
          }
        }

        .article-tags {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;

          .tag {
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 3px;

            .el-icon {
              font-size: 12px;
            }
          }
        }
      }

      .article-excerpt {
        line-height: 1.6;
        color: var(--blog-text-secondary);
      }
    }
  }

  .no-results {
    margin-bottom: var(--blog-spacing-xl);

    .empty-state {
      text-align: center;
      padding: var(--blog-spacing-xl);
      color: var(--blog-text-secondary);

      .el-icon {
        margin-bottom: var(--blog-spacing-md);
        color: var(--blog-border-color);
      }

      p {
        margin-bottom: var(--blog-spacing-md);
        font-size: 16px;
      }

      .el-button {
        display: inline-flex;
        align-items: center;
        gap: var(--blog-spacing-xs);
      }
    }
  }

  .popular-searches {
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

    .popular-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--blog-spacing-sm);
    }

    .popular-tag {
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
        font-size: 12px;
      }
    }
  }
}
</style>
