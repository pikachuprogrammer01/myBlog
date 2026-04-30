<template>
  <div class="app-layout">
    <!-- 主体内容 -->
    <main class="app-main">
      <div class="container">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- 回到顶部按钮 -->
    <back-to-top
      :visibility-height="300"
      :show-text="false"
      circular
      size="default"
      :show-on-mobile="true"
    />

    <!-- 全局加载动画 -->
    <transition name="fade">
      <div v-if="loading" class="global-loading">
        <div class="loading-spinner">
          <el-icon class="loading-icon" :size="40"><Loading /></el-icon>
          <p>加载中...</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
  import { ref, watch, onMounted } from "vue";
  import { useRoute } from "vue-router";
  import { Loading } from "@element-plus/icons-vue";
  import { useArticleStore } from "@/stores/article";
  import BackToTop from "@/components/common/BackToTop.vue";

  const route = useRoute();
  const loading = ref(false);

  // 应用初始化时加载文章和分类（API 不可用时自动回退到静态 JSON）
  const articleStore = useArticleStore();
  onMounted(() => {
    articleStore.loadArticles();
    articleStore.loadCategories();
  });

  // 监听路由变化显示加载状态
  watch(
    () => route.path,
    (newPath, oldPath) => {
      if (newPath !== oldPath) {
        loading.value = true;
        setTimeout(() => {
          loading.value = false;
        }, 300); // 模拟加载延迟
      }
    },
  );
</script>

<style scoped lang="scss">
  .app-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--blog-bg-color);

    .app-main {
      flex: 1;
      padding-top: var(--blog-header-height);
      padding-bottom: var(--blog-spacing-xl);

      .container {
        max-width: var(--blog-container-width);
        margin: 0 auto;
        padding: 0 var(--blog-spacing-md);

        @media (max-width: 768px) {
          padding: 0 var(--blog-spacing-sm);
        }
      }
    }

    .global-loading {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;

      .loading-spinner {
        text-align: center;

        .loading-icon {
          color: var(--blog-primary-color);
          animation: spin 1s linear infinite;
        }

        p {
          margin-top: var(--blog-spacing-sm);
          color: var(--blog-text-secondary);
        }
      }
    }
  }

  // 页面切换动画
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  // 旋转动画
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .app-layout {
      .app-main {
        padding-top: calc(var(--blog-header-height) - 20px);
      }
    }
  }
</style>
