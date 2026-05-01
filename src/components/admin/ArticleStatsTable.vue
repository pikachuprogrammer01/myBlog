<template>
  <div class="blog-card">
    <div class="section-header">
      <h3>
        <el-icon><DataAnalysis /></el-icon> 文章数据明细
      </h3>
      <div class="header-actions">
        <span class="article-count">共 {{ articles.length }} 篇</span>
        <el-button
          v-if="zeroStatCount > 0"
          size="small"
          @click="showZeroStats = !showZeroStats"
        >
          {{ showZeroStats ? '收起' : '展开' }}零数据文章 ({{ zeroStatCount }})
        </el-button>
      </div>
    </div>

    <el-table
      :data="filteredArticles"
      stripe
      style="width: 100%"
      @sort-change="handleSortChange"
      :default-sort="{ prop: 'view_count', order: 'descending' }"
    >
      <el-table-column prop="title" label="文章标题" min-width="200" sortable="custom">
        <template #default="{ row }">
          <el-tooltip :content="row.title" placement="top" :show-after="400">
            <a v-if="row.slug" :href="`/#/article/${row.slug}`" target="_blank" class="article-link">{{ row.title }}</a>
            <span v-else>{{ row.title }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80" sortable="custom" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
            {{ row.status === 'published' ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="view_count" label="浏览" width="80" sortable="custom" align="center" />
      <el-table-column prop="likes" label="点赞" width="70" sortable="custom" align="center" />
      <el-table-column prop="comments" label="评论" width="70" sortable="custom" align="center" />
      <el-table-column prop="bookmarks" label="收藏" width="70" sortable="custom" align="center" />
      <el-table-column prop="created_at" label="发布日期" width="110" sortable="custom" align="center">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { DataAnalysis } from '@element-plus/icons-vue'

const props = defineProps({
  articles: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['sort-change'])

const showZeroStats = ref(false)

function isZeroStat(a) {
  return (a.view_count || 0) === 0 && (a.likes || 0) === 0 && (a.comments || 0) === 0 && (a.bookmarks || 0) === 0
}

const zeroStatCount = computed(() => props.articles.filter(isZeroStat).length)

const filteredArticles = computed(() => {
  if (showZeroStats.value) return props.articles
  return props.articles.filter((a) => !isZeroStat(a))
})

function handleSortChange(sort) {
  emit('sort-change', sort)
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--blog-spacing-md);

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--blog-spacing-md);
  }

  .article-count {
    font-size: 14px;
    color: var(--blog-text-secondary);
  }
}

.article-link {
  color: var(--blog-primary-color);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;

  &:hover {
    text-decoration: underline;
  }
}
</style>
