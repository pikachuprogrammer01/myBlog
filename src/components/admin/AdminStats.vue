<template>
  <div class="dashboard-stats">
    <div class="stat-card" v-for="item in statItems" :key="item.label">
      <div class="stat-icon">
        <el-icon><component :is="item.icon" /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ item.value }}</div>
        <div class="stat-label">{{ item.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from "vue";
  import { Document, ChatDotRound, User, View } from "@element-plus/icons-vue";

  const props = defineProps(["stats"]);

  const statItems = computed(() => [
    { label: "文章总数", value: props.stats.totalArticles, icon: Document },
    { label: "评论总数", value: props.stats.totalComments, icon: ChatDotRound },
    { label: "用户总数", value: props.stats.totalUsers, icon: User },
    { label: "总阅读量", value: props.stats.totalViews, icon: View },
  ]);
</script>

<style scoped>
  .dashboard-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--blog-spacing-md);
    margin-bottom: var(--blog-spacing-lg);

    .stat-card {
      display: flex;
      align-items: center;
      padding: var(--blog-spacing-lg);
      background-color: var(--blog-bg-gray);
      border-radius: var(--blog-border-radius);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--blog-shadow);
      }

      .stat-icon {
        margin-right: var(--blog-spacing-md);
        font-size: 24px;
        color: var(--blog-primary-color);
      }

      .stat-content {
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: var(--blog-spacing-xs);
        }

        .stat-label {
          font-size: 14px;
          color: var(--blog-text-secondary);
        }
      }
    }
  }
</style>
