<template>
  <div class="blog-card">
    <div class="section-header">
      <h3>
        <el-icon><DataAnalysis /></el-icon> 数据操作
      </h3>
    </div>
    <div class="data-actions">
      <el-button type="primary" @click="$emit('export')">导出数据</el-button>
      <el-button type="warning" @click="$emit('clearComments')"
        >清空评论</el-button
      >
      <el-button type="danger" @click="$emit('resetAll')">重置系统</el-button>
    </div>
  </div>
</template>

<script setup>
  import { DataAnalysis } from "@element-plus/icons-vue";
</script>
