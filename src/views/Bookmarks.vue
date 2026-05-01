<template>
  <div class="bookmarks-container">
    <h1 class="blog-page-title">
      <el-icon><CollectionTag /></el-icon> 我的收藏
    </h1>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <el-empty v-else-if="bookmarks.length === 0" description="还没有收藏任何文章">
      <el-button type="primary" @click="$router.push('/')">去看看</el-button>
    </el-empty>

    <div v-else class="bookmarks-list">
      <div
        v-for="item in bookmarks"
        :key="item.id"
        class="blog-card bookmark-item"
        @click="$router.push(`/article/${item.slug || item.id}`)"
      >
        <div class="bookmark-cover" v-if="item.cover_image">
          <img :src="item.cover_image" :alt="item.title" />
        </div>
        <div class="bookmark-info">
          <h3 class="bookmark-title">{{ item.title }}</h3>
          <p class="bookmark-summary">{{ item.summary || '暂无摘要' }}</p>
          <div class="bookmark-meta">
            <el-tag
              v-for="tag in (item.tags || [])"
              :key="tag"
              size="small"
              class="bookmark-tag"
            >
              {{ tag }}
            </el-tag>
            <span class="bookmark-date">
              <el-icon><Calendar /></el-icon>
              收藏于 {{ formatDate(item.bookmarked_at) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { CollectionTag, Calendar } from '@element-plus/icons-vue'
import { useArticles } from '@/composables/useArticles'
import dayjs from 'dayjs'

const { getBookmarks } = useArticles()
const bookmarks = ref([])
const loading = ref(true)

const formatDate = (date) => {
  if (!date) return ''
  return dayjs(date).format('YYYY年MM月DD日 HH:mm')
}

onMounted(async () => {
  try {
    bookmarks.value = await getBookmarks()
  } catch {
    // keep empty
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.bookmarks-container {
  padding: var(--blog-spacing-md) 0;

  .loading-state {
    padding: var(--blog-spacing-xl) 0;
  }

  .bookmarks-list {
    display: flex;
    flex-direction: column;
    gap: var(--blog-spacing-md);
  }

  .bookmark-item {
    display: flex;
    gap: var(--blog-spacing-lg);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--blog-shadow);
    }

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  .bookmark-cover {
    flex-shrink: 0;
    width: 200px;
    height: 130px;
    border-radius: var(--blog-border-radius);
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    @media (max-width: 768px) {
      width: 100%;
      height: 180px;
    }
  }

  .bookmark-info {
    flex: 1;
    min-width: 0;

    .bookmark-title {
      margin: 0 0 var(--blog-spacing-xs);
      font-size: 18px;
      font-weight: 600;
      color: var(--blog-text-primary);
    }

    .bookmark-summary {
      margin: 0 0 var(--blog-spacing-sm);
      font-size: 14px;
      color: var(--blog-text-secondary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .bookmark-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--blog-spacing-xs);

      .bookmark-tag {
        cursor: default;
      }

      .bookmark-date {
        margin-left: auto;
        font-size: 12px;
        color: var(--blog-text-secondary);
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}
</style>
