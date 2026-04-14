<template>
  <div class="blog-home">
    <div class="blog-home__container">
      <Carousel :items="featuredArticles" />

      <div class="blog-home__layout">
        <main class="home-main">
          <SectionHeader v-model:layout="layout" />

          <el-skeleton :loading="!articles.length" animated :count="3">
            <template #template>
              <div style="padding: 14px; display: flex; gap: 20px">
                <el-skeleton-item
                  variant="image"
                  style="width: 200px; height: 150px"
                />
                <div style="flex: 1">
                  <el-skeleton-item variant="p" style="width: 50%" />
                  <el-skeleton-item variant="text" />
                  <el-skeleton-item variant="text" style="width: 30%" />
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
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            background
            layout="prev, pager, next"
            class="home-pagination"
          />
        </main>
        <Sidebar v-if="articles.length" />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { defineAsyncComponent } from "vue";
  import useHome from "@/composables/useHomeArticles.js";

  // 1. 核心首屏组件同步引入
  import Carousel from "@/components/home/Carousel.vue";
  import SectionHeader from "@/components/home/SectionHeader.vue";

  // 2. 非首屏或较重的组件异步引入（懒加载）
  const ArticleCard = defineAsyncComponent(
    () => import("@/components/blog/ArticleCard.vue"),
  );
  const Sidebar = defineAsyncComponent(
    () => import("@/components/home/Sidebar.vue"),
  );

  // 初始化逻辑保持不变
  const { layout, currentPage, pageSize, total, articles, featuredArticles } =
    useHome();
</script>

<style lang="scss" scoped>
  @use "@/assets/styles/pages/home.scss";
</style>
