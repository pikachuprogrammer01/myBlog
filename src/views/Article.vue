<template>
  <div v-if="loading" class="article-loading">
    <el-skeleton :rows="10" animated />
  </div>

  <div v-else-if="!article" class="article-not-found">
    <el-empty description="文章不存在或已被删除">
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </el-empty>
  </div>

  <div v-else class="article-container">
    <!-- 文章头部 -->
    <div class="article-header">
      <!-- 面包屑导航 -->
      <div class="article-breadcrumb">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/categories' }">分类</el-breadcrumb-item>
          <el-breadcrumb-item v-if="article.categories && article.categories.length > 0">
            {{ article.categories[0] }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{ article.title }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 文章标题 -->
      <h1 class="article-title">{{ article.title }}</h1>

      <!-- 文章元信息 -->
      <div class="article-meta">
        <div class="meta-left">
          <span class="meta-item">
            <el-icon><Calendar /></el-icon>
            {{ formatDate(article.date) }}
          </span>
          <span v-if="article.views !== undefined" class="meta-item">
            <el-icon><View /></el-icon>
            {{ article.views }} 阅读
          </span>
          <span class="meta-item" v-if="article.categories && article.categories.length > 0">
            <el-icon><Folder /></el-icon>
            {{ article.categories[0] }}
          </span>
        </div>
        <div class="meta-right">
          <el-button
            link
            size="small"
            class="share-button"
            @click="handleShare"
          >
            <el-icon><Share /></el-icon>
            分享
          </el-button>
          <el-button
            v-if="isAdmin"
            link
            size="small"
            class="edit-button"
            @click="handleEdit"
          >
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
        </div>
      </div>

      <!-- 文章封面 -->
      <div v-if="article.cover" class="article-cover">
        <img :src="article.cover" :alt="article.title" />
      </div>
    </div>

    <!-- 文章内容 -->
    <div class="article-content">
      <markdown-renderer
        :content="article.content"
        :show-toc="true"
        :show-progress="true"
        class="markdown-renderer"
      />
    </div>

    <!-- 文章标签 -->
    <div v-if="article.tags && article.tags.length > 0" class="article-tags">
      <h3 class="section-title">标签</h3>
      <div class="tags-container">
        <el-tag
          v-for="tag in article.tags"
          :key="tag"
          type="info"
          size="large"
          class="tag-item"
          @click="handleTagClick(tag)"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>

    <!-- 文章操作 -->
    <div class="article-actions">
      <div class="actions-left">
        <el-button-group>
          <el-button
            :type="liked ? 'primary' : 'default'"
            :loading="liking"
            @click="handleLike"
          >
            <el-icon><Star /></el-icon>
            {{ liked ? '已点赞' : '点赞' }} ({{ likeCount }})
          </el-button>
          <el-button type="default" @click="scrollToComments">
            <el-icon><ChatDotRound /></el-icon>
            评论 ({{ commentCount }})
          </el-button>
        </el-button-group>
      </div>
      <div class="actions-right">
        <el-dropdown @command="handleMoreCommand">
          <el-button type="default">
            更多
            <el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="report">
                <el-icon><Warning /></el-icon>
                举报文章
              </el-dropdown-item>
              <el-dropdown-item command="print">
                <el-icon><Printer /></el-icon>
                打印文章
              </el-dropdown-item>
              <el-dropdown-item command="bookmark">
                <el-icon><Star /></el-icon>
                收藏文章
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 上一篇/下一篇导航 -->
    <div v-if="previousArticle || nextArticle" class="article-navigation">
      <div
        v-if="previousArticle"
        class="nav-item nav-previous"
        @click="handleArticleClick(previousArticle)"
      >
        <div class="nav-label">上一篇</div>
        <div class="nav-title">{{ previousArticle.title }}</div>
      </div>
      <div
        v-if="nextArticle"
        class="nav-item nav-next"
        @click="handleArticleClick(nextArticle)"
      >
        <div class="nav-label">下一篇</div>
        <div class="nav-title">{{ nextArticle.title }}</div>
      </div>
    </div>

    <!-- 评论区 -->
    <div id="comments" class="comments-section">
      <div class="comments-header">
        <h2 class="section-title">
          <el-icon><ChatDotRound /></el-icon>
          评论 ({{ commentCount }})
        </h2>
        <div class="comments-tools">
          <el-select
            v-if="commentCount > 0"
            v-model="commentSort"
            size="small"
            style="width: 100px;"
            @change="handleCommentSortChange"
          >
            <el-option label="最新" value="latest" />
            <el-option label="最热" value="hottest" />
          </el-select>
        </div>
      </div>

      <!-- 评论列表 -->
      <comment-list
        ref="commentListRef"
        :article-id="articleId"
        :sort-mode="commentSort"
        :show-sort-options="false"
        class="comment-list"
        @comment-deleted="handleCommentMutation"
        @reply-submitted="handleCommentMutation"
      />

      <!-- 评论表单 -->
      <div class="comment-form-section">
        <h3 class="section-title">发表评论</h3>
        <comment-form
          :article-id="articleId"
          :auto-focus="false"
          @submit="handleCommentSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Calendar,
  View,
  Folder,
  Share,
  Edit,
  Star,
  ChatDotRound,
  ArrowDown,
  Warning,
  Printer
} from '@element-plus/icons-vue'
import client from '@/api/client'
import { useArticleStore } from '@/stores/article'
import { useAuth } from '@/composables/useAuth'
import { useArticles } from '@/composables/useArticles'
import MarkdownRenderer from '@/components/blog/MarkdownRenderer.vue'
import CommentList from '@/components/blog/CommentList.vue'
import CommentForm from '@/components/blog/CommentForm.vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()
const { currentUser } = useAuth()
const { toggleLike, toggleBookmark, getLikeCount } = useArticles()

