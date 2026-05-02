<template>
  <aside class="home-sidebar">
    <div class="sidebar-widget author-card-wrapper">
      <div class="author-header-bg"></div>
      <div class="author-info">
        <el-avatar class="avatar-float" :size="80" :src="authorImage" />
        <h3 class="name">wushu Blogger</h3>
        <p class="bio">Exploring Vue 3 Ecosystem</p>

        <div class="stats-grid">
          <div class="stat-box">
            <span class="num">12</span>
            <span class="label">ARTICLES</span>
          </div>
          <div class="divider"></div>
          <div class="stat-box">
            <span class="num">5</span>
            <span class="label">PROJECTS</span>
          </div>
        </div>
      </div>
    </div>

    <div class="sidebar-widget">
      <h3 class="widget-title">热门标签</h3>
      <div class="tag-flex">
        <el-tag v-for="t in tags" :key="t.tag || t" class="modern-tag" effect="light"
          ># {{ t.tag || t }}</el-tag
        >
      </div>
    </div>
  </aside>
</template>

<script setup>
  const authorImage = "https://api.dicebear.com/7.x/pixel-art/svg?seed=Gemini";
  defineProps({
    tags: {
      type: Array,
      default: () => ["Vue3", "Element+", "Vite", "Sass", "Pinia"],
    },
  });
</script>

<style lang="scss" scoped>
  .author-card-wrapper {
    position: relative;
    padding: 0 !important;
    overflow: hidden;

    .author-header-bg {
      height: 80px;
      background: linear-gradient(
        45deg,
        var(--el-color-primary),
        var(--el-color-success)
      );
    }

    .author-info {
      padding: 0 24px 24px;
      text-align: center;
      margin-top: -40px;

      .avatar-float {
        border: 4px solid white;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        margin-bottom: 10px;
        transition: transform 0.3s;
        &:hover {
          transform: rotate(5deg) scale(1.1);
        }
      }

      .stats-grid {
        display: flex;
        justify-content: space-around;
        align-items: center;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #eee;

        .num {
          font-weight: bold;
          font-size: 1.2rem;
          display: block;
        }
        .label {
          font-size: 10px;
          color: #999;
          letter-spacing: 1px;
        }
        .divider {
          width: 1px;
          height: 30px;
          background: #eee;
        }
      }
    }
  }

  .modern-tag {
    border: none;
    background: #f0f2f5;
    color: #606266;
    margin: 4px;
    cursor: pointer;
    &:hover {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }
  }
</style>
