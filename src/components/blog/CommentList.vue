<template>
  <div class="comment-list" ref="commentListRef">
    <!-- 评论统计 -->
    <div class="comment-stats">
      <div class="stats-header">
        <h3 class="stats-title">
          <el-icon><ChatDotRound /></el-icon>
          评论 ({{ totalComments }})
        </h3>
        <div class="stats-actions">
          <el-button
            v-if="showSortOptions"
            size="small"
            :type="sortBy === 'latest' ? 'primary' : ''"
            @click="changeSort('latest')"
          >
            最新
          </el-button>
          <el-button
            v-if="showSortOptions"
            size="small"
            :type="sortBy === 'oldest' ? 'primary' : ''"
            @click="changeSort('oldest')"
          >
            最早
          </el-button>
          <el-button
            v-if="showAdminActions && isAdmin"
            size="small"
            type="danger"
            :disabled="selectedComments.length === 0"
            @click="batchDeleteComments"
          >
            批量删除 ({{ selectedComments.length }})
          </el-button>
        </div>
      </div>
    </div>

    <!-- 评论列表 -->
    <div v-if="loading" class="comment-loading">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="filteredComments.length === 0" class="comment-empty">
      <div class="empty-content">
        <el-icon :size="60"><ChatLineRound /></el-icon>
        <p>暂无评论</p>
        <p class="empty-hint">成为第一个评论的人吧！</p>
      </div>
    </div>

    <div v-else class="comments-container">
      <transition-group name="comment-list">
        <div
          v-for="comment in sortedComments"
          :key="comment.id"
          class="comment-item"
          :class="{ 'comment-selected': selectedComments.includes(comment.id) }"
        >
          <!-- 评论头部 -->
          <div class="comment-header">
            <div class="comment-user">
              <el-avatar :size="36" :src="getUserAvatar(comment.username)" />
              <div class="user-info">
                <div class="username">{{ comment.username }}</div>
                <div class="comment-meta">
                  <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                  <el-tag
                    v-if="comment.isAdmin"
                    size="mini"
                    type="danger"
                    class="admin-tag"
                  >
                    管理员
                  </el-tag>
                </div>
              </div>
            </div>

            <div class="comment-actions">
              <!-- 选择框（管理员） -->
              <el-checkbox
                v-if="showAdminActions && isAdmin"
                v-model="comment.checked"
                @change="toggleCommentSelection(comment.id)"
              />

              <!-- 回复按钮 -->
              <el-button
                v-if="showReplyButton"
                link
                size="small"
                @click="handleReply(comment)"
              >
                <el-icon><ChatDotRound /></el-icon>
                回复
              </el-button>

              <!-- 删除按钮（管理员或自己的评论） -->
              <el-button
                v-if="canDeleteComment(comment)"
                link
                size="small"
                class="delete-button"
                @click="handleDelete(comment.id)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>

              <!-- 更多操作 -->
              <el-dropdown
                v-if="showMoreActions"
                @command="handleCommand($event, comment)"
              >
                <el-button link size="small">
                  <el-icon><More /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="report">
                      <el-icon><Warning /></el-icon>
                      举报
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="!comment.liked"
                      command="like"
                    >
                      <el-icon><Star /></el-icon>
                      点赞
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-else
                      command="unlike"
                    >
                      <el-icon><StarFilled /></el-icon>
                      取消点赞
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <!-- 评论内容 -->
          <div class="comment-content">
            <div class="content-text" v-html="formatContent(comment.content)" />

            <!-- 回复列表 -->
            <div v-if="comment.replies && comment.replies.length > 0" class="comment-replies">
              <div class="replies-header">
                <el-icon><ArrowRight /></el-icon>
                <span>共 {{ comment.replies.length }} 条回复</span>
              </div>
              <div class="replies-list">
                <div
                  v-for="reply in comment.replies"
                  :key="reply.id"
                  class="reply-item"
                >
                  <div class="reply-user">
                    <strong>{{ reply.username }}</strong>
                    <span class="reply-time">{{ formatTime(reply.createdAt) }}</span>
                  </div>
                  <div class="reply-content">{{ reply.content }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 评论脚部 -->
          <div class="comment-footer">
            <div class="footer-actions">
              <el-button
                link
                size="small"
                :class="{ 'liked': comment.liked }"
                @click="toggleLike(comment.id)"
              >
                <el-icon>
                  <template v-if="comment.liked"><StarFilled /></template>
                  <template v-else><Star /></template>
                </el-icon>
                {{ comment.likes || 0 }}
              </el-button>

              <el-button
                v-if="showReplyButton"
                link
                size="small"
                @click="toggleReplyForm(comment.id)"
              >
                <el-icon><ChatDotRound /></el-icon>
                {{ comment.showReplyForm ? '取消回复' : '回复' }}
              </el-button>
            </div>

            <!-- 回复表单 -->
            <transition name="slide-fade">
              <div
                v-if="comment.showReplyForm"
                class="reply-form-wrapper"
              >
                <comment-form
                  :article-id="articleId"
                  :parent-id="comment.id"
                  @submit="handleReplySubmit"
                  @cancel="comment.showReplyForm = false"
                />
              </div>
            </transition>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- 分页 -->
    <div v-if="showPagination && totalPages > 1" class="comment-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalComments"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ChatDotRound,
  ChatLineRound,
  Delete,
  More,
  Warning,
  Star,
  StarFilled,
  ArrowRight
} from '@element-plus/icons-vue'
import { useAuth } from '@/composables/useAuth'
import { useComments } from '@/composables/useComments'
import CommentForm from './CommentForm.vue'

