<template>
  <div class="section-header">
    <div class="header-left">
      <el-icon><Document /></el-icon>
      <span class="title">最新文章</span>
    </div>
    <div class="header-right">
      <el-radio-group
        :model-value="layout"
        @update:model-value="$emit('update:layout', $event)"
        size="small"
      >
        <el-radio-button value="grid"
          ><el-icon><Grid /></el-icon
        ></el-radio-button>
        <el-radio-button value="list"
          ><el-icon><Fold /></el-icon
        ></el-radio-button>
      </el-radio-group>
    </div>
  </div>
</template>

<script setup>
  import { Document, Grid, Fold } from "@element-plus/icons-vue";
  defineProps(["layout"]);
  defineEmits(["update:layout"]);
</script>
