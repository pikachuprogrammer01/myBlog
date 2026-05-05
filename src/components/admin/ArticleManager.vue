<template>
  <div class="article-manager">
    <div class="toolbar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索文章标题或内容..."
        clearable
        class="search-input"
        @input="onSearchInput"
      />
      <el-select v-model="statusFilter" placeholder="状态筛选" clearable class="status-select" @change="loadArticles">
        <el-option label="全部" value="" />
        <el-option label="已发布" value="published" />
        <el-option label="草稿" value="draft" />
      </el-select>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> 新建文章
      </el-button>
      <el-upload
        ref="uploadRef"
        accept=".md"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleImport"
      >
        <el-button :loading="importing">
          <el-icon><Upload /></el-icon> 导入 .md
        </el-button>
      </el-upload>
      <span class="article-count">共 {{ total }} 篇文章</span>
    </div>

    <el-table :data="articles" v-loading="loading" class="article-table">
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <a v-if="row.status === 'published'" :href="`/#/article/${row.slug}`" target="_blank" class="article-link">
            {{ row.title }}
          </a>
          <span v-else>{{ row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="category_name" label="分类" width="100">
        <template #default="{ row }">
          {{ row.category_name || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
            {{ row.status === 'published' ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="view_count" label="浏览" width="70" align="center" />
      <el-table-column prop="created_at" label="创建日期" width="110" align="center">
        <template #default="{ row }">
          {{ row.created_at ? new Date(row.created_at).toLocaleDateString('zh-CN') : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button size="small" :loading="exportingId === row.id" @click="handleExport(row)">
            <el-icon><Download /></el-icon>
          </el-button>
          <el-button size="small" type="danger" :loading="deletingId === row.id" @click="handleDelete(row)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadArticles"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑文章' : '新建文章'"
      width="800px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-loading="fetchingContent">
        <el-form :model="form" label-width="80px" class="article-form">
          <el-row :gutter="16">
            <el-col :span="16">
              <el-form-item label="标题">
                <el-input v-model="form.title" placeholder="文章标题" maxlength="200" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="状态">
                <el-select v-model="form.status" class="w-full">
                  <el-option label="草稿" value="draft" />
                  <el-option label="发布" value="published" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="Slug">
                <el-input v-model="form.slug" placeholder="URL 别名（留空自动生成）" maxlength="200" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="分类">
                <el-select v-model="form.category_id" filterable clearable placeholder="选择分类" class="w-full">
                  <el-option
                    v-for="cat in categories"
                    :key="cat.id"
                    :label="cat.name"
                    :value="cat.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="标签">
            <el-select
              v-model="form.tags"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="选择或输入标签"
              class="w-full"
            >
              <el-option
                v-for="tag in tagOptions"
                :key="tag.name"
                :label="tag.name"
                :value="tag.name"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="封面图">
            <el-input v-model="form.cover_image" placeholder="封面图 URL" />
          </el-form-item>
          <el-form-item label="摘要">
            <el-input v-model="form.summary" type="textarea" :rows="3" placeholder="文章摘要（可选）" maxlength="500" show-word-limit />
          </el-form-item>
          <el-form-item label="内容">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="16"
              placeholder="Markdown 内容"
              class="content-textarea"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { ElMessage } from 'element-plus'
import { errMsg } from '@/utils/error'
import { confirmThen } from '@/utils/confirm'
import { Plus, Edit, Delete, Upload, Download } from '@element-plus/icons-vue'
import {
  getAdminArticleList,
  getAdminArticle,
  createAdminArticle,
  updateAdminArticle,
  deleteAdminArticle,
  uploadArticleMd,
  getCategories,
  getTags,
} from '@/api/services/adminService'
import { exportArticle } from '@/utils/export-article'
import { useArticles } from '@/composables/useArticles'

const confirmBase = { appendTo: '#app', lockScroll: false }

const { invalidateCache } = useArticles()
const refreshAdminData = inject('refreshAdminData', null)

const loading = ref(false)
const saving = ref(false)
const importing = ref(false)
const exportingId = ref(null)
const deletingId = ref(null)
const fetchingContent = ref(false)

const articles = ref([])
const categories = ref([])
const tagOptions = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 8
const searchQuery = ref('')
const statusFilter = ref('')
let searchTimer = null

const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const form = ref({
  title: '',
  slug: '',
  content: '',
  summary: '',
  cover_image: '',
  category_id: null,
  tags: [],
  status: 'draft',
})

const uploadRef = ref(null)

function resetForm() {
  form.value = {
    title: '',
    slug: '',
    content: '',
    summary: '',
    cover_image: '',
    category_id: null,
    tags: [],
    status: 'draft',
  }
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadArticles()
  }, 400)
}

async function loadArticles() {
  loading.value = true
  try {
    const params = { page: currentPage.value, limit: pageSize }
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
    if (statusFilter.value) params.status = statusFilter.value
    const res = await getAdminArticleList(params)
    if (res.data.success) {
      articles.value = res.data.data
      total.value = res.data.pagination.total
    }
  } catch (error) {
    ElMessage.error('加载文章列表失败: ' + errMsg(error))
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const res = await getCategories()
    if (res.data.success) categories.value = res.data.data
  } catch {}
}

async function loadTagOptions() {
  try {
    const res = await getTags()
    if (res.data.success) tagOptions.value = res.data.data
  } catch {}
}

function openCreate() {
  resetForm()
  isEditing.value = false
  editingId.value = null
  dialogVisible.value = true
}

async function openEdit(row) {
  fetchingContent.value = true
  dialogVisible.value = true
  isEditing.value = true
  editingId.value = row.id
  resetForm()
  try {
    const res = await getAdminArticle(row.id)
    if (res.data.success) {
      const a = res.data.data
      form.value = {
        title: a.title || '',
        slug: a.slug || '',
        content: a.content || '',
        summary: a.summary || '',
        cover_image: a.cover_image || '',
        category_id: a.category_id || null,
        tags: typeof a.tags === 'string' ? JSON.parse(a.tags || '[]') : (a.tags || []),
        status: a.status || 'draft',
      }
    }
  } catch (error) {
    ElMessage.error('加载文章详情失败: ' + errMsg(error))
    dialogVisible.value = false
  } finally {
    fetchingContent.value = false
  }
}

async function handleSave() {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入文章标题')
    return
  }
  saving.value = true
  try {
    const data = { ...form.value, title: form.value.title.trim() }
    if (isEditing.value) {
      await updateAdminArticle(editingId.value, data)
      ElMessage.success('文章已更新')
    } else {
      await createAdminArticle(data)
      ElMessage.success('文章已创建')
    }
    dialogVisible.value = false
    await loadArticles()
    await loadTagOptions()
    invalidateCache()
    refreshAdminData?.()
  } catch (error) {
    ElMessage.error((isEditing.value ? '更新' : '创建') + '失败: ' + errMsg(error))
  } finally {
    saving.value = false
  }
}

async function handleImport(uploadFile) {
  importing.value = true
  try {
    const res = await uploadArticleMd(uploadFile.raw)
    if (res.data.success) {
      ElMessage.success(res.data.message || '文章已导入')
      await loadArticles()
      await loadTagOptions()
      invalidateCache()
      refreshAdminData?.()
    } else {
      ElMessage.error(res.data.message || '导入失败')
    }
  } catch (error) {
    ElMessage.error('导入失败: ' + errMsg(error))
  } finally {
    importing.value = false
    uploadRef.value?.clearFiles()
  }
}

async function handleExport(row) {
  exportingId.value = row.id
  ElMessage.info('正在生成导出文件...')
  try {
    const res = await getAdminArticle(row.id)
    if (res.data.success) {
      const a = res.data.data
      let content = '---\n'
      content += `title: "${a.title || ''}"\n`
      if (a.slug) content += `slug: "${a.slug}"\n`
      if (a.summary) content += `excerpt: "${a.summary}"\n`
      if (a.cover_image) content += `cover: "${a.cover_image}"\n`
      if (a.category_name) content += `categories:\n  - ${a.category_name}\n`
      const tags = typeof a.tags === 'string' ? JSON.parse(a.tags || '[]') : (a.tags || [])
      if (tags.length > 0) content += `tags:\n${tags.map((t) => `  - ${t}`).join('\n')}\n`
      content += '---\n\n' + (a.content || '')
      await exportArticle(a.title, a.slug, content)
      ElMessage.success('导出完成')
    }
  } catch (error) {
    ElMessage.error('导出失败: ' + errMsg(error))
  } finally {
    exportingId.value = null
  }
}

function handleDelete(row) {
  confirmThen(`确定要删除文章「${row.title}」吗？此操作不可恢复！`, "删除确认", "warning", async () => {
    deletingId.value = row.id
    try {
      await deleteAdminArticle(row.id)
      ElMessage.success('文章已删除')
      await loadArticles()
      invalidateCache()
      refreshAdminData?.()
    } catch (error) {
      ElMessage.error(errMsg(error, "删除失败: "))
    } finally {
      deletingId.value = null
    }
  })
}

onMounted(() => {
  loadArticles()
  loadCategories()
  loadTagOptions()
})
</script>

<style scoped lang="scss">
.article-manager {
  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: var(--blog-spacing-md);
    flex-wrap: wrap;

    .search-input {
      max-width: 260px;
    }

    .status-select {
      width: 110px;
    }

    .article-count {
      margin-left: auto;
      color: var(--blog-text-secondary);
      font-size: 14px;
    }
  }

  .article-table {
    .article-link {
      color: var(--blog-primary, #409eff);
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: center;
    margin-top: var(--blog-spacing-md);
  }

  .article-form {
    .w-full {
      width: 100%;
    }

    .content-textarea {
      :deep(.el-textarea__inner) {
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.6;
      }
    }
  }
}
</style>
