<template>
  <div class="interview">
    <h1 class="blog-page-title">
      <el-icon><Notebook /></el-icon>
      面试题库
    </h1>

    <div v-if="loading" class="category-grid">
      <div v-for="i in 6" :key="i" class="blog-card skeleton-card">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="h3" style="width: 60%" />
            <el-skeleton-item variant="text" style="width: 40%; margin-top: 12px" />
            <div style="display: flex; gap: 8px; margin-top: 16px">
              <el-skeleton-item variant="text" style="width: 50px" />
              <el-skeleton-item variant="text" style="width: 50px" />
              <el-skeleton-item variant="text" style="width: 50px" />
            </div>
          </template>
        </el-skeleton>
      </div>
    </div>

    <div v-else-if="categories.length === 0" class="empty-state">
      <el-empty description="暂无题目" />
    </div>

    <div v-else class="category-grid">
      <div
        v-for="cat in categories"
        :key="cat.category"
        class="blog-card category-card"
        @click="$router.push(`/interview/${cat.category}`)"
      >
        <div class="card-header">
          <h2>{{ cat.label }}</h2>
          <el-icon :size="20"><ArrowRight /></el-icon>
        </div>
        <div class="card-total">
          <span class="total-count">{{ cat.count }}</span>
          <span class="total-label">道题目</span>
        </div>
        <div class="card-difficulty">
          <el-tag :type="cat.easy > 0 ? 'success' : 'info'" size="small" effect="plain">
            简单 {{ cat.easy }}
          </el-tag>
          <el-tag :type="cat.medium > 0 ? 'warning' : 'info'" size="small" effect="plain">
            中等 {{ cat.medium }}
          </el-tag>
          <el-tag :type="cat.hard > 0 ? 'danger' : 'info'" size="small" effect="plain">
            困难 {{ cat.hard }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Notebook, ArrowRight } from "@element-plus/icons-vue";
import { getInterviewCategories } from "@/api/services/interviewService";

const categories = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await getInterviewCategories();
    if (res.data.success) {
      categories.value = res.data.data;
    }
  } catch {
    // Show empty state
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.interview {
  padding: var(--blog-spacing-md) 0;

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--blog-spacing-lg);

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  .skeleton-card {
    padding: var(--blog-spacing-lg);
  }

  .category-card {
    padding: var(--blog-spacing-lg);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--blog-shadow);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--blog-spacing-md);

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--blog-text-primary);
      }

      .el-icon {
        color: var(--blog-text-secondary);
        transition: transform 0.2s;
      }
    }

    &:hover .card-header .el-icon {
      transform: translateX(4px);
    }

    .card-total {
      margin-bottom: var(--blog-spacing-md);

      .total-count {
        font-size: 36px;
        font-weight: 700;
        color: var(--blog-primary-color);
      }

      .total-label {
        margin-left: var(--blog-spacing-xs);
        font-size: 14px;
        color: var(--blog-text-secondary);
      }
    }

    .card-difficulty {
      display: flex;
      gap: var(--blog-spacing-sm);
    }
  }

  .empty-state {
    text-align: center;
    padding: var(--blog-spacing-xl) 0;
  }
}
</style>
