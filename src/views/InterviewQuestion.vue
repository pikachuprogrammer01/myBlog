<template>
  <div class="interview-question">
    <!-- Breadcrumb -->
    <el-breadcrumb separator="/" class="blog-breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/interview' }">面试题库</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/interview/' + category }">
        {{ categoryLabel }}
      </el-breadcrumb-item>
      <el-breadcrumb-item>{{ question?.title }}</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
      <el-skeleton :rows="12" animated style="margin-top: 24px" />
    </div>

    <!-- Not found -->
    <div v-else-if="!question" class="empty-state">
      <el-empty description="题目不存在">
        <el-button type="primary" @click="$router.push('/interview')">
          返回题库
        </el-button>
      </el-empty>
    </div>

    <!-- Content -->
    <div v-else>
      <article class="question-article">
        <h1 class="question-title">{{ question.title }}</h1>

        <div class="question-meta">
          <el-tag :type="getDifficultyType(question.difficulty)" size="small">
            {{ getDifficultyLabel(question.difficulty) }}
          </el-tag>
          <span class="meta-category">{{ categoryLabel }}</span>
          <span class="meta-views">
            <el-icon><View /></el-icon> {{ question.view_count }}
          </span>
          <span class="meta-date">更新于 {{ formatDate(question.updated_at) }}</span>
        </div>

        <div v-if="question.tags && question.tags.length > 0" class="question-tags">
          <el-tag
            v-for="tag in question.tags"
            :key="tag"
            size="small"
            effect="plain"
            class="q-tag"
          >
            {{ tag }}
          </el-tag>
        </div>

        <el-divider />

        <div class="question-content">
          <MarkdownRenderer
            :content="question.content"
            :show-toc="true"
            :show-progress="true"
          />
        </div>
      </article>

      <!-- Related questions -->
      <div v-if="question.related && question.related.length > 0" class="related-section">
        <h3 class="related-title">
          <el-icon><Link /></el-icon>
          相关题目
        </h3>
        <div
          v-for="r in question.related"
          :key="r.id"
          class="blog-card related-card"
          @click="$router.push(`/interview/${r.category}/${r.id}`)"
        >
          <div class="related-header">
            <span class="related-q-title">{{ r.title }}</span>
            <el-tag :type="getDifficultyType(r.difficulty)" size="small">
              {{ getDifficultyLabel(r.difficulty) }}
            </el-tag>
          </div>
          <span class="related-views">
            <el-icon><View /></el-icon> {{ r.view_count }}
          </span>
        </div>
      </div>

      <!-- Comments section -->
      <div id="comments" class="comments-section">
        <div class="comments-header">
          <h2 class="section-title">
            <el-icon><ChatDotRound /></el-icon>
            评论 ({{ commentCount }})
          </h2>
        </div>

        <!-- Comment form -->
        <div class="comment-form-section">
          <div v-if="!isAuthenticated" class="login-prompt">
            <el-alert
              title="请先登录"
              type="warning"
              :closable="false"
              description="登录后即可发表评论"
            />
            <div class="login-actions">
              <el-button type="primary" @click="$router.push('/login')">登录</el-button>
              <el-button @click="$router.push('/register')">注册</el-button>
            </div>
          </div>
          <div v-else class="form-container">
            <div class="form-header">
              <div class="form-user">
                <el-avatar :size="32" :src="userAvatar" />
                <span class="form-username">{{ currentUser?.username }}</span>
              </div>
            </div>
            <el-input
              v-model="commentContent"
              type="textarea"
              :rows="3"
              placeholder="写下你的评论..."
              maxlength="1000"
              show-word-limit
              resize="none"
            />
            <div class="form-submit">
              <el-button
                type="primary"
                :loading="commentSubmitting"
                :disabled="!commentContent.trim()"
                @click="handleCommentSubmit"
              >
                发表评论
              </el-button>
            </div>
          </div>
        </div>

        <!-- Comment list -->
        <div v-if="commentLoading" class="comment-loading">
          <el-skeleton :rows="3" animated />
        </div>
        <div v-else-if="comments.length === 0" class="comment-empty">
          <el-icon :size="48"><ChatLineRound /></el-icon>
          <p>暂无评论，来说点什么吧</p>
        </div>
        <div v-else class="comment-list">
          <div
            v-for="c in commentTree"
            :key="c.id"
            class="comment-item"
          >
            <div class="comment-main">
              <el-avatar :size="32" :src="getCommentAvatar(c)" class="comment-avatar" />
              <div class="comment-body">
                <div class="comment-top">
                  <span class="comment-username">{{ c.username }}</span>
                  <el-tag v-if="c.user_role === 'admin'" size="mini" type="danger">管理员</el-tag>
                  <span class="comment-time">{{ formatTime(c.created_at) }}</span>
                </div>
                <div class="comment-text">{{ c.content }}</div>
                <div class="comment-actions">
                  <el-button link size="small" @click="handleReplyClick(c.id)">
                    <el-icon><ChatDotRound /></el-icon> 回复
                  </el-button>
                  <el-button
                    v-if="canDeleteComment(c)"
                    link
                    size="small"
                    class="delete-btn"
                    @click="handleDeleteComment(c.id)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>

                <!-- Reply form -->
                <div v-if="replyTarget === c.id" class="reply-form">
                  <el-input
                    v-model="replyContent"
                    type="textarea"
                    :rows="2"
                    placeholder="回复 {{ c.username }}..."
                    maxlength="500"
                    resize="none"
                  />
                  <div class="reply-actions">
                    <el-button size="small" type="primary" :loading="replySubmitting" @click="handleReplySubmit(c.id)">
                      提交
                    </el-button>
                    <el-button size="small" @click="replyTarget = null; replyContent = ''">
                      取消
                    </el-button>
                  </div>
                </div>

                <!-- Replies -->
                <div v-if="c.replies && c.replies.length > 0" class="sub-replies">
                  <div v-for="r in c.replies" :key="r.id" class="reply-item">
                    <el-avatar :size="24" :src="getCommentAvatar(r)" class="reply-avatar" />
                    <div class="reply-body">
                      <div class="reply-top">
                        <span class="reply-username">{{ r.username }}</span>
                        <el-tag v-if="r.user_role === 'admin'" size="mini" type="danger">管理员</el-tag>
                        <span class="reply-time">{{ formatTime(r.created_at) }}</span>
                      </div>
                      <div class="reply-text">{{ r.content }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Notebook, View, Link, ChatDotRound, ChatLineRound, Delete } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getInterviewQuestion,
  getInterviewQuestionComments,
  postInterviewQuestionComment,
} from "@/api/services/interviewService";
import { deleteComment as deleteCommentApi } from "@/api/services/commentService";
import { useAuth } from "@/composables/useAuth";
import MarkdownRenderer from "@/components/blog/MarkdownRenderer.vue";