// 路由参数
const articleId = computed(() => route.params.id)

// 响应式数据
const loading = ref(true)
const article = ref(null)
const previousArticle = ref(null)
const nextArticle = ref(null)
const liked = ref(false)
const liking = ref(false)
const likeCount = ref(0)
const commentCount = ref(0)
const commentSort = ref('latest')
const commentListRef = ref(null)

const isAdmin = computed(() => currentUser.value?.role === 'admin')

const formatDate = (date) => {
  if (!date) return '未知日期'
  return dayjs(date).format('YYYY年MM月DD日')
}

const loadArticle = async () => {
  loading.value = true
  try {
    // 从 API 获取完整文章数据（列表接口不含 content 字段，必须调用单篇文章接口）
    const res = await client.get(`/api/articles/${articleId.value}`)
    if (res.data.success) {
      const data = res.data.data
      article.value = {
        ...data,
        id: data.slug || data.id,
        date: data.created_at,
        excerpt: data.summary,
        cover: data.cover_image,
        views: data.view_count,
        categories: data.category_name ? [data.category_name] : [],
      }
    }

    // 确保文章列表已加载（用于上一篇/下一篇导航）
    if (articleStore.articles.length === 0) {
      await articleStore.loadArticles()
    }

    if (article.value) {
      const { previous, next } = articleStore.getPreviousNextArticles(articleId.value)
      previousArticle.value = previous
      nextArticle.value = next

      const likes = await getLikeCount(articleId.value)
      likeCount.value = likes
    }
  } catch (error) {
    console.error('加载文章失败:', error)
    ElMessage.error('加载文章失败')
  } finally {
    loading.value = false
  }
}

const handleTagClick = (tag) => {
  router.push(`/tags?tag=${encodeURIComponent(tag)}`)
}

const handleArticleClick = (targetArticle) => {
  router.push(`/article/${targetArticle.id}`)
}

