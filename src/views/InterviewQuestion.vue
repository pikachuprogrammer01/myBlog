<template>
  <div class="interview-question">
    <!-- Breadcrumb -->
    <el-breadcrumb separator="/" class="blog-breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/interview' }">面试题库</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/interview/' + category }">
        {{ categoryLabel }}
      </el-breadcrumb-item>
      <el-breadcrumb-item>{{ question?.title }}</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
      <el-skeleton :rows="12" animated style="margin-top: 24px" />
    </div>

    <!-- Not found -->
    <div v-else-if="!question" class="empty-state">
      <el-empty description="题目不存在">
        <el-button type="primary" @click="$router.push('/interview')">
          返回题库
        </el-button>
      </el-empty>
    </div>

    <!-- Content -->
    <div v-else>
      <article class="question-article">
        <h1 class="question-title">{{ question.title }}</h1>

        <div class="question-meta">
          <el-tag :type="getDifficultyType(question.difficulty)" size="small">
            {{ getDifficultyLabel(question.difficulty) }}
          </el-tag>
          <span class="meta-category">{{ categoryLabel }}</span>
          <span class="meta-views">
            <el-icon><View /></el-icon> {{ question.view_count }}
          </span>
          <span class="meta-date">更新于 {{ formatDate(question.updated_at) }}</span>
        </div>

        <div v-if="question.tags && question.tags.length > 0" class="question-tags">
          <el-tag
            v-for="tag in question.tags"
            :key="tag"
            size="small"
            effect="plain"
            class="q-tag"
          >
            {{ tag }}
          </el-tag>
        </div>

        <el-divider />

        <div class="question-content">
          <MarkdownRenderer
            :content="question.content"
            :show-toc="true"
            :show-progress="true"
          />
        </div>
      </article>

      <!-- Related questions -->
      <div v-if="question.related && question.related.length > 0" class="related-section">
        <h3 class="related-title">
          <el-icon><Link /></el-icon>
          相关题目
        </h3>
        <div
          v-for="r in question.related"
          :key="r.id"
          class="blog-card related-card"
          @click="$router.push(`/interview/${r.category}/${r.id}`)"
        >
          <div class="related-header">
            <span class="related-q-title">{{ r.title }}</span>
            <el-tag :type="getDifficultyType(r.difficulty)" size="small">
              {{ getDifficultyLabel(r.difficulty) }}
            </el-tag>
          </div>
          <span class="related-views">
            <el-icon><View /></el-icon> {{ r.view_count }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Notebook, View, Link } from "@element-plus/icons-vue";
import { getInterviewQuestion } from "@/api/services/interviewService";
import MarkdownRenderer from "@/components/blog/MarkdownRenderer.vue";

const props = defineProps({
  category: { type: String, required: true },
  id: { type: String, required: true },
});

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

const question = ref(null);
const loading = ref(true);

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

onMounted(async () => {
  try {
    const res = await getInterviewQuestion(props.id);
    if (res.data.success) {
      question.value = res.data.data;
    }
  } catch {
    // question stays null → shows not-found state
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.interview-question {
  padding: var(--blog-spacing-md) 0;

  .blog-breadcrumb {
    margin-bottom: var(--blog-spacing-md);
  }

  .loading-state {
    padding: var(--blog-spacing-lg) 0;
  }

  .empty-state {
    text-align: center;
    padding: var(--blog-spacing-xl) 0;
  }

  .question-article {
    .question-title {
      margin: 0 0 var(--blog-spacing-md);
      font-size: 28px;
      font-weight: 700;
      line-height: 1.3;
      color: var(--blog-text-primary);
    }

    .question-meta {
      display: flex;
      align-items: center;
      gap: var(--blog-spacing-md);
      font-size: 14px;
      color: var(--blog-text-secondary);

      .meta-views {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .meta-date {
        margin-left: auto;
      }
    }

    .question-tags {
      display: flex;
      gap: 6px;
      margin-top: var(--blog-spacing-md);
    }

    .question-content {
      margin-top: var(--blog-spacing-md);
    }
  }

  .related-section {
    margin-top: var(--blog-spacing-xl);

    .related-title {
      display: flex;
      align-items: center;
      gap: var(--blog-spacing-sm);
      margin: 0 0 var(--blog-spacing-md);
      font-size: 18px;
      font-weight: 600;
    }

    .related-card {
      padding: var(--blog-spacing-md) var(--blog-spacing-lg);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--blog-shadow);
      }

      .related-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;

        .related-q-title {
          font-size: 15px;
          font-weight: 500;
          color: var(--blog-text-primary);
        }
      }

      .related-views {
        font-size: 13px;
        color: var(--blog-text-secondary);
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}
</style>
