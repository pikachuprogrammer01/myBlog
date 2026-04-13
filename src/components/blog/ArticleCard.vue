<template>
  <div class="article-card" @click="handleClick">
    <!-- 封面图片 -->
    <div v-if="article.cover" class="article-card-cover">
      <img :src="article.cover" :alt="article.title" class="cover-image" />
      <div
        v-if="
          showCategory && article.categories && article.categories.length > 0
        "
        class="article-category"
      >
        <span>{{ article.categories[0] }}</span>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="article-card-content">
      <!-- 标题 -->
      <h3 class="article-title">{{ article.title }}</h3>

      <!-- 摘要 -->
      <p v-if="article.excerpt" class="article-excerpt">
        {{ article.excerpt }}
      </p>

      <!-- 元信息 -->
      <div class="article-meta">
        <!-- 日期 -->
        <div class="meta-item">
          <el-icon><Calendar /></el-icon>
          <span>{{ formattedDate }}</span>
        </div>

        <!-- 阅读量 -->
        <div v-if="showViews" class="meta-item">
          <el-icon><View /></el-icon>
          <span>{{ article.views || 0 }} 阅读</span>
        </div>

        <!-- 评论数 -->
        <div
          v-if="showComments && article.commentCount !== undefined"
          class="meta-item"
        >
          <el-icon><ChatDotRound /></el-icon>
          <span>{{ article.commentCount }} 评论</span>
        </div>
      </div>

      <!-- 标签 -->
      <div
        v-if="showTags && article.tags && article.tags.length > 0"
        class="article-tags"
      >
        <el-tag
          v-for="tag in article.tags.slice(0, maxTags)"
          :key="tag"
          size="small"
          type="info"
          class="tag"
        >
          {{ tag }}
        </el-tag>
        <span v-if="article.tags.length > maxTags" class="tag-more">
          +{{ article.tags.length - maxTags }}
        </span>
      </div>

      <!-- 操作按钮 -->
      <div v-if="showActions" class="article-actions">
        <el-button link size="small" @click.stop="handleReadMore">
          阅读全文 →
        </el-button>
        <el-button v-if="showShare" link size="small" @click.stop="handleShare">
          <el-icon><Share /></el-icon>
          分享
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from "vue";
  import { useRouter } from "vue-router";
  import { Calendar, View, ChatDotRound, Share } from "@element-plus/icons-vue";
  import dayjs from "dayjs";

  const props = defineProps({
    article: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    // 配置选项
    showCategory: {
      type: Boolean,
      default: true,
    },
    showViews: {
      type: Boolean,
      default: true,
    },
    showComments: {
      type: Boolean,
      default: true,
    },
    showTags: {
      type: Boolean,
      default: true,
    },
    showActions: {
      type: Boolean,
      default: true,
    },
    showShare: {
      type: Boolean,
      default: false,
    },
    maxTags: {
      type: Number,
      default: 3,
    },
    // 点击事件
    clickable: {
      type: Boolean,
      default: true,
    },
  });

  const emit = defineEmits(["click", "read-more", "share"]);

  const router = useRouter();

  // 格式化日期
  const formattedDate = computed(() => {
    if (!props.article.date) return "未知日期";
    return dayjs(props.article.date).format("YYYY-MM-DD");
  });

  // 处理点击
  const handleClick = () => {
    if (props.clickable) {
      emit("click", props.article);
      router.push(`/article/${props.article.id}`);
    }
  };

  // 处理阅读全文
  const handleReadMore = (e) => {
    e.stopPropagation();
    emit("read-more", props.article);
    router.push(`/article/${props.article.id}`);
  };

  // 处理分享
  const handleShare = (e) => {
    e.stopPropagation();
    emit("share", props.article);

    // 这里可以实现分享逻辑
    if (navigator.share) {
      navigator.share({
        title: props.article.title,
        text: props.article.excerpt,
        url: window.location.origin + `/article/${props.article.id}`,
      });
    } else {
      // 降级方案：复制链接
      const url = window.location.origin + `/article/${props.article.id}`;
      navigator.clipboard.writeText(url).then(() => {
        // 可以添加提示
        console.log("链接已复制到剪贴板:", url);
      });
    }
  };
</script>

<style scoped lang="scss">
  .article-card {
    background: var(--blog-bg-card);
    border-radius: var(--blog-border-radius-lg);
    overflow: hidden;
    box-shadow: var(--blog-shadow-sm);
    transition: all 0.3s ease;
    cursor: pointer;
    height: 100%;
    display: flex;
    flex-direction: column;

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--blog-shadow-lg);

      .article-title {
        color: var(--blog-primary-color);
      }
    }

    .article-card-cover {
      position: relative;
      height: 180px;
      overflow: hidden;

      .cover-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
      }

      .article-category {
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(var(--blog-primary-rgb), 0.9);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }

      &:hover {
        .cover-image {
          transform: scale(1.05);
        }
      }
    }

    .article-card-content {
      flex: 1;
      padding: var(--blog-spacing-lg);
      display: flex;
      flex-direction: column;

      .article-title {
        font-size: 18px;
        font-weight: 600;
        line-height: 1.4;
        margin: 0 0 var(--blog-spacing-sm) 0;
        color: var(--blog-text-primary);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        transition: color 0.3s ease;
      }

      .article-excerpt {
        flex: 1;
        font-size: 14px;
        line-height: 1.6;
        color: var(--blog-text-secondary);
        margin: 0 0 var(--blog-spacing-md) 0;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .article-meta {
        display: flex;
        align-items: center;
        gap: var(--blog-spacing-md);
        margin-bottom: var(--blog-spacing-md);
        font-size: 13px;
        color: var(--blog-text-muted);

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;

          .el-icon {
            font-size: 14px;
          }
        }
      }

      .article-tags {
        margin-bottom: var(--blog-spacing-md);
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .tag {
          height: 24px;
          line-height: 22px;
        }

        .tag-more {
          font-size: 12px;
          color: var(--blog-text-muted);
          line-height: 24px;
          margin-left: 4px;
        }
      }

      .article-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: var(--blog-spacing-sm);
        border-top: 1px solid var(--blog-border-light);

        .el-button {
          color: var(--blog-text-muted);
          font-size: 14px;

          &:hover {
            color: var(--blog-primary-color);
          }

          .el-icon {
            margin-right: 4px;
          }
        }
      }
    }
  }

  // 紧凑模式
  .article-card.compact {
    .article-card-cover {
      height: 140px;
    }

    .article-card-content {
      padding: var(--blog-spacing-md);

      .article-title {
        font-size: 16px;
        margin-bottom: var(--blog-spacing-xs);
      }

      .article-excerpt {
        font-size: 13px;
        -webkit-line-clamp: 2;
        margin-bottom: var(--blog-spacing-sm);
      }

      .article-meta {
        margin-bottom: var(--blog-spacing-sm);
      }
    }
  }

  // 无封面模式
  .article-card.no-cover {
    .article-card-content {
      padding-top: var(--blog-spacing-lg);
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .article-card {
      .article-card-cover {
        height: 160px;
      }

      .article-card-content {
        padding: var(--blog-spacing-md);

        .article-title {
          font-size: 16px;
        }

        .article-excerpt {
          font-size: 13px;
        }

        .article-meta {
          font-size: 12px;
          gap: var(--blog-spacing-sm);
        }
      }
    }
  }
</style>