const props = defineProps({
  articleId: {
    type: String,
    required: true
  },
  // 是否显示排序选项
  showSortOptions: {
    type: Boolean,
    default: true
  },
  // 是否显示管理员操作
  showAdminActions: {
    type: Boolean,
    default: true
  },
  // 是否显示回复按钮
  showReplyButton: {
    type: Boolean,
    default: true
  },
  // 是否显示更多操作
  showMoreActions: {
    type: Boolean,
    default: true
  },
  // 是否显示分页
  showPagination: {
    type: Boolean,
    default: true
  },
  // 每页评论数
  pageSize: {
    type: Number,
    default: 10
  },
  // 是否自动加载评论
  autoLoad: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['comment-deleted', 'comment-liked', 'reply-submitted'])

const { getCurrentUser } = useAuth()
const { getComments, deleteComment, likeComment } = useComments()

// 响应式状态
const comments = ref([])
const selectedComments = ref([])
const loading = ref(false)
const sortBy = ref('latest')
const currentPage = ref(1)

// 用户信息
const currentUser = computed(() => getCurrentUser())
const isAdmin = computed(() => currentUser.value?.role === 'admin')

// 计算属性
const totalComments = computed(() => comments.value.length)

const filteredComments = computed(() => {
  return comments.value.filter(comment => !comment.isDeleted)
})

const sortedComments = computed(() => {
  const sorted = [...filteredComments.value]
  if (sortBy.value === 'latest') {
    return sorted.sort((a, b) => b.createdAt - a.createdAt)
  } else if (sortBy.value === 'oldest') {
    return sorted.sort((a, b) => a.createdAt - b.createdAt)
  }
  return sorted
})

const totalPages = computed(() => {
  return Math.ceil(totalComments.value / props.pageSize)
})

const paginatedComments = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return sortedComments.value.slice(start, end)
})

// 获取用户头像
const getUserAvatar = (username) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 一分钟内
  if (diff < 60000) {
    return '刚刚'
  }

  // 一小时内
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}分钟前`
  }

  // 一天内
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}小时前`
  }

  // 一年内
  if (diff < 31536000000) {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  // 超过一年
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}

// 格式化评论内容
const formatContent = (content) => {
  // 简单的HTML转义和链接检测
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 检测链接
  const withLinks = escaped.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  )

  // 换行转换
  return withLinks.replace(/\n/g, '<br>')
}

// 检查是否可以删除评论
const canDeleteComment = (comment) => {
  if (!currentUser.value) return false
  if (isAdmin.value) return true
  return comment.userId === currentUser.value.id
}

// 加载评论
const loadComments = () => {
  loading.value = true
  try {
    const articleComments = getComments(props.articleId)
    comments.value = articleComments.map(comment => ({
      ...comment,
      checked: false,
      showReplyForm: false
    }))
  } catch (error) {
    console.error('加载评论失败:', error)
    ElMessage.error('加载评论失败')
  } finally {
    loading.value = false
  }
}

