<template>
  <div class="blog-home">
    <div class="blog-home__container">
      <Carousel :items="featuredArticles" />

      <div class="blog-home__layout">
        <main class="home-main">
          <SectionHeader v-model:layout="layout" />

          <div :class="['article-wrapper', `is-${layout}`]">
            <ArticleCard
              v-for="item in articles"
              :key="item.id"
              :article="item"
              :layout="layout"
            />
          </div>

          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            background
            layout="prev, pager, next"
            class="home-pagination"
          />
        </main>

        <Sidebar />
      </div>
    </div>
  </div>
</template>

<script setup>
  // 逻辑抽离
  import useHome from "@/composables/useHomeArticles.js";

  // 组件引入
  import Carousel from "@/components/home/Carousel.vue";
  import Sidebar from "@/components/home/Sidebar.vue";
  import SectionHeader from "@/components/home/SectionHeader.vue";
  import ArticleCard from "@/components/blog/ArticleCard.vue"; // 公共组件

  // 初始化逻辑
  const { layout, currentPage, pageSize, total, articles, featuredArticles } =
    useHome();
</script>

<style lang="scss" scoped>
  @use "@/assets/styles/pages/home.scss";
</style>
