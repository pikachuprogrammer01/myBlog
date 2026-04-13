<template>
  <div class="carousel-container">
    <!-- 轮播图主区域 -->
    <div class="carousel" ref="carouselRef">
      <div
        class="carousel-track"
        :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
      >
        <div
          v-for="(slide, index) in slides"
          :key="index"
          class="carousel-slide"
          :class="{ active: index === currentIndex }"
        >
          <div class="slide-content">
            <!-- 图片部分 -->
            <div class="slide-image" :style="{ backgroundImage: `url(${slide.image})` }"></div>

            <!-- 文字内容 -->
            <div class="slide-text">
              <h3 v-if="slide.title" class="slide-title">{{ slide.title }}</h3>
              <p v-if="slide.description" class="slide-description">{{ slide.description }}</p>
              <el-button
                v-if="slide.buttonText"
                type="primary"
                class="slide-button"
                @click="handleSlideClick(slide)"
              >
                {{ slide.buttonText }}
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 左右箭头 -->
      <div class="carousel-arrows">
        <el-button
          class="arrow arrow-prev"
          @click="prevSlide"
          :disabled="!autoplayEnabled && !allowManualControl"
        >
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <el-button
          class="arrow arrow-next"
          @click="nextSlide"
          :disabled="!autoplayEnabled && !allowManualControl"
        >
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>

      <!-- 指示点 -->
      <div class="carousel-dots">
        <div
          v-for="(slide, index) in slides"
          :key="index"
          class="dot"
          :class="{ active: index === currentIndex }"
          @click="goToSlide(index)"
        />
      </div>
    </div>

    <!-- 控制面板 -->
    <div v-if="showControls" class="carousel-controls">
      <div class="control-group">
        <el-button
          size="small"
          :type="autoplayEnabled ? 'primary' : ''"
          @click="toggleAutoplay"
        >
          {{ autoplayEnabled ? '暂停' : '播放' }}
        </el-button>
        <el-button
          size="small"
          @click="toggleFullscreen"
          v-if="fullscreenSupported"
        >
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const props = defineProps({
  // 轮播图数据
  slides: {
    type: Array,
    default: () => [
      {
        image: '/images/carousel1.jpg',
        title: '欢迎来到我的博客',
        description: '分享技术、生活和思考',
        buttonText: '阅读更多'
      },
      {
        image: '/images/carousel2.jpg',
        title: '最新技术文章',
        description: '探索前沿的前端开发技术',
        buttonText: '查看文章'
      },
      {
        image: '/images/carousel3.jpg',
        title: '工具与资源',
        description: '实用的开发工具和学习资源',
        buttonText: '浏览工具'
      }
    ]
  },
  // 自动轮播间隔（毫秒）
  interval: {
    type: Number,
    default: 5000
  },
  // 是否启用自动轮播
  autoplay: {
    type: Boolean,
    default: true
  },
  // 是否显示控制面板
  showControls: {
    type: Boolean,
    default: true
  },
  // 是否允许手动控制
  allowManualControl: {
    type: Boolean,
    default: true
  },
  // 是否循环播放
  loop: {
    type: Boolean,
    default: true
  },
  // 过渡动画时长（毫秒）
  transitionDuration: {
    type: Number,
    default: 500
  }
})

const emit = defineEmits(['slide-change', 'slide-click'])

// 响应式状态
const currentIndex = ref(0)
const autoplayEnabled = ref(props.autoplay)
const isFullscreen = ref(false)
const carouselRef = ref(null)

// 全屏支持检测
const fullscreenSupported = computed(() => {
  return document.fullscreenEnabled ||
    document.webkitFullscreenEnabled ||
    document.mozFullScreenEnabled ||
    document.msFullscreenEnabled
})

// 自动轮播定时器
let autoplayTimer = null

// 启动自动轮播
const startAutoplay = () => {
  if (!autoplayEnabled.value || props.slides.length <= 1) return

  stopAutoplay()
  autoplayTimer = setInterval(() => {
    nextSlide()
  }, props.interval)
}