// 切换排序方式
const changeSort = (newSort) => {
  sortBy.value = newSort
  currentPage.value = 1
}

// 切换评论选择
const toggleCommentSelection = (commentId) => {
  const index = selectedComments.value.indexOf(commentId)
  if (index === -1) {
    selectedComments.value.push(commentId)
  } else {
    selectedComments.value.splice(index, 1)
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

    let successCount = 0
    for (const commentId of selectedComments.value) {
      const result = deleteComment(commentId)
      if (result.success) successCount++
    }

    ElMessage.success(`成功删除 ${successCount} 条评论`)
    selectedComments.value = []
    loadComments()
    emit('comment-deleted', successCount)
  } catch (error) {
    // 用户取消删除
  }
}

// 处理删除单条评论
const handleDelete = async (commentId) => {
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

    const result = deleteComment(commentId)
    if (result.success) {
      ElMessage.success('评论已删除')
      loadComments()
      emit('comment-deleted', 1)
    } else {
      ElMessage.error(result.message || '删除失败')
    }
  } catch (error) {
    // 用户取消删除
  }
}

// 切换点赞
const toggleLike = (commentId) => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录')
    return
  }

  const result = likeComment(commentId)
  if (result.success) {
    loadComments()
    emit('comment-liked', commentId)
  } else {
    ElMessage.warning(result.message || '操作失败')
  }
}

// 处理回复
const handleReply = (comment) => {
  // 找到评论并显示回复表单
  const targetComment = comments.value.find(c => c.id === comment.id)
  if (targetComment) {
    targetComment.showReplyForm = !targetComment.showReplyForm
  }
}

// 切换回复表单
const toggleReplyForm = (commentId) => {
  const comment = comments.value.find(c => c.id === commentId)
  if (comment) {
    comment.showReplyForm = !comment.showReplyForm
  }
}

// 处理回复提交
const handleReplySubmit = () => {
  loadComments()
  emit('reply-submitted')
}

// 处理命令操作
const handleCommand = (command, comment) => {
  switch (command) {
    case 'report':
      ElMessageBox.prompt('请输入举报原因', '举报评论', {
        confirmButtonText: '提交',
        cancelButtonText: '取消'
      }).then(({ value }) => {
        if (value) {
          ElMessage.success('举报已提交，我们会尽快处理')
        }
      })
      break
    case 'like':
      toggleLike(comment.id)
      break
    case 'unlike':
      toggleLike(comment.id)
      break
  }
}

// 处理分页变化
const handlePageChange = (page) => {
  currentPage.value = page
  // 滚动到评论列表顶部
  const commentList = document.querySelector('.comment-list')
  if (commentList) {
    commentList.scrollIntoView({ behavior: 'smooth' })
  }
}

// 监听文章ID变化
watch(() => props.articleId, () => {
  loadComments()
  currentPage.value = 1
  selectedComments.value = []
})

// 生命周期
onMounted(() => {
  if (props.autoLoad) {
    loadComments()
  }
})

// 暴露方法给父组件
defineExpose({
  loadComments,
  refreshComments: loadComments
})
</script>

