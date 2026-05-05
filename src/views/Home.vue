<template>
  <div class="blog-home">
    <!-- 网格点阵背景 -->
    <div class="grid-bg"></div>

    <!-- 四角 L 型装饰 -->
    <div class="corner-deco corner-tl"></div>
    <div class="corner-deco corner-tr"></div>
    <div class="corner-deco corner-bl"></div>
    <div class="corner-deco corner-br"></div>

    <div class="blog-home__container">
      <Carousel :items="featuredArticles" />

      <div class="blog-home__layout">
        <main class="home-main">
          <SectionHeader v-model:layout="layout" />

          <el-skeleton :loading="!articles.length" animated :count="3">
            <template #template>
              <div class="skeleton-row" v-for="n in 3" :key="n">
                <div class="skeleton-img"></div>
                <div class="skeleton-lines">
                  <div class="sk-line sk-line-1"></div>
                  <div class="sk-line sk-line-2"></div>
                  <div class="sk-line sk-line-3"></div>
                </div>
              </div>
            </template>

            <template #default>
              <div :class="['article-wrapper', `is-${layout}`]">
                <ArticleCard
                  v-for="item in articles"
                  :key="item.id"
                  :article="item"
                  :layout="layout"
                />
              </div>
            </template>
          </el-skeleton>

          <el-pagination
            v-if="total > pageSize"
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            background
            layout="prev, pager, next"
            class="home-pagination"
          />
        </main>
        <Sidebar v-if="articles.length" :tags="popularTags" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from "vue";
import useHome from "@/composables/useHomeArticles.js";

import Carousel from "@/components/home/Carousel.vue";
import SectionHeader from "@/components/home/SectionHeader.vue";

const ArticleCard = defineAsyncComponent(
  () => import("@/components/blog/ArticleCard.vue"),
);
const Sidebar = defineAsyncComponent(
  () => import("@/components/home/Sidebar.vue"),
);

const { layout, currentPage, pageSize, total, articles, featuredArticles, popularTags } =
  useHome();
</script>

<style lang="scss" scoped>
$bg-deep: #0d0f11;
$bg-panel: #161b22;
$border-color: #30363d;
$accent-gold: #f2c94c;
$text-bright: #e6edf3;
$text-muted: #8b949e;
$radius: 2px;

.blog-home {
  min-height: 100vh;
  background: $bg-deep;
  color: $text-bright;
  position: relative;
  overflow: hidden;

  // 16px 网格点阵
  .grid-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.03) 1px,
      transparent 1px
    );
    background-size: 16px 16px;
  }

  // 四角 L 型装饰
  .corner-deco {
    position: fixed;
    width: 28px;
    height: 28px;
    z-index: 1;
    pointer-events: none;
    opacity: 0.4;
  }
  .corner-tl {
    top: 20px;
    left: 20px;
    border-top: 1px solid $accent-gold;
    border-left: 1px solid $accent-gold;
  }
  .corner-tr {
    top: 20px;
    right: 20px;
    border-top: 1px solid $accent-gold;
    border-right: 1px solid $accent-gold;
  }
  .corner-bl {
    bottom: 20px;
    left: 20px;
    border-bottom: 1px solid $accent-gold;
    border-left: 1px solid $accent-gold;
  }
  .corner-br {
    bottom: 20px;
    right: 20px;
    border-bottom: 1px solid $accent-gold;
    border-right: 1px solid $accent-gold;
  }

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 28px 20px 40px;
    position: relative;
    z-index: 2;
  }

  &__layout {
    display: flex;
    gap: 28px;

    @media (max-width: 992px) {
      flex-direction: column;
    }
  }

  .home-main {
    flex: 1;
    min-width: 0;

    .article-wrapper {
      display: grid;
      gap: 20px;
      margin-bottom: 32px;

      &.is-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      }
      &.is-list {
        grid-template-columns: 1fr;
      }
    }
  }
}

// 骨架屏
.skeleton-row {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: $bg-panel;
  border: 1px solid $border-color;
  border-radius: $radius;
  margin-bottom: 16px;

  .skeleton-img {
    width: 200px;
    height: 140px;
    background: lighten($bg-panel, 3%);
    border-radius: $radius;
    animation: sk-pulse 1.6s ease-in-out infinite;
  }

  .skeleton-lines {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 8px;

    .sk-line {
      height: 14px;
      background: lighten($bg-panel, 3%);
      border-radius: 1px;
      animation: sk-pulse 1.6s ease-in-out infinite;

      &-1 { width: 50%; }
      &-2 { width: 85%; }
      &-3 { width: 30%; }
    }
  }
}

@keyframes sk-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.75; }
}

// 分页
.home-pagination {
  display: flex;
  justify-content: center;
  padding-top: 8px;

  :deep(.el-pager li),
  :deep(.btn-prev),
  :deep(.btn-next) {
    background: $bg-panel !important;
    border: 1px solid $border-color !important;
    border-radius: $radius !important;
    color: $text-muted !important;
    font-family: "Courier New", monospace !important;
    font-size: 13px !important;
    min-width: 36px !important;
    height: 36px !important;
    box-shadow: 2px 2px 0px #000 !important;
    transition: all 0.12s ease !important;

    &:hover {
      color: $text-bright !important;
      border-color: lighten($border-color, 10%) !important;
      transform: translate(1px, 1px);
      box-shadow: 1px 1px 0px #000 !important;
    }
  }

  :deep(.el-pager li.is-active) {
    background: $accent-gold !important;
    border-color: $accent-gold !important;
    color: #0d1117 !important;
    font-weight: 700 !important;
    box-shadow: 2px 2px 0px darken($accent-gold, 20%) !important;
  }
}

// 响应式
@media (max-width: 992px) {
  .blog-home__layout {
    flex-direction: column;
  }
}
</style>
