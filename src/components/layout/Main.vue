<template>
  <div class="app-layout" :class="{ 'is-auth-page': isAuthPage }">
    <main class="app-main">
      <div class="container">
        <router-view v-slot="{ Component }">
          <transition name="page-scan">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <back-to-top
      :visibility-height="300"
      :show-text="false"
      circular
      size="default"
      :show-on-mobile="true"
    />

    <transition name="fade">
      <div v-if="loading" class="global-loading">
        <div class="loading-counter">
          <span class="counter-text">{{ loadingPercent }}%</span>
          <span class="counter-cursor">_</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { useArticleStore } from "@/stores/article";
import BackToTop from "@/components/common/BackToTop.vue";

const route = useRoute();
const isAuthPage = computed(() => ["/login", "/register"].includes(route.path));

const loading = ref(false);
const loadingPercent = ref(0);

const articleStore = useArticleStore();
onMounted(() => {
  Promise.all([articleStore.loadArticles(), articleStore.loadCategories()]);
});
</script>

<style scoped lang="scss">
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #0d0f11;

  .app-main {
    flex: 1;
    padding-top: 64px;
    padding-bottom: 32px;

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px;

      @media (max-width: 768px) {
        padding: 0 12px;
      }
    }
  }

  .global-loading {
    position: fixed;
    inset: 0;
    background: rgba(13, 15, 17, 0.92);
    backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;

    .loading-counter {
      font-family: "Courier New", "Source Code Pro", monospace;
      font-size: 56px;
      font-weight: 700;
      color: #f2c94c;
      text-shadow: 0 0 24px rgba(242, 201, 76, 0.4);

      .counter-cursor {
        animation: cursor-blink 1s step-end infinite;
      }
    }
  }
}

// 扫描线页面过渡
.page-scan-enter-active,
.page-scan-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-scan-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-scan-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 登录/注册页：去除容器约束
.is-auth-page {
  overflow: hidden;

  :deep(.page-scan-enter-active),
  :deep(.page-scan-leave-active) {
    transition: none;
  }

  .app-main {
    padding-top: 0;
    padding-bottom: 0;

    .container {
      max-width: none;
      margin: 0;
      padding: 0;
    }
  }
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