const handleShare = () => {
  const url = window.location.href
  const title = article.value.title

  if (navigator.share) {
    navigator.share({
      title: title,
      text: article.value.excerpt,
      url: url
    })
  } else {
    navigator.clipboard.writeText(url).then(() => {
      ElMessage.success('链接已复制到剪贴板')
    }).catch(() => {
      ElMessageBox.alert(`分享链接: ${url}`, '分享文章', {
        confirmButtonText: '确定'
      })
    })
  }
}

const handleEdit = () => {
  if (!isAdmin.value) {
    ElMessage.warning('只有管理员可以编辑文章')
    return
  }
  ElMessage.info('文章编辑功能待实现')
}

const handleLike = async () => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录后再点赞')
    router.push('/login')
    return
  }

  liking.value = true
  try {
    const result = await toggleLike(articleId.value)
    if (result) {
      liked.value = result.liked
      likeCount.value = result.likes
      ElMessage.success(result.liked ? '点赞成功' : '已取消点赞')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    liking.value = false
  }
}

const scrollToComments = () => {
  const commentsSection = document.getElementById('comments')
  if (commentsSection) {
    commentsSection.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleMoreCommand = async (command) => {
  switch (command) {
    case 'report':
      ElMessageBox.prompt('请输入举报原因', '举报文章', {
        confirmButtonText: '提交',
        cancelButtonText: '取消',
        inputPlaceholder: '请描述举报原因...'
      }).then(({ value }) => {
        if (value) {
          ElMessage.success('举报已提交，我们会尽快处理')
        }
      })
      break
    case 'print':
      window.print()
      break
    case 'bookmark':
      if (!currentUser.value) {
        ElMessage.warning('请先登录后再收藏文章')
        router.push('/login')
        return
      }

      const result = await toggleBookmark(articleId.value)
      if (result) {
        ElMessage.success(result.bookmarked ? '已收藏文章' : '已取消收藏')
      } else {
        ElMessage.error('操作失败')
      }
      break
  }
}

// 处理评论排序变化
const handleCommentSortChange = (sort) => {
  commentSort.value = sort
  if (commentListRef.value) {
    commentListRef.value.refreshComments()
  }
}

// 处理评论提交
const handleCommentSubmit = () => {
  if (commentListRef.value) {
    commentListRef.value.refreshComments()
  }
  commentCount.value += 1
}

const handleCommentMutation = () => {
  if (commentListRef.value) {
    commentListRef.value.refreshComments()
  }
}

// 监听路由变化
watch(() => route.params.id, (newId) => {
  if (newId) {
    loadArticle()
  }
}, { immediate: false })

// 生命周期
onMounted(() => {
  loadArticle()
})
</script>

<style scoped lang="scss">
.article-container {
  padding: var(--blog-spacing-md) 0;

  .article-loading {
    padding: var(--blog-spacing-xl) 0;
  }

  .article-not-found {
    padding: var(--blog-spacing-xxl) 0;
  }

  .article-header {
    margin-bottom: var(--blog-spacing-xl);

    .article-breadcrumb {
      margin-bottom: var(--blog-spacing-md);
      font-size: 14px;
    }

    .article-title {
      font-size: 32px;
      font-weight: 700;
      line-height: 1.3;
      margin: 0 0 var(--blog-spacing-md) 0;
      color: var(--blog-text-primary);
      word-break: break-word;
    }

    .article-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--blog-spacing-lg);
      padding-bottom: var(--blog-spacing-md);
      border-bottom: 1px solid var(--blog-border-light);
      font-size: 14px;
      color: var(--blog-text-secondary);

      .meta-left {
        display: flex;
        align-items: center;
        gap: var(--blog-spacing-lg);

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;

          .el-icon {
            font-size: 16px;
          }
        }
      }

      .meta-right {
        display: flex;
        gap: var(--blog-spacing-sm);

        .el-button {
          color: var(--blog-text-secondary);

          &:hover {
            color: var(--blog-primary-color);
          }

          &.edit-button:hover {
            color: var(--blog-warning-color);
          }
        }
      }
    }

    .article-cover {
      border-radius: var(--blog-border-radius-lg);
      overflow: hidden;
      box-shadow: var(--blog-shadow);
      margin-bottom: var(--blog-spacing-xl);

      img {
        width: 100%;
        height: auto;
        display: block;
      }
    }
  }

  .article-content {
    margin-bottom: var(--blog-spacing-xl);

    .markdown-renderer {
      min-height: 200px;
    }
  }

  .article-tags {
    margin-bottom: var(--blog-spacing-xl);
    padding: var(--blog-spacing-lg);
    background: var(--blog-bg-gray);
    border-radius: var(--blog-border-radius-lg);

    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 var(--blog-spacing-md) 0;
      color: var(--blog-text-primary);
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: var(--blog-spacing-sm);

      .tag-item {
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          background-color: var(--blog-primary-color);
          color: white;
        }
      }
    }
  }

  .article-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--blog-spacing-xl);
    padding: var(--blog-spacing-lg);
    background: var(--blog-bg-gray);
    border-radius: var(--blog-border-radius-lg);

    .actions-left {
      .el-button-group {
        .el-button {
          .el-icon {
            margin-right: 4px;
          }
        }
      }
    }
  }

  .article-navigation {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--blog-spacing-lg);
    margin-bottom: var(--blog-spacing-xl);

    .nav-item {
      padding: var(--blog-spacing-lg);
      background: var(--blog-bg-gray);
      border-radius: var(--blog-border-radius-lg);
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: var(--blog-primary-light);
        transform: translateY(-2px);
        box-shadow: var(--blog-shadow);

        .nav-title {
          color: var(--blog-primary-color);
        }
      }

      &.nav-previous {
        text-align: left;
      }

      &.nav-next {
        text-align: right;
      }

      .nav-label {
        font-size: 12px;
        color: var(--blog-text-secondary);
        margin-bottom: var(--blog-spacing-xs);
      }

      .nav-title {
        font-size: 16px;
        font-weight: 500;
        line-height: 1.4;
        color: var(--blog-text-primary);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }

  .comments-section {
    .comments-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--blog-spacing-lg);
      padding-bottom: var(--blog-spacing-md);
      border-bottom: 1px solid var(--blog-border-light);

      .section-title {
        display: flex;
        align-items: center;
        gap: var(--blog-spacing-sm);
        margin: 0;
        font-size: 24px;
        font-weight: 600;

        .el-icon {
          color: var(--blog-primary-color);
        }
      }
    }

    .comment-list {
      margin-bottom: var(--blog-spacing-xl);
    }

    .comment-form-section {
      .section-title {
        font-size: 20px;
        font-weight: 600;
        margin: 0 0 var(--blog-spacing-lg) 0;
        color: var(--blog-text-primary);
      }
    }
  }
}

// 响应式设计
@media (max-width: 992px) {
  .article-container {
    .article-header {
      .article-title {
        font-size: 28px;
      }

      .article-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--blog-spacing-md);

        .meta-right {
          align-self: flex-end;
        }
      }
    }

    .article-navigation {
      grid-template-columns: 1fr;
    }
  }
}

@media (max-width: 768px) {
  .article-container {
    .article-header {
      .article-title {
        font-size: 24px;
      }

      .article-meta {
        .meta-left {
          flex-wrap: wrap;
          gap: var(--blog-spacing-md);
        }
      }
    }

    .article-actions {
      flex-direction: column;
      align-items: stretch;
      gap: var(--blog-spacing-md);

      .actions-left,
      .actions-right {
        width: 100%;
      }

      .actions-left {
        .el-button-group {
          display: flex;
          width: 100%;

          .el-button {
            flex: 1;
          }
        }
      }

      .actions-right {
        .el-button {
          width: 100%;
        }
      }
    }

    .comments-section {
      .comments-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--blog-spacing-md);
      }
    }
  }
}
</style>
