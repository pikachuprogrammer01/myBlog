<template>
  <div class="blog-card">
    <div class="section-header">
      <h3>
        <el-icon><ChatDotRound /></el-icon> 评论管理
      </h3>
      <el-button
        type="danger"
        :disabled="selectedIds.length === 0"
        @click="handleBatchDelete"
      >
        批量删除 ({{ selectedIds.length }})
      </el-button>
    </div>

    <div v-if="comments.length === 0" class="empty-state">
      <el-empty description="暂无评论" />
    </div>

    <div v-else class="comment-list">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="comment-item"
        :class="{ selected: selectedIds.includes(comment.id) }"
      >
        <el-checkbox
          :model-value="selectedIds.includes(comment.id)"
          class="comment-checkbox"
          @change="(val) => toggleSelect(comment.id, val)"
        />

        <div class="comment-body">
          <div class="comment-meta">
            <span class="comment-user">
              <el-icon><User /></el-icon>
              {{ comment.username }}
            </span>
            <span v-if="comment.articleTitle" class="comment-article">
              来自
              <router-link
                v-if="comment.articleSlug"
                :to="`/article/${comment.articleSlug}`"
              >
                {{ comment.articleTitle }}
              </router-link>
              <span v-else>{{ comment.articleTitle }}</span>
            </span>
          </div>
          <p class="comment-content">{{ comment.content }}</p>
        </div>

        <el-button
          type="danger"
          size="small"
          plain
          @click="$emit('delete', comment.id)"
        >
          删除
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from "vue";
  import { ChatDotRound, User } from "@element-plus/icons-vue";

  defineProps(["comments"]);
  const emit = defineEmits(["delete", "batchDelete"]);

  const selectedIds = ref([]);

  const toggleSelect = (id, checked) => {
    if (checked) {
      selectedIds.value.push(id);
    } else {
      selectedIds.value = selectedIds.value.filter((i) => i !== id);
    }
  };

  const handleBatchDelete = () => {
    emit("batchDelete", [...selectedIds.value]);
    selectedIds.value = [];
  };
</script>

<style scoped lang="scss">
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--blog-spacing-md);

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .empty-state {
    padding: var(--blog-spacing-xl) 0;
  }

  .comment-list {
    display: flex;
    flex-direction: column;
    gap: var(--blog-spacing-sm);
  }

  .comment-item {
    display: flex;
    align-items: flex-start;
    gap: var(--blog-spacing-sm);
    padding: var(--blog-spacing-sm) var(--blog-spacing-md);
    border: 1px solid var(--blog-border-lighter);
    border-radius: var(--blog-border-radius);
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--blog-bg-gray);
    }

    &.selected {
      background-color: var(--blog-primary-light);
      border-color: var(--blog-primary-color);
    }
  }

  .comment-checkbox {
    margin-top: 2px;
  }

  .comment-body {
    flex: 1;
    min-width: 0;
  }

  .comment-meta {
    display: flex;
    align-items: center;
    gap: var(--blog-spacing-md);
    margin-bottom: 6px;
    font-size: 13px;
    color: var(--blog-text-secondary);

    .comment-user {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--blog-text-regular);
      font-weight: 500;
    }

    .comment-article {
      a {
        color: var(--blog-primary-color);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .comment-content {
    margin: 0;
    font-size: 14px;
    color: var(--blog-text-regular);
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
