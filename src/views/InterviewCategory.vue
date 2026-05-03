<template>
  <div class="interview-category">
    <!-- Breadcrumb -->
    <el-breadcrumb separator="/" class="blog-breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/interview' }">面试题库</el-breadcrumb-item>
      <el-breadcrumb-item>{{ categoryLabel }}</el-breadcrumb-item>
    </el-breadcrumb>

    <h1 class="blog-page-title">
      <el-icon><Notebook /></el-icon>
      {{ categoryLabel }}
    </h1>

    <!-- Stats bar -->
    <div class="stats-bar">
      <span class="stat-text">共 <strong>{{ total }}</strong> 道题目</span>
    </div>

    <!-- Difficulty filter -->
    <div class="filter-bar">
      <el-radio-group v-model="difficultyFilter" size="small" @change="onFilterChange">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="easy">简单</el-radio-button>
        <el-radio-button value="medium">中等</el-radio-button>
        <el-radio-button value="hard">困难</el-radio-button>
      </el-radio-group>
    </div>

    <!-- Loading -->
    <div v-if="loading">
      <div v-for="i in 3" :key="i" class="blog-card skeleton-card">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="h3" style="width: 70%" />
            <el-skeleton-item variant="text" style="width: 90%; margin-top: 8px" />
            <div style="display: flex; gap: 8px; margin-top: 12px">
              <el-skeleton-item variant="text" style="width: 40px" />
              <el-skeleton-item variant="text" style="width: 60px" />
            </div>
          </template>
        </el-skeleton>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="questions.length === 0" class="empty-state">
      <el-empty :description="difficultyFilter ? '该难度暂无题目' : '该分类暂无题目'" />
    </div>

    <!-- Question list -->
    <div v-else>
      <div
        v-for="q in questions"
        :key="q.id"
        class="blog-card question-card"
        @click="$router.push(`/interview/${q.category}/${q.id}`)"
      >
        <div class="q-header">
          <h3 class="q-title">{{ q.title }}</h3>
          <el-tag :type="getDifficultyType(q.difficulty)" size="small">
            {{ getDifficultyLabel(q.difficulty) }}
          </el-tag>
        </div>
        <p v-if="q.summary" class="q-summary">{{ q.summary }}</p>
        <div class="q-meta">
          <span class="q-views">
            <el-icon><View /></el-icon> {{ q.view_count }}
          </span>
          <span v-if="q.tags && q.tags.length > 0" class="q-tags">
            <el-tag
              v-for="tag in q.tags"
              :key="tag"
              size="small"
              effect="plain"
              class="q-tag"
            >
              {{ tag }}
            </el-tag>
          </span>
          <span class="q-date">{{ formatDate(q.created_at) }}</span>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          :page-size="limit"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadQuestions"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { Notebook, View } from "@element-plus/icons-vue";
import { getInterviewQuestions } from "@/api/services/interviewService";

const props = defineProps({
  category: { type: String, required: true },
});

const route = useRoute();

const CATEGORY_LABELS = {
  js: "JavaScript",
  vue: "Vue.js",
  css: "CSS",
  algorithm: "算法",
  engineering: "工程化",
  project: "项目经验",
};

const DIFFICULTY_LABELS = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

const categoryLabel = computed(() => CATEGORY_LABELS[props.category] || props.category);

const questions = ref([]);
const loading = ref(false);
const page = ref(1);
const limit = ref(10);
const total = ref(0);
const totalPages = ref(0);
const difficultyFilter = ref("");

function getDifficultyType(d) {
  if (d === "easy") return "success";
  if (d === "medium") return "warning";
  return "danger";
}

function getDifficultyLabel(d) {
  return DIFFICULTY_LABELS[d] || d;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

function onFilterChange() {
  page.value = 1;
  loadQuestions();
}

async function loadQuestions() {
  loading.value = true;
  try {
    const params = {
      category: props.category,
      page: page.value,
      limit: limit.value,
    };
    if (difficultyFilter.value) {
      params.difficulty = difficultyFilter.value;
    }
    const res = await getInterviewQuestions(params);
    if (res.data.success) {
      questions.value = res.data.data;
      total.value = res.data.pagination.total;
      totalPages.value = res.data.pagination.totalPages;
    }
  } catch {
    // Keep current data
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.params.category,
  (newCat) => {
    if (newCat) {
      page.value = 1;
      difficultyFilter.value = "";
      loadQuestions();
    }
  }
);

onMounted(() => {
  loadQuestions();
});
</script>

<style scoped lang="scss">
.interview-category {
  padding: var(--blog-spacing-md) 0;

  .blog-breadcrumb {
    margin-bottom: var(--blog-spacing-sm);
  }

  .stats-bar {
    margin-bottom: var(--blog-spacing-md);
    color: var(--blog-text-secondary);
    font-size: 14px;

    strong {
      color: var(--blog-primary-color);
      font-size: 18px;
    }
  }

  .filter-bar {
    margin-bottom: var(--blog-spacing-lg);
  }

  .skeleton-card {
    padding: var(--blog-spacing-lg);
  }

  .question-card {
    padding: var(--blog-spacing-lg);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--blog-shadow);
    }

    .q-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--blog-spacing-md);
      margin-bottom: var(--blog-spacing-sm);

      .q-title {
        margin: 0;
        font-size: 17px;
        font-weight: 600;
        color: var(--blog-text-primary);
        line-height: 1.4;
      }
    }

    .q-summary {
      margin: 0 0 var(--blog-spacing-sm);
      color: var(--blog-text-secondary);
      font-size: 14px;
      line-height: 1.6;
    }

    .q-meta {
      display: flex;
      align-items: center;
      gap: var(--blog-spacing-md);
      font-size: 13px;
      color: var(--blog-text-secondary);

      .q-views {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .q-tags {
        display: flex;
        gap: 4px;
      }

      .q-date {
        margin-left: auto;
      }
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: center;
    margin-top: var(--blog-spacing-lg);
  }

  .empty-state {
    text-align: center;
    padding: var(--blog-spacing-xl) 0;
  }
}
</style>
