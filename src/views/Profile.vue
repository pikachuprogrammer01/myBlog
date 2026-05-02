<template>
  <div class="profile">
    <h1 class="blog-page-title">
      <el-icon><User /></el-icon>
      用户中心
    </h1>
    <div class="profile-container">
      <!-- 用户信息卡片 -->
      <div class="blog-card user-info-card">
        <div class="user-header">
          <div class="user-avatar">
            <el-avatar :size="80" :src="userAvatar" />
          </div>
          <div class="user-details">
            <h2>{{ user?.username }}</h2>
            <div class="user-meta">
              <span class="user-role">{{ roleText }}</span>
              <span class="user-id">ID: {{ user?.username }}</span>
            </div>
          </div>
        </div>

        <div class="user-stats">
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ myComments.length }}</div>
              <div class="stat-label">我的评论</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ registrationDays }}</div>
              <div class="stat-label">注册天数</div>
            </div>
          </div>
        </div>

        <div class="user-actions">
          <el-button type="primary" @click="handleLogout">
            退出登录
          </el-button>
        </div>
      </div>

      <!-- 我的评论 -->
      <div class="blog-card my-comments-card">
        <h3>
          <el-icon><ChatDotRound /></el-icon>
          我的评论
        </h3>
        <div v-if="myComments.length === 0" class="empty-state">
          <p>暂无评论</p>
          <el-button type="primary" @click="$router.push('/')">
            去发表评论
          </el-button>
        </div>
        <div v-else>
          <el-table :data="myComments" style="width: 100%">
            <el-table-column prop="articleTitle" label="文章标题" min-width="200">
              <template #default="{ row }">
                <router-link :to="`/article/${row.articleId}`">
                  {{ row.articleTitle }}
                </router-link>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="评论内容" />
            <el-table-column prop="createdAt" label="评论时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import { useAuth } from '@/composables/useAuth'
import { useArticles } from '@/composables/useArticles'
import { formatDate } from '@/utils/date'
import { getProfile } from '@/api/services/authService'
import { User, ChatDotRound, Calendar } from '@element-plus/icons-vue'

const router = useRouter()
const { currentUser: user, logout } = useAuth()
const { getArticle } = useArticles()
const myComments = ref([])

const userAvatar = computed(() => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.value?.username}`
})

const roleText = computed(() => {
  return user.value?.role === 'admin' ? '管理员' : '普通用户'
})

const registrationDays = computed(() => {
  if (!user.value?.created_at) return 1
  const createdAt = new Date(user.value.created_at).getTime()
  const diff = Math.ceil((Date.now() - createdAt) / 86400000)
  return Math.max(diff, 1)
})

async function loadProfile() {
  try {
    const res = await getProfile()
    if (res.data.success) {
      const data = res.data.data
      myComments.value = (data.comments || []).map(c => ({
        id: c.id,
        articleId: c.article_slug || c.article_id,
        articleTitle: c.article_title,
        content: c.content,
        createdAt: c.created_at,
      }))
    }
  } catch {
    // ignore
  }
}

const handleLogout = () => {
  ElMessageBox.confirm("确定要退出登录吗？", "退出确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    })
    .catch(() => {})
}

onMounted(() => {
  if (!user.value) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  loadProfile()
})
</script>

<style scoped lang="scss">
.profile {
  padding: var(--blog-spacing-md) 0;

  .profile-container {
    display: grid;
    gap: var(--blog-spacing-lg);

    @media (min-width: 768px) {
      grid-template-columns: 1fr 2fr;
    }
  }

  .user-info-card {
    .user-header {
      display: flex;
      align-items: center;
      margin-bottom: var(--blog-spacing-lg);

      .user-avatar {
        margin-right: var(--blog-spacing-md);
      }

      .user-details {
        h2 {
          margin: 0 0 var(--blog-spacing-xs);
          font-size: 24px;
          font-weight: 600;
        }

        .user-meta {
          display: flex;
          gap: var(--blog-spacing-md);
          color: var(--blog-text-secondary);

          .user-role {
            color: var(--blog-primary-color);
            font-weight: 500;
          }
        }
      }
    }

    .user-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--blog-spacing-md);
      margin-bottom: var(--blog-spacing-lg);

      .stat-item {
        display: flex;
        align-items: center;
        padding: var(--blog-spacing-md);
        background-color: var(--blog-bg-gray);
        border-radius: var(--blog-border-radius);
        text-align: left;

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          margin-right: var(--blog-spacing-sm);
          border-radius: 50%;
          background-color: var(--blog-primary-light);
          color: var(--blog-primary-color);

          .el-icon {
            font-size: 16px;
          }
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--blog-primary-color);
        }

        .stat-label {
          font-size: 12px;
          color: var(--blog-text-secondary);
          margin-top: var(--blog-spacing-xs);
        }
      }
    }

    .user-actions {
      text-align: center;
    }
  }

  .my-comments-card {
    h3 {
      margin-bottom: var(--blog-spacing-md);
      font-size: 18px;
      font-weight: 600;
    }

    .empty-state {
      text-align: center;
      padding: var(--blog-spacing-xl) 0;

      p {
        margin-bottom: var(--blog-spacing-md);
        color: var(--blog-text-secondary);
      }
    }
  }
}
</style>
