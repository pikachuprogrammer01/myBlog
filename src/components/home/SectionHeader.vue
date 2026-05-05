<template>
  <div class="section-header">
    <div class="header-left">
      <span class="sys-prefix">&gt;&gt;</span>
      <span class="title">最新文章</span>
      <span class="sys-suffix">_</span>
    </div>
    <div class="header-right">
      <button
        :class="['toggle-btn', { active: layout === 'grid' }]"
        @click="$emit('update:layout', 'grid')"
      >
        <el-icon><Grid /></el-icon>
        <span>GRID</span>
      </button>
      <button
        :class="['toggle-btn', { active: layout === 'list' }]"
        @click="$emit('update:layout', 'list')"
      >
        <el-icon><Fold /></el-icon>
        <span>LIST</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { Grid, Fold } from "@element-plus/icons-vue";
defineProps(["layout"]);
defineEmits(["update:layout"]);
</script>

<style lang="scss" scoped>
$bg-panel: #161b22;
$border-color: #30363d;
$accent-gold: #f2c94c;
$text-bright: #e6edf3;
$text-muted: #8b949e;

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid $border-color;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: "Courier New", "Source Code Pro", monospace;
    font-size: 1rem;
    color: $text-bright;

    .sys-prefix {
      color: $accent-gold;
      font-weight: 700;
    }

    .sys-suffix {
      color: $accent-gold;
      animation: cursor-blink 1s step-end infinite;
    }
  }

  .header-right {
    display: flex;
    gap: 0;
    border: 1px solid $border-color;
    border-radius: 2px;
    overflow: hidden;

    .toggle-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      font-family: "Courier New", "Source Code Pro", monospace;
      font-size: 11px;
      letter-spacing: 1px;
      color: $text-muted;
      background: $bg-panel;
      border: none;
      cursor: pointer;
      transition: all 0.12s ease;

      &:not(:last-child) {
        border-right: 1px solid $border-color;
      }

      &:hover {
        color: $text-bright;
        background: lighten($bg-panel, 3%);
      }

      &.active {
        color: #0d1117;
        background: $accent-gold;
        font-weight: 700;
      }
    }
  }
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
