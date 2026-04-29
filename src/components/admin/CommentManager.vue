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

    <el-table
      v-if="comments.length !== 0"
      :data="comments"
      @selection-change="handleSelectionChange"
      style="width: 100%"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="username" label="用户" width="120" />
      <el-table-column prop="content" label="内容" min-width="200" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="danger" size="small" @click="$emit('delete', row.id)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-else description="暂无评论">
      <template #image>
        <el-icon><ChatDotRound /></el-icon>
      </template>
    </el-empty>
  </div>
</template>

<script setup>
  import { ref } from "vue";
  import { ChatDotRound } from "@element-plus/icons-vue";

  defineProps(["comments"]);
  const emit = defineEmits(["delete", "batchDelete"]);

  const selectedIds = ref([]);
  const handleSelectionChange = (selection) => {
    selectedIds.value = selection.map((item) => item.id);
  };

  const handleBatchDelete = () => {
    emit("batchDelete", selectedIds.value);
    selectedIds.value = []; // 清空选择
  };
</script>
