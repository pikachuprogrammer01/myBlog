<template>
  <aside class="home-sidebar">
    <div class="sidebar-widget">
      <div class="author-card">
        <el-avatar
          :size="80"
          src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Gemini"
        />
        <h3 class="author-name">Gemini Blogger</h3>
        <p class="author-bio">Vue 3 爱好者 & 全栈开发者</p>
        <div class="author-stats">
          <div class="stat-item"><span>12</span>文章</div>
          <div class="stat-item"><span>5</span>项目</div>
        </div>
      </div>
    </div>

    <div class="sidebar-widget">
      <h3 class="widget-title">热门标签</h3>
      <div class="tag-cloud">
        <el-tag
          v-for="t in tags"
          :key="t"
          class="tag-item"
          effect="plain"
          round
          clickable
        >
          {{ t }}
        </el-tag>
      </div>
    </div>
  </aside>
</template>

<script setup>
  defineProps({
    tags: {
      type: Array,
      default: () => ["Vue3", "Element+", "Vite", "Sass", "Pinia"],
    },
  });
</script>
