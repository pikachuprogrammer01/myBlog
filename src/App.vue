<template>
  <header v-if="isShow">
    <Header />
  </header>

  <main>
    <Main />
  </main>

  <footer v-if="isShow">
    <Footer />
  </footer>
</template>

<script setup>
  import { computed } from "vue";
  import { useRoute } from "vue-router";

  import Header from "@/components/layout/Header.vue";
  import Footer from "@/components/layout/Footer.vue";
  import Main from "@/components/layout/Main.vue";

  // 当前路由
  const route = useRoute();

  // 不显示 header/footer 的页面
  const hideLayoutRoutes = ["/login", "/register", "/404"];

  // 是否显示
  const isShow = computed(() => {
    return !hideLayoutRoutes.includes(route.path);
  });
</script>
