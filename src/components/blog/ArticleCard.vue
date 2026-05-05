<template>
  <div
    :class="['article-card', layout, categoryClass, { 'is-navigating': navigating }]"
    @click="handleClick"
  >
    <div v-if="navigating" class="navigating-overlay">
      <span class="loading-counter">{{ loadingPercent }}%</span>
    </div>

    <!-- 左侧状态条 -->
    <div class="status-bar"></div>

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
              <span class="placeholder-cursor">_</span>
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
            <span class="date">{{ formattedDate }}</span>
            <span class="views">{{ article.views }} 阅读</span>
          </div>
          <span class="hex-id">0x{{ hexId }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { Picture } from "@element-plus/icons-vue";
import dayjs from "dayjs";
import { resolveArticleCover } from "@/utils/article-cover";
import { useNavigationLoading } from "@/composables/useNavigationLoading";

const { isNavigating, startNavigation } = useNavigationLoading();

const props = defineProps({
  article: { type: Object, required: true, default: () => ({}) },
  showCategory: { type: Boolean, default: true },
  layout: { type: String, default: "grid" },
  showViews: { type: Boolean, default: true },
  showComments: { type: Boolean, default: true },
  showTags: { type: Boolean, default: true },
  showActions: { type: Boolean, default: true },
  showShare: { type: Boolean, default: false },
  maxTags: { type: Number, default: 3 },
  clickable: { type: Boolean, default: true },
});

const emit = defineEmits(["click", "read-more", "share"]);
const router = useRouter();
const navigating = ref(false);
const loadingPercent = ref(0);

const formattedDate = computed(() => {
  if (!props.article.date) return "未知日期";
  return dayjs(props.article.date).format("YYYY-MM-DD");
});

const resolvedCover = computed(() =>
  resolveArticleCover(props.article.cover, props.article.id || props.article.title),
);

const categoryClass = computed(() => {
  const cat = props.article.categories?.[0] || "";
  if (/技术|tech|code|编程|前端|后端|javascript|vue|react/i.test(cat)) return "status-tech";
  if (/生活|life|日常|日记/i.test(cat)) return "status-life";
  if (/思考|thought|随笔|杂谈|note/i.test(cat)) return "status-thought";
  return "status-default";
});

const hexId = computed(() => {
  const id = props.article.id;
  if (typeof id === "number") {
    return id.toString(16).toUpperCase().padStart(4, "0");
  }
  let hash = 0;
  for (let i = 0; i < String(id).length; i++) {
    hash = (hash << 5) - hash + String(id).charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(4, "0").slice(0, 4);
});

const handleClick = () => {
  if (props.clickable && !isNavigating.value) {
    navigating.value = true;
    // Simulate loading counter
    let p = 0;
    const timer = setInterval(() => {
      p += Math.random() * 30;
      if (p >= 100) {
        p = 100;
        clearInterval(timer);
        startNavigation();
        emit("click", props.article);
        router.push(`/article/${props.article.id}`);
      }
      loadingPercent.value = Math.floor(p);
    }, 80);
  }
};

const handleReadMore = (e) => {
  e.stopPropagation();
  emit("read-more", props.article);
  router.push(`/article/${props.article.id}`);
};

const handleShare = (e) => {
  e.stopPropagation();
  emit("share", props.article);
  if (navigator.share) {
    navigator.share({
      title: props.article.title,
      text: props.article.excerpt,
      url: window.location.origin + `/article/${props.article.id}`,
    });
  } else {
    const url = window.location.origin + `/article/${props.article.id}`;
    navigator.clipboard.writeText(url).then(() => {
      console.log("链接已复制到剪贴板:", url);
    });
  }
};
</script>

<style lang="scss" scoped>
$bg-panel: #161b22;
$bg-card-hover: #1c2330;
$border-color: #30363d;
$accent-gold: #f2c94c;
$text-bright: #e6edf3;
$text-muted: #8b949e;
$link-blue: #58a6ff;
$status-green: #3fb950;
$status-yellow: #d2991a;
$radius: 2px;

.article-card {
  background: $bg-panel;
  border: 1px solid $border-color;
  border-radius: $radius;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.15s ease;
  box-shadow: 4px 4px 0px #000;

  &:hover {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0px #000;
    background: $bg-card-hover;

    .status-bar {
      opacity: 1;
    }

    .hex-id {
      color: $accent-gold;
    }
  }

  &.is-navigating {
    pointer-events: none;

    .navigating-overlay {
      position: absolute;
      inset: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(13, 15, 17, 0.92);

      .loading-counter {
        font-family: "Courier New", "Source Code Pro", monospace;
        font-size: 48px;
        font-weight: 700;
        color: $accent-gold;
        text-shadow: 0 0 20px rgba(242, 201, 76, 0.5);
      }
    }
  }

  // 左侧状态条
  .status-bar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    opacity: 0.6;
    transition: opacity 0.15s ease;
    z-index: 2;
  }

  &.status-tech .status-bar {
    background: $link-blue;
    box-shadow: 0 0 6px rgba(88, 166, 255, 0.4);
  }
  &.status-life .status-bar {
    background: $status-green;
    box-shadow: 0 0 6px rgba(63, 185, 80, 0.4);
  }
  &.status-thought .status-bar {
    background: $status-yellow;
    box-shadow: 0 0 6px rgba(210, 153, 26, 0.4);
  }
  &.status-default .status-bar {
    background: $text-muted;
  }

  // Grid 模式
  &.grid {
    .card-inner {
      display: flex;
      flex-direction: column;
    }
    .cover-wrapper {
      height: 200px;
    }
    .content-wrapper {
      padding: 20px;
    }
  }

  // List 模式
  &.list {
    .card-inner {
      display: flex;
      flex-direction: row;
      height: 180px;
    }
    .cover-wrapper {
      width: 280px;
      flex-shrink: 0;
    }
    .content-wrapper {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
  }

  .cover-wrapper {
    overflow: hidden;
    position: relative;

    :deep(.el-image) {
      width: 100%;
      height: 100%;
    }

    .image-placeholder,
    .image-error {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0d1117;
      color: $text-muted;
    }

    .placeholder-cursor {
      font-size: 24px;
      color: $accent-gold;
      animation: cursor-blink 1s step-end infinite;
    }
  }

  .content-wrapper {
    .title {
      font-size: 1.1rem;
      font-weight: 600;
      color: $text-bright;
      margin: 0 0 8px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .excerpt {
      font-size: 13px;
      color: $text-muted;
      line-height: 1.6;
      margin: 0 0 16px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  .footer-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    font-family: "Courier New", "Source Code Pro", monospace;
    font-size: 11px;
    color: $text-muted;

    .left {
      display: flex;
      gap: 16px;
    }

    .hex-id {
      font-size: 11px;
      color: lighten($text-muted, 5%);
      letter-spacing: 1px;
      transition: color 0.15s ease;
    }
  }
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