const props = defineProps({
  category: { type: String, required: true },
  id: { type: String, required: true },
});

const { currentUser, isAuthenticated, isAdmin } = useAuth();

const CATEGORY_LABELS = {
  js: "JavaScript",
  vue: "Vue.js",
  css: "CSS",
  algorithm: "算法",
  engineering: "工程化",
  project: "项目经验",
};

const DIFFICULTY_LABELS = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

const categoryLabel = computed(() => CATEGORY_LABELS[props.category] || props.category);

const question = ref(null);
const loading = ref(true);

// Comment state
const comments = ref([]);
const commentLoading = ref(false);
const commentSubmitting = ref(false);
const replySubmitting = ref(false);
const commentContent = ref("");
const replyContent = ref("");
const replyTarget = ref(null);
const commentCount = computed(() => comments.value.length);

const commentTree = computed(() => {
  const map = {};
  const roots = [];
  comments.value.forEach((c) => {
    map[c.id] = { ...c, replies: [] };
  });
  comments.value.forEach((c) => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });
  return roots;
});

const userAvatar = computed(() => {
  if (!currentUser.value) return "";
  if (currentUser.value.avatarUrl) return currentUser.value.avatarUrl;
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentUser.value.username}`;
});

function getDifficultyType(d) {
  if (d === "easy") return "success";
  if (d === "medium") return "warning";
  return "danger";
}

function getDifficultyLabel(d) {
  return DIFFICULTY_LABELS[d] || d;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

function getCommentAvatar(c) {
  if (c.avatar_url) return c.avatar_url;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

function canDeleteComment(c) {
  if (!currentUser.value) return false;
  if (isAdmin.value) return true;
  return c.user_id === currentUser.value.id;
}

async function loadComments() {
  commentLoading.value = true;
  try {
    const res = await getInterviewQuestionComments(props.id);
    if (res.data.success) {
      comments.value = res.data.data || [];
    }
  } catch {
    // Keep current comments
  } finally {
    commentLoading.value = false;
  }
}

async function handleCommentSubmit() {
  if (!commentContent.value.trim()) return;
  commentSubmitting.value = true;
  try {
    const res = await postInterviewQuestionComment(props.id, { content: commentContent.value.trim() });
    if (res.data.success) {
      ElMessage.success("评论已发表");
      commentContent.value = "";
      await loadComments();
    } else {
      ElMessage.error(res.data.message || "评论失败");
    }
  } catch {
    ElMessage.error("评论发表失败");
  } finally {
    commentSubmitting.value = false;
  }
}

function handleReplyClick(commentId) {
  replyTarget.value = replyTarget.value === commentId ? null : commentId;
  replyContent.value = "";
}

async function handleReplySubmit(parentId) {
  if (!replyContent.value.trim()) return;
  replySubmitting.value = true;
  try {
    const res = await postInterviewQuestionComment(props.id, {
      content: replyContent.value.trim(),
      parentId,
    });
    if (res.data.success) {
      ElMessage.success("回复已发表");
      replyContent.value = "";
      replyTarget.value = null;
      await loadComments();
    } else {
      ElMessage.error(res.data.message || "回复失败");
    }
  } catch {
    ElMessage.error("回复发表失败");
  } finally {
    replySubmitting.value = false;
  }
}

async function handleDeleteComment(commentId) {
  try {
    await ElMessageBox.confirm("确定要删除这条评论吗？", "删除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await deleteCommentApi(commentId);
    ElMessage.success("评论已删除");
    await loadComments();
  } catch {
    // Cancelled or error
  }
}

onMounted(async () => {
  try {
    const res = await getInterviewQuestion(props.id);
    if (res.data.success) {
      question.value = res.data.data;
    }
  } catch {
    // question stays null → shows not-found state
  } finally {
    loading.value = false;
  }
  loadComments();
});
</script>

<style scoped lang="scss">
.interview-question {
  padding: var(--blog-spacing-md) 0;

  .blog-breadcrumb {
    margin-bottom: var(--blog-spacing-md);
  }

  .loading-state {
    padding: var(--blog-spacing-lg) 0;
  }

  .empty-state {
    text-align: center;
    padding: var(--blog-spacing-xl) 0;
  }

  .question-article {
    .question-title {
      margin: 0 0 var(--blog-spacing-md);
      font-size: 28px;
      font-weight: 700;
      line-height: 1.3;
      color: var(--blog-text-primary);
    }

    .question-meta {
      display: flex;
      align-items: center;
      gap: var(--blog-spacing-md);
      font-size: 14px;
      color: var(--blog-text-secondary);

      .meta-views {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .meta-date {
        margin-left: auto;
      }
    }

    .question-tags {
      display: flex;
      gap: 6px;
      margin-top: var(--blog-spacing-md);
    }

    .question-content {
      margin-top: var(--blog-spacing-md);
    }
  }

  .related-section {
    margin-top: var(--blog-spacing-xl);

    .related-title {
      display: flex;
      align-items: center;
      gap: var(--blog-spacing-sm);
      margin: 0 0 var(--blog-spacing-md);
      font-size: 18px;
      font-weight: 600;
    }

    .related-card {
      padding: var(--blog-spacing-md) var(--blog-spacing-lg);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--blog-shadow);
      }

      .related-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;

        .related-q-title {
          font-size: 15px;
          font-weight: 500;
          color: var(--blog-text-primary);
        }
      }

      .related-views {
        font-size: 13px;
        color: var(--blog-text-secondary);
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .comments-section {
    margin-top: var(--blog-spacing-xl);
    padding-top: var(--blog-spacing-xl);
    border-top: 1px solid var(--blog-border-light);

    .section-title {
      display: flex;
      align-items: center;
      gap: var(--blog-spacing-sm);
      margin: 0 0 var(--blog-spacing-lg);
      font-size: 22px;
      font-weight: 600;

      .el-icon {
        color: var(--blog-primary-color);
      }
    }

    .comment-form-section {
      margin-bottom: var(--blog-spacing-xl);

      .login-prompt {
        text-align: center;
        padding: var(--blog-spacing-lg);

        .login-actions {
          display: flex;
          justify-content: center;
          gap: var(--blog-spacing-md);
          margin-top: var(--blog-spacing-md);
        }
      }

      .form-container {
        .form-header {
          display: flex;
          align-items: center;
          margin-bottom: var(--blog-spacing-sm);

          .form-user {
            display: flex;
            align-items: center;
            gap: var(--blog-spacing-sm);
          }

          .form-username {
            font-weight: 600;
            font-size: 14px;
          }
        }

        .form-submit {
          margin-top: var(--blog-spacing-sm);
        }
      }
    }

    .comment-loading {
      padding: var(--blog-spacing-lg) 0;
    }

    .comment-empty {
      text-align: center;
      padding: var(--blog-spacing-xl) 0;
      color: var(--blog-text-secondary);

      .el-icon {
        color: var(--blog-border-color);
        margin-bottom: var(--blog-spacing-sm);
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    .comment-list {
      .comment-item {
        padding: var(--blog-spacing-md) 0;
        border-bottom: 1px solid var(--blog-border-light);

        &:last-child {
          border-bottom: none;
        }

        .comment-main {
          display: flex;
          gap: var(--blog-spacing-md);

          .comment-avatar {
            flex-shrink: 0;
          }

          .comment-body {
            flex: 1;
            min-width: 0;

            .comment-top {
              display: flex;
              align-items: center;
              gap: var(--blog-spacing-sm);
              margin-bottom: 4px;

              .comment-username {
                font-weight: 600;
                font-size: 14px;
              }

              .comment-time {
                font-size: 12px;
                color: var(--blog-text-secondary);
              }
            }

            .comment-text {
              font-size: 14px;
              line-height: 1.6;
              margin-bottom: var(--blog-spacing-sm);
              white-space: pre-wrap;
              word-break: break-word;
            }

            .comment-actions {
              display: flex;
              gap: var(--blog-spacing-sm);
              margin-bottom: var(--blog-spacing-sm);

              .delete-btn {
                color: var(--blog-danger-color);
              }
            }

            .reply-form {
              margin-bottom: var(--blog-spacing-md);
              padding: var(--blog-spacing-sm);
              background: var(--blog-bg-gray);
              border-radius: var(--blog-border-radius);

              .reply-actions {
                display: flex;
                gap: var(--blog-spacing-sm);
                margin-top: var(--blog-spacing-sm);
              }
            }

            .sub-replies {
              padding: var(--blog-spacing-sm);
              background: var(--blog-bg-gray);
              border-radius: var(--blog-border-radius);

              .reply-item {
                display: flex;
                gap: var(--blog-spacing-sm);
                padding: var(--blog-spacing-sm) 0;
                border-bottom: 1px solid var(--blog-border-light);

                &:last-child {
                  border-bottom: none;
                  padding-bottom: 0;
                }

                &:first-child {
                  padding-top: 0;
                }

                .reply-avatar {
                  flex-shrink: 0;
                }

                .reply-body {
                  flex: 1;
                  min-width: 0;

                  .reply-top {
                    display: flex;
                    align-items: center;
                    gap: var(--blog-spacing-sm);
                    margin-bottom: 2px;

                    .reply-username {
                      font-weight: 600;
                      font-size: 13px;
                    }

                    .reply-time {
                      font-size: 12px;
                      color: var(--blog-text-secondary);
                    }
                  }

                  .reply-text {
                    font-size: 13px;
                    line-height: 1.5;
                    white-space: pre-wrap;
                    word-break: break-word;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>
