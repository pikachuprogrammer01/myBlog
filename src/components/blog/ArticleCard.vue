<template>
  <div :class="['article-card', layout, { 'is-navigating': navigating }]" @click="handleClick">
    <div v-if="navigating" class="navigating-overlay">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div class="card-inner">
      <div class="cover-wrapper">
        <el-image
          :src="resolvedCover"
          fit="cover"
          loading="lazy"
          preview-teleported
          :initial-index="0"
        >
          <template #placeholder>
            <div class="image-placeholder">
              <el-icon class="is-loading"><Loading /></el-icon>
            </div>
          </template>
          <template #error>
            <div class="image-error">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>
      </div>

      <div class="content-wrapper">
        <h3 class="title">{{ article.title }}</h3>
        <p class="excerpt">{{ article.excerpt }}</p>

        <div class="footer-meta">
          <div class="left">
            <span class="date"
              ><el-icon><Calendar /></el-icon> {{ formattedDate }}</span
            >
            <span class="views"
              ><el-icon><View /></el-icon> {{ article.views }}</span
            >
          </div>
          <el-button link type="primary">阅读更多</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed, ref } from "vue";
  import { useRouter } from "vue-router";
  import { Calendar, Loading, Picture, View } from "@element-plus/icons-vue";
  import dayjs from "dayjs";
  import { resolveArticleCover } from "@/utils/article-cover";
  import { useNavigationLoading } from "@/composables/useNavigationLoading";

  const { isNavigating, startNavigation } = useNavigationLoading();

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
    layout: {
      type: String,
      default: "grid", // 默认值为 grid
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

  const resolvedCover = computed(() =>
    resolveArticleCover(props.article.cover, props.article.id || props.article.title),
  );

  const navigating = ref(false);

  // 处理点击
  const handleClick = () => {
    if (props.clickable && !isNavigating.value) {
      navigating.value = true;
      startNavigation();
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

<style lang="scss" scoped>
  .article-card {
    background: white;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    overflow: hidden;
    cursor: pointer;
    position: relative;

    &.is-navigating {
      pointer-events: none;
      opacity: 0.7;
    }

    .navigating-overlay {
      position: absolute;
      inset: 0;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.85);
      color: var(--blog-primary-color, #409eff);
      font-size: 14px;
    }

    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
    }

    // Grid 模式布局 (默认)
    &.grid {
      .card-inner {
        display: flex;
        flex-direction: column;
        .cover-wrapper {
          height: 200px;
        }
        .content-wrapper {
          padding: 20px;
        }
      }
    }

    // List 模式布局 (差异化优化)
    &.list {
      .card-inner {
        display: flex;
        flex-direction: row; // 横向排列
        height: 180px;
        .cover-wrapper {
          width: 280px;
          flex-shrink: 0;
        }
        .content-wrapper {
          padding: 25px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
      }
    }

    .footer-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      font-size: 13px;
      color: #909399;
      .left {
        display: flex;
        gap: 15px;
      }
    }
  }
</style>