// 停止自动轮播
const stopAutoplay = () => {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

// 切换自动轮播
const toggleAutoplay = () => {
  autoplayEnabled.value = !autoplayEnabled.value
  if (autoplayEnabled.value) {
    startAutoplay()
  } else {
    stopAutoplay()
  }
}

// 切换到下一张
const nextSlide = () => {
  if (props.slides.length === 0) return

  let newIndex = currentIndex.value + 1
  if (newIndex >= props.slides.length) {
    newIndex = props.loop ? 0 : props.slides.length - 1
  }

  changeSlide(newIndex)
}

// 切换到上一张
const prevSlide = () => {
  if (props.slides.length === 0) return

  let newIndex = currentIndex.value - 1
  if (newIndex < 0) {
    newIndex = props.loop ? props.slides.length - 1 : 0
  }

  changeSlide(newIndex)
}

// 跳转到指定幻灯片
const goToSlide = (index) => {
  if (index >= 0 && index < props.slides.length) {
    changeSlide(index)
  }
}

// 切换幻灯片
const changeSlide = (newIndex) => {
  if (currentIndex.value === newIndex) return

  const oldIndex = currentIndex.value
  currentIndex.value = newIndex
  emit('slide-change', { oldIndex, newIndex, slide: props.slides[newIndex] })
}

// 处理幻灯片点击
const handleSlideClick = (slide) => {
  emit('slide-click', { slide, index: currentIndex.value })
}

// 切换全屏
const toggleFullscreen = () => {
  if (!fullscreenSupported.value || !carouselRef.value) return

  if (!isFullscreen.value) {
    const element = carouselRef.value
    if (element.requestFullscreen) {
      element.requestFullscreen()
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen()
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen()
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
  }
}

// 全屏状态变化处理
const handleFullscreenChange = () => {
  isFullscreen.value = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  )
}

// 监听属性变化
watch(() => props.autoplay, (newVal) => {
  autoplayEnabled.value = newVal
  if (newVal) {
    startAutoplay()
  } else {
    stopAutoplay()
  }
})

watch(() => props.slides, (newSlides) => {
  if (currentIndex.value >= newSlides.length) {
    currentIndex.value = Math.max(0, newSlides.length - 1)
  }
  startAutoplay()
})

// 生命周期
onMounted(() => {
  // 初始化自动轮播
  if (props.autoplay) {
    startAutoplay()
  }

  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
  document.addEventListener('MSFullscreenChange', handleFullscreenChange)

  // 鼠标悬停暂停自动轮播
  if (carouselRef.value) {
    carouselRef.value.addEventListener('mouseenter', stopAutoplay)
    carouselRef.value.addEventListener('mouseleave', () => {
      if (autoplayEnabled.value) {
        startAutoplay()
      }
    })
  }
})

onUnmounted(() => {
  stopAutoplay()
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
})
</script>

<style scoped lang="scss">
.carousel-container {
  width: 100%;
  margin-bottom: var(--blog-spacing-xl);

  .carousel {
    position: relative;
    overflow: hidden;
    border-radius: var(--blog-border-radius);
    box-shadow: var(--blog-shadow);

    .carousel-track {
      display: flex;
      transition: transform v-bind(transitionDuration + 'ms') ease-in-out;
      will-change: transform;
    }

    .carousel-slide {
      flex: 0 0 100%;
      min-width: 100%;
      position: relative;

      .slide-content {
        position: relative;
        height: 400px;

        .slide-image {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-size: cover;
          background-position: center;
          transition: transform 0.5s ease;

          .carousel-slide.active & {
            transform: scale(1.05);
          }
        }

        .slide-text {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: var(--blog-spacing-xl);
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
          color: white;

          .slide-title {
            margin: 0 0 var(--blog-spacing-sm);
            font-size: 32px;
            font-weight: 600;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.5s ease;

            .carousel-slide.active & {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .slide-description {
            margin: 0 0 var(--blog-spacing-md);
            font-size: 18px;
            max-width: 600px;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.5s ease 0.1s;

            .carousel-slide.active & {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .slide-button {
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.5s ease 0.2s;

            .carousel-slide.active & {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }
      }
    }

    .carousel-arrows {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      transform: translateY(-50%);
      display: flex;
      justify-content: space-between;
      padding: 0 var(--blog-spacing-md);
      pointer-events: none;

      .arrow {
        pointer-events: auto;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.8);
        border: none;
        box-shadow: var(--blog-shadow);
        transition: all 0.3s ease;

        &:hover:not(:disabled) {
          background-color: white;
          transform: scale(1.1);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .carousel-dots {
      position: absolute;
      bottom: var(--blog-spacing-lg);
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      gap: var(--blog-spacing-sm);

      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background-color: rgba(255, 255, 255, 0.8);
        }

        &.active {
          background-color: white;
          transform: scale(1.2);
        }
      }
    }
  }

  .carousel-controls {
    margin-top: var(--blog-spacing-md);
    display: flex;
    justify-content: center;

    .control-group {
      display: flex;
      gap: var(--blog-spacing-sm);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .carousel-container {
    .carousel {
      .carousel-slide {
        .slide-content {
          height: 300px;

          .slide-text {
            padding: var(--blog-spacing-lg);

            .slide-title {
              font-size: 24px;
            }

            .slide-description {
              font-size: 16px;
            }
          }
        }
      }

      .carousel-arrows {
        .arrow {
          width: 36px;
          height: 36px;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .carousel-container {
    .carousel {
      .carousel-slide {
        .slide-content {
          height: 250px;

          .slide-text {
            padding: var(--blog-spacing-md);

            .slide-title {
              font-size: 20px;
            }

            .slide-description {
              font-size: 14px;
            }
          }
        }
      }

      .carousel-arrows {
        padding: 0 var(--blog-spacing-sm);
      }
    }
  }
}
</style>