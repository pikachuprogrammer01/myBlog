<template>
  <div class="blog-card">
    <div class="section-header">
      <h3>
        <el-icon><ChatDotRound /></el-icon> 评论管理
      </h3>
      <el-button
        type="danger"
        :disabled="selectedIds.length === 0"
        @click="handleBatchDelete"
      >
        批量删除 ({{ selectedIds.length }})
      </el-button>
    </div>

    <div class="toolbar">
      <el-input
        v-model="searchText"
        placeholder="搜索用户名、评论内容或文章标题"
        clearable
        :prefix-icon="Search"
        class="search-input"
      />
      <el-select
        v-model="articleFilter"
        placeholder="按文章筛选"
        clearable
        class="filter-select"
      >
        <el-option
          v-for="a in articleOptions"
          :key="a.slug"
          :label="a.title"
          :value="a.slug"
        />
      </el-select>
    </div>

    <el-table
      ref="tableRef"
      :data="filteredComments"
      stripe
      v-loading="loading"
      style="width: 100%"
      @sort-change="handleSortChange"
      @selection-change="onSelectionChange"
      :default-sort="{ prop: 'created_at', order: 'descending' }"
    >
      <el-table-column type="selection" width="40" align="center" />
      <el-table-column prop="username" label="用户" width="120" sortable="custom" />
      <el-table-column prop="content" label="评论内容" min-width="200" sortable="custom">
        <template #default="{ row }">
          <el-tooltip :content="row.content" placement="top" :show-after="400">
            <div class="comment-content">{{ row.content }}</div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="articleTitle" label="所属文章" width="160" sortable="custom">
        <template #default="{ row }">
          <el-tooltip :content="row.articleTitle" placement="top" :show-after="400">
            <router-link
              v-if="row.articleSlug"
              :to="`/article/${row.articleSlug}`"
              class="article-link"
            >
              {{ row.articleTitle }}
            </router-link>
            <span v-else>{{ row.articleTitle || '-' }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="时间" width="170" sortable="custom" align="center">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="danger" size="small" plain @click="handleDelete(row.id)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="totalPages > 1" class="pagination-wrap">
      <el-pagination
        v-model:current-page="page"
        :page-size="limit"
        :total="total"
        :pager-count="5"
        layout="prev, pager, next"
        @current-change="loadComments"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Search } from '@element-plus/icons-vue'
import { getAdminComments } from '@/api/services/adminService'

const emit = defineEmits(['delete', 'batchDelete'])

const tableRef = ref(null)
const searchText = ref('')
const articleFilter = ref('')
const selectedIds = ref([])
const sortKey = ref('created_at')
const sortOrder = ref('descending')
const loading = ref(false)

const comments = ref([])
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const totalPages = ref(0)

function onSelectionChange(rows) {
  selectedIds.value = rows.map((r) => r.id)
}

const articleOptions = computed(() => {
  const seen = new Set()
  return comments.value
    .filter((c) => c.articleSlug && !seen.has(c.articleSlug) && seen.add(c.articleSlug))
    .map((c) => ({ title: c.articleTitle, slug: c.articleSlug }))
})

const filteredComments = computed(() => {
  let list = [...comments.value]

  const kw = searchText.value.toLowerCase().trim()
  if (kw) {
    list = list.filter((c) =>
      (c.username || '').toLowerCase().includes(kw) ||
      (c.content || '').toLowerCase().includes(kw) ||
      (c.articleTitle || '').toLowerCase().includes(kw)
    )
  }

  if (articleFilter.value) {
    list = list.filter((c) => c.articleSlug === articleFilter.value)
  }

  list.sort((a, b) => {
    const va = a[sortKey.value] ?? ''
    const vb = b[sortKey.value] ?? ''
    const cmp = typeof va === 'string' ? va.localeCompare(String(vb)) : va - vb
    return sortOrder.value === 'ascending' ? cmp : -cmp
  })

  return list
})

function handleSortChange({ prop, order }) {
  if (prop) {
    sortKey.value = prop
    sortOrder.value = order || 'ascending'
  }
}

async function loadComments() {
  loading.value = true
  try {
    const res = await getAdminComments({ page: page.value, limit: limit.value })
    if (res.data.success) {
      comments.value = res.data.data.map((c) => ({
        ...c,
        username: c.username || c.user_id,
        articleTitle: c.article_title,
        articleSlug: c.article_slug,
      }))
      total.value = res.data.pagination.total
      totalPages.value = res.data.pagination.totalPages
    }
  } catch (error) {
    ElMessage.error('加载评论列表失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

function handleDelete(id) {
  emit('delete', id)
}

function handleBatchDelete() {
  emit('batchDelete', [...selectedIds.value])
  selectedIds.value = []
  tableRef.value?.clearSelection()
}

function formatTime(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

defineExpose({ comments, loadComments })

onMounted(() => {
  loadComments()
})
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
  }
}

.toolbar {
  display: flex;
  gap: var(--blog-spacing-md);
  margin-bottom: var(--blog-spacing-md);

  .search-input {
    flex: 1;
    max-width: 360px;
  }

  .filter-select {
    width: 200px;
  }
}

.comment-content {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: var(--blog-spacing-md);
}

:deep(.el-table__row) {
  cursor: pointer;
}
</style>
