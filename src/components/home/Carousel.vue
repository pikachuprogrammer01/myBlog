<template>
  <div class="home-carousel">
    <el-carousel
      height="420px"
      indicator-position="outside"
      arrow="always"
      :interval="5000"
    >
      <el-carousel-item v-for="item in items" :key="item.id">
        <div
          class="carousel-item-content"
          @click="$router.push(`/article/${item.id}`)"
        >
          <div
            class="bg-image"
            :style="{ backgroundImage: `url(${getCoverUrl(item)})` }"
          ></div>

          <!-- 扫描线叠加层 -->
          <div class="scanlines"></div>

          <div class="carousel-overlay">
            <div class="content-box">
              <div class="category-row">
                <span class="sys-prefix">&gt;</span>
                <span class="category-tag" v-if="item.categories">{{
                  item.categories[0]
                }}</span>
                <span class="sys-prefix">_</span>
              </div>
              <h3 class="title">{{ item.title }}</h3>
              <p class="excerpt">{{ item.excerpt }}</p>
              <div class="action-hint">
                <span class="bracket">[</span>
                阅读详情
                <span class="bracket">]</span>
              </div>
            </div>
          </div>

          <!-- 角落装饰 -->
          <div class="corner-tl"></div>
          <div class="corner-br"></div>
        </div>
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<script setup>
import { resolveArticleCover } from "@/utils/article-cover";

defineProps({
  items: { type: Array, default: () => [] },
});

const getCoverUrl = (item) =>
  resolveArticleCover(item?.cover, item?.id || item?.title);
</script>

<style lang="scss" scoped>
$bg-panel: #161b22;
$border-color: #30363d;
$accent-gold: #f2c94c;
$text-bright: #e6edf3;
$text-muted: #8b949e;

.home-carousel {
  border: 1px solid $border-color;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 32px;
  background: $bg-panel;
  box-shadow: 4px 4px 0px #000;
  position: relative;

  // 重写 Element Plus 走马灯样式
  :deep(.el-carousel__indicators) {
    .el-carousel__indicator {
      .el-carousel__button {
        height: 2px;
        border-radius: 0;
        background: $border-color;
        transition: background 0.15s ease;
      }
      &.is-active .el-carousel__button {
        background: $accent-gold;
      }
    }
  }

  :deep(.el-carousel__arrow) {
    background: rgba(22, 27, 34, 0.85);
    border: 1px solid $border-color;
    border-radius: 2px;
    color: $text-muted;
    width: 36px;
    height: 36px;
    transition: all 0.15s ease;
    box-shadow: 2px 2px 0px #000;

    &:hover {
      background: $bg-panel;
      color: $accent-gold;
      border-color: $accent-gold;
      transform: translate(1px, 1px);
      box-shadow: 1px 1px 0px #000;
    }
  }

  .carousel-item-content {
    height: 100%;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    background: #0d1117;

    .bg-image {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      transition: transform 8s linear;
      opacity: 0.55;
    }

    &:hover .bg-image {
      transform: scale(1.08);
    }

    .scanlines {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.15) 2px,
        rgba(0, 0, 0, 0.15) 4px
      );
      z-index: 2;
    }

    .carousel-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      padding: 0 80px;
      z-index: 3;

      .content-box {
        max-width: 560px;
        animation: fadeUp 0.6s forwards ease-out 0.15s;
        opacity: 0;
        transform: translateY(16px);

        .category-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;

          .sys-prefix {
            font-family: "Courier New", "Source Code Pro", monospace;
            color: $accent-gold;
            font-size: 14px;
          }

          .category-tag {
            font-family: "Courier New", "Source Code Pro", monospace;
            font-size: 11px;
            color: $text-bright;
            background: rgba(242, 201, 76, 0.12);
            border: 1px solid rgba(242, 201, 76, 0.25);
            padding: 3px 10px;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
        }

        .title {
          font-size: 2.2rem;
          margin: 0 0 16px;
          font-weight: 700;
          line-height: 1.25;
          color: $text-bright;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
        }

        .excerpt {
          font-size: 1rem;
          color: $text-muted;
          margin: 0 0 24px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.6;
        }

        .action-hint {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: "Courier New", "Source Code Pro", monospace;
          font-size: 13px;
          color: $accent-gold;
          letter-spacing: 2px;

          .bracket {
            color: $text-muted;
          }
        }
      }
    }

    // 角落 L 型装饰
    .corner-tl,
    .corner-br {
      position: absolute;
      width: 20px;
      height: 20px;
      z-index: 4;
      pointer-events: none;
      opacity: 0.5;
    }

    .corner-tl {
      top: 16px;
      left: 16px;
      border-top: 1px solid $accent-gold;
      border-left: 1px solid $accent-gold;
    }

    .corner-br {
      bottom: 16px;
      right: 16px;
      border-bottom: 1px solid $accent-gold;
      border-right: 1px solid $accent-gold;
    }
  }
}

@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
