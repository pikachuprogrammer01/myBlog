<template>
  <div class="about">
    <h1 class="blog-page-title">
      <el-icon><User /></el-icon>
      关于我
    </h1>
    <div class="blog-card">
      <p>这是关于我页面，将展示个人介绍、技能、经历和时间线。</p>
      <p>功能待实现...</p>
    </div>
  </div>
</template>

<script setup>
import { User } from '@element-plus/icons-vue'
</script>

<style scoped lang="scss">
.about {
  padding: var(--blog-spacing-md) 0;
}
</style>