<style scoped lang="scss">
.comment-list {
  .comment-stats {
    margin-bottom: var(--blog-spacing-lg);

    .stats-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .stats-title {
        display: flex;
        align-items: center;
        gap: var(--blog-spacing-sm);
        margin: 0;
        font-size: 20px;
        font-weight: 600;

        .el-icon {
          color: var(--blog-primary-color);
        }
      }

      .stats-actions {
        display: flex;
        gap: var(--blog-spacing-sm);
      }
    }
  }

  .comment-loading {
    padding: var(--blog-spacing-lg) 0;
  }

  .comment-empty {
    padding: var(--blog-spacing-xl) 0;
    text-align: center;

    .empty-content {
      .el-icon {
        color: var(--blog-border-color);
        margin-bottom: var(--blog-spacing-md);
      }

      p {
        margin: 0 0 var(--blog-spacing-sm);
        color: var(--blog-text-secondary);
        font-size: 16px;
      }

      .empty-hint {
        font-size: 14px;
        opacity: 0.7;
      }
    }
  }

  .comments-container {
    .comment-list-enter-active,
    .comment-list-leave-active {
      transition: all 0.3s ease;
    }

    .comment-list-enter-from,
    .comment-list-leave-to {
      opacity: 0;
      transform: translateY(10px);
    }

    .comment-item {
      padding: var(--blog-spacing-lg);
      margin-bottom: var(--blog-spacing-md);
      background-color: var(--blog-bg-gray);
      border-radius: var(--blog-border-radius);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: var(--blog-shadow);
      }

      &.comment-selected {
        border: 1px solid var(--blog-primary-color);
        background-color: rgba(var(--blog-primary-rgb), 0.05);
      }

      .comment-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--blog-spacing-md);

        .comment-user {
          display: flex;
          align-items: center;
          gap: var(--blog-spacing-md);

          .user-info {
            .username {
              font-weight: 600;
              margin-bottom: 2px;
            }

            .comment-meta {
              display: flex;
              align-items: center;
              gap: var(--blog-spacing-sm);
              font-size: 12px;
              color: var(--blog-text-secondary);

              .admin-tag {
                font-size: 10px;
                padding: 0 4px;
                height: 16px;
                line-height: 16px;
              }
            }
          }
        }

        .comment-actions {
          display: flex;
          align-items: center;
          gap: var(--blog-spacing-sm);

          .delete-button {
            color: var(--blog-danger-color);

            &:hover {
              color: var(--blog-danger-hover);
            }
          }
        }
      }

      .comment-content {
        margin-bottom: var(--blog-spacing-md);

        .content-text {
          line-height: 1.6;
          margin-bottom: var(--blog-spacing-md);

          :deep(a) {
            color: var(--blog-primary-color);
            text-decoration: none;

            &:hover {
              text-decoration: underline;
            }
          }
        }

        .comment-replies {
          margin-top: var(--blog-spacing-md);
          padding: var(--blog-spacing-md);
          background-color: rgba(0, 0, 0, 0.02);
          border-radius: var(--blog-border-radius);

          .replies-header {
            display: flex;
            align-items: center;
            gap: var(--blog-spacing-sm);
            margin-bottom: var(--blog-spacing-sm);
            font-size: 14px;
            color: var(--blog-text-secondary);

            .el-icon {
              font-size: 12px;
            }
          }

          .replies-list {
            .reply-item {
              padding: var(--blog-spacing-sm) 0;
              border-bottom: 1px solid var(--blog-border-color);

              &:last-child {
                border-bottom: none;
              }

              .reply-user {
                display: flex;
                align-items: center;
                gap: var(--blog-spacing-sm);
                margin-bottom: 2px;
                font-size: 13px;

                strong {
                  font-weight: 600;
                }

                .reply-time {
                  color: var(--blog-text-secondary);
                }
              }

              .reply-content {
                font-size: 14px;
                line-height: 1.5;
                color: var(--blog-text-primary);
              }
            }
          }
        }
      }

      .comment-footer {
        .footer-actions {
          display: flex;
          gap: var(--blog-spacing-md);
          margin-bottom: var(--blog-spacing-md);

          :deep(.el-button) {
            color: var(--blog-text-secondary);

            &:hover {
              color: var(--blog-primary-color);
            }

            &.liked {
              color: var(--blog-warning-color);

              &:hover {
                color: var(--blog-warning-hover);
              }
            }
          }
        }

        .reply-form-wrapper {
          margin-top: var(--blog-spacing-md);
        }
      }
    }
  }

  .comment-pagination {
    display: flex;
    justify-content: center;
    margin-top: var(--blog-spacing-lg);
  }
}

.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

// 响应式设计
@media (max-width: 768px) {
  .comment-list {
    .comment-stats {
      .stats-header {
        flex-direction: column;
        align-items: stretch;
        gap: var(--blog-spacing-md);

        .stats-actions {
          justify-content: flex-start;
        }
      }
    }

    .comment-item {
      padding: var(--blog-spacing-md);

      .comment-header {
        flex-direction: column;
        gap: var(--blog-spacing-md);

        .comment-actions {
          align-self: flex-end;
        }
      }
    }
  }
}
</style>