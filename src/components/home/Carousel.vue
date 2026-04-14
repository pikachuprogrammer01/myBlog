<template>
  <div class="home-carousel">
    <el-carousel
      height="450px"
      motion-blur
      indicator-position="outside"
      arrow="always"
    >
      <el-carousel-item v-for="item in items" :key="item.id">
        <div
          class="carousel-item-content"
          @click="$router.push(`/article/${item.id}`)"
        >
          <div
            class="bg-image"
            :style="{ backgroundImage: `url(${item.cover})` }"
          ></div>

          <div class="carousel-overlay">
            <div class="content-box">
              <span class="category-tag" v-if="item.categories">{{
                item.categories[0]
              }}</span>
              <h3 class="title">{{ item.title }}</h3>
              <p class="excerpt">{{ item.excerpt }}</p>
              <div class="action-hint">
                阅读详情 <el-icon><Right /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<script setup>
  import { Right } from "@element-plus/icons-vue";
  defineProps({
    items: { type: Array, default: () => [] },
  });
</script>

<style lang="scss" scoped>
  .home-carousel {
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 40px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);

    .carousel-item-content {
      height: 100%;
      cursor: pointer;
      position: relative;
      overflow: hidden;

      .bg-image {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        transition: transform 6s linear; // JS动效细节：缓慢的缩放效果
      }

      // 激活状态下的图片动画
      &:hover .bg-image {
        transform: scale(1.1);
      }

      .carousel-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          90deg,
          rgba(0, 0, 0, 0.7) 0%,
          transparent 60%
        );
        display: flex;
        align-items: center;
        padding: 0 60px;

        .content-box {
          max-width: 500px;
          color: white;
          transform: translateY(20px);
          opacity: 0;
          animation: slideUp 0.8s forwards ease-out 0.2s; // 进入动画

          .category-tag {
            background: var(--el-color-primary);
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            text-transform: uppercase;
          }

          .title {
            font-size: 2.5rem;
            margin: 15px 0;
            font-weight: 700;
            line-height: 1.2;
          }

          .excerpt {
            font-size: 1.1rem;
            opacity: 0.8;
            margin-bottom: 25px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }
      }
    }
  }

  @keyframes slideUp {
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
