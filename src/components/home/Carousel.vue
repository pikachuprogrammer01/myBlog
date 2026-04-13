<template>
  <div class="home-carousel">
    <el-carousel height="400px" motion-blur>
      <el-carousel-item v-for="item in items" :key="item.id">
        <div
          class="carousel-item-content"
          :style="{ backgroundImage: `url(${item.cover})` }"
          @click="$router.push(`/article/${item.id}`)"
        >
          <div class="carousel-overlay">
            <h3>{{ item.title }}</h3>
            <p>{{ item.excerpt }}</p>
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<script setup>
  defineProps({
    items: { type: Array, default: () => [] },
  });
</script>

<style lang="scss" scoped>
  .home-carousel {
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 30px;

    .carousel-item-content {
      height: 100%;
      background-size: cover;
      background-position: center;
      cursor: pointer;
      position: relative;

      .carousel-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 40px 20px 20px;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
        color: white;

        h3 {
          font-size: 1.8rem;
          margin: 0 0 10px;
        }
        p {
          font-size: 1rem;
          opacity: 0.8;
          margin: 0;
        }
      }
    }
  }
</style>
