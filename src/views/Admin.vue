<template>
  <div class="admin">
    <h1 class="blog-page-title">
      <el-icon><Setting /></el-icon>
      管理后台
    </h1>
    <div v-if="!isAdmin" class="permission-denied">
      <div class="blog-card">
        <el-result
          icon="warning"
          title="权限不足"
          sub-title="您没有管理员权限，无法访问此页面"
        >
          <template #extra>
            <el-button type="primary" @click="$router.push('/')">
              返回首页
            </el-button>
          </template>
        </el-result>
      </div>
    </div>
    <div v-else class="admin-dashboard">
      <!-- 数据概览 -->
      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalArticles }}</div>
            <div class="stat-label">文章总数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalComments }}</div>
            <div class="stat-label">评论总数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <div class="stat-label">用户总数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon><View /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalViews }}</div>
            <div class="stat-label">总阅读量</div>
          </div>
        </div>
      </div>

      <!-- 评论管理 -->
      <div class="blog-card">
        <div class="section-header">
          <h3>
            <el-icon><ChatDotRound /></el-icon>
            评论管理
          </h3>
          <el-button type="danger" :disabled="selectedComments.length === 0" @click="batchDeleteComments">
            批量删除 ({{ selectedComments.length }})
          </el-button>
        </div>

        <div v-if="comments.length === 0" class="empty-state">
          <p>暂无评论数据</p>
        </div>
        <div v-else>
          <el-table
            :data="comments"
            @selection-change="handleSelectionChange"
            style="width: 100%"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="articleId" label="文章ID" width="120" />
            <el-table-column prop="username" label="用户" width="120">
              <template #default="{ row }">
                <el-tag size="small">
                  {{ row.username }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="评论内容" min-width="200">
              <template #default="{ row }">
                <div class="comment-content">
                  {{ row.content }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="评论时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="danger" size="small" @click="deleteComment(row.id)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 用户管理 -->
      <div class="blog-card">
        <div class="section-header">
          <h3>
            <el-icon><User /></el-icon>
            用户管理
          </h3>
        </div>

        <div v-if="users.length === 0" class="empty-state">
          <p>暂无用户数据</p>
        </div>
        <div v-else>
          <el-table :data="users" style="width: 100%">
            <el-table-column prop="id" label="用户ID" width="100" />
            <el-table-column prop="username" label="用户名" width="150" />
            <el-table-column prop="role" label="角色" width="100">
              <template #default="{ row }">
                <el-tag :type="row.role === 'admin' ? 'danger' : ''" size="small">
                  {{ row.role === 'admin' ? '管理员' : '普通用户' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="注册时间" width="180">
              <template #default="{ row }">
                {{ row.createdAt ? formatDate(row.createdAt) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button
                  v-if="row.role !== 'admin'"
                  link
                  size="small"
                  @click="promoteToAdmin(row.id)"
                >
                  设为管理员
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 数据操作 -->
      <div class="blog-card">
        <div class="section-header">
          <h3>
            <el-icon><DataAnalysis /></el-icon>
            数据操作
          </h3>
        </div>
        <div class="data-actions">
          <el-button type="primary" @click="exportData">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
          <el-button type="warning" @click="clearAllComments">
            <el-icon><Delete /></el-icon>
            清空所有评论
          </el-button>
          <el-button type="danger" @click="resetAllData">
            <el-icon><Refresh /></el-icon>
            重置所有数据
          </el-button>
        </div>
        <div class="warning-hint">
          <el-alert
            title="警告"
            type="warning"
            :closable="false"
            description="数据操作不可逆，请谨慎操作。所有数据仅在当前浏览器有效。"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, ChatDotRound, User, View, Download, Delete, Refresh, Setting, DataAnalysis } from '@element-plus/icons-vue'
import { useAuth } from '@/composables/useAuth'
import { useComments } from '@/composables/useComments'
import { useArticles } from '@/composables/useArticles'
import { formatDate } from '@/utils/date'

const { getCurrentUser } = useAuth()
const { getComments, deleteComment: deleteCommentApi } = useComments()
const { getArticles } = useArticles()

// 权限检查
const currentUser = computed(() => getCurrentUser())
const isAdmin = computed(() => currentUser.value?.role === 'admin')

// 数据
const comments = ref([])
const selectedComments = ref([])
const users = ref([])

// 统计数据
const stats = ref({
  totalArticles: 0,
  totalComments: 0,
  totalUsers: 0,
  totalViews: 0
})

// 加载数据
const loadData = () => {
  if (!isAdmin.value) return

  // 加载评论
  const allComments = getComments()
  comments.value = allComments.filter(comment => !comment.isDeleted)

  // 模拟用户数据
  users.value = [
    { id: '1', username: 'admin', role: 'admin', createdAt: Date.now() - 86400000 * 30 },
    { id: '2', username: 'user1', role: 'user', createdAt: Date.now() - 86400000 * 7 },
    { id: '3', username: 'user2', role: 'user', createdAt: Date.now() - 86400000 * 3 }
  ]

  // 计算统计
  stats.value = {
    totalArticles: getArticles().length,
    totalComments: allComments.length,
    totalUsers: users.value.length,
    totalViews: 0 // 实际应从localStorage计算
  }
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedComments.value = selection.map(item => item.id)
}

// 删除单条评论
const deleteComment = async (commentId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条评论吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 实际调用删除接口
    const success = deleteCommentApi(commentId)
    if (success) {
      ElMessage.success('评论已删除')
      loadData()
    } else {
      ElMessage.error('删除失败')
    }
  } catch (error) {
    // 用户取消删除
  }
}

// 批量删除评论
const batchDeleteComments = async () => {
  if (selectedComments.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedComments.value.length} 条评论吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 批量删除
    let successCount = 0
    selectedComments.value.forEach(commentId => {
      const success = deleteCommentApi(commentId)
      if (success) successCount++
    })

    ElMessage.success(`成功删除 ${successCount} 条评论`)
    selectedComments.value = []
    loadData()
  } catch (error) {
    // 用户取消删除
  }
}

// 设为管理员
const promoteToAdmin = (userId) => {
  ElMessageBox.confirm(
    '确定要将此用户设为管理员吗？',
    '管理员设置确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 实际应用中应调用API更新用户角色
    ElMessage.success('用户角色已更新')
    loadData()
  }).catch(() => {
    // 取消
  })
}

// 导出数据
const exportData = () => {
  const data = {
    comments: comments.value,
    users: users.value,
    stats: stats.value,
    exportTime: new Date().toISOString()
  }

  const dataStr = JSON.stringify(data, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = `blog-data-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success('数据导出成功')
}

// 清空所有评论
const clearAllComments = () => {
  ElMessageBox.confirm(
    '确定要清空所有评论吗？此操作不可恢复！',
    '清空确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(() => {
    // 实际清空评论逻辑
    localStorage.removeItem('blog_comments')
    ElMessage.success('所有评论已清空')
    loadData()
  }).catch(() => {
    // 取消
  })
}

// 重置所有数据
const resetAllData = () => {
  ElMessageBox.confirm(
    '确定要重置所有数据吗？这将删除所有用户、评论等数据，恢复为初始状态！',
    '重置确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(() => {
    // 实际重置逻辑
    localStorage.removeItem('blog_comments')
    localStorage.removeItem('blog_auth_token')
    localStorage.removeItem('blog_users')
    ElMessage.success('所有数据已重置')
    loadData()
  }).catch(() => {
    // 取消
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.admin {
  padding: var(--blog-spacing-md) 0;

  .permission-denied {
    max-width: 600px;
    margin: 0 auto;
  }

  .admin-dashboard {
    .dashboard-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--blog-spacing-md);
      margin-bottom: var(--blog-spacing-lg);

      .stat-card {
        display: flex;
        align-items: center;
        padding: var(--blog-spacing-lg);
        background-color: var(--blog-bg-gray);
        border-radius: var(--blog-border-radius);
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: var(--blog-shadow);
        }

        .stat-icon {
          margin-right: var(--blog-spacing-md);
          font-size: 24px;
          color: var(--blog-primary-color);
        }

        .stat-content {
          .stat-value {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: var(--blog-spacing-xs);
          }

          .stat-label {
            font-size: 14px;
            color: var(--blog-text-secondary);
          }
        }
      }
    }

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

    .comment-content {
      max-height: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .empty-state {
      text-align: center;
      padding: var(--blog-spacing-xl);
      color: var(--blog-text-secondary);
    }

    .data-actions {
      display: flex;
      gap: var(--blog-spacing-md);
      margin-bottom: var(--blog-spacing-md);
    }

    .warning-hint {
      margin-top: var(--blog-spacing-md);
    }
  }
}
</style>