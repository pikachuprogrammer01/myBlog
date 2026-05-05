<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="back-to-top"
      :class="{ 'back-to-top-circular': circular }"
      :style="buttonStyle"
      @click="scrollToTop"
      @mouseenter="isHovering = true"
      @mouseleave="isHovering = false"
    >
      <div class="back-to-top-content">
        <el-icon :size="iconSize" :class="{ 'icon-hovering': isHovering }">
          <CaretTop />
        </el-icon>
        <span v-if="showText" class="back-to-top-text">回到顶部</span>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { CaretTop } from '@element-plus/icons-vue'

const props = defineProps({
  // 滚动多少像素后显示按钮
  visibilityHeight: {
    type: Number,
    default: 300
  },
  // 按钮位置（底部距离）
  bottom: {
    type: String,
    default: '40px'
  },
  // 按钮位置（右侧距离）
  right: {
    type: String,
    default: '40px'
  },
  // 滚动动画时长（毫秒）
  duration: {
    type: Number,
    default: 500
  },
  // 按钮背景色
  backgroundColor: {
    type: String,
    default: 'var(--blog-primary-color)'
  },
  // 按钮悬停背景色
  hoverBackgroundColor: {
    type: String,
    default: 'var(--blog-primary-hover)'
  },
  // 按钮文字颜色
  color: {
    type: String,
    default: 'white'
  },
  // 是否显示文字
  showText: {
    type: Boolean,
    default: true
  },
  // 是否圆形按钮
  circular: {
    type: Boolean,
    default: false
  },
  // 图标大小
  iconSize: {
    type: Number,
    default: 20
  },
  // 按钮尺寸
  size: {
    type: String,
    default: 'default', // 'small', 'default', 'large'
    validator: (value) => ['small', 'default', 'large'].includes(value)
  },
  // 自定义滚动容器选择器（默认window）
  container: {
    type: String,
    default: ''
  },
  // 是否在移动端显示
  showOnMobile: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click', 'visible-change'])

// 响应式状态
const visible = ref(false)
const isHovering = ref(false)
const scrollContainer = ref(null)
const isMobile = ref(false)

// 按钮样式
const buttonStyle = computed(() => {
  const styles = {
    bottom: props.bottom,
    right: props.right,
    backgroundColor: props.backgroundColor,
    color: props.color
  }

  // 悬停时背景色
  if (isHovering.value && props.hoverBackgroundColor) {
    styles.backgroundColor = props.hoverBackgroundColor
  }

  // 尺寸
  if (props.circular) {
    const sizeMap = {
      small: '40px',
      default: '48px',
      large: '56px'
    }
    styles.width = sizeMap[props.size] || sizeMap.default
    styles.height = sizeMap[props.size] || sizeMap.default
    styles.borderRadius = '50%'
  }

  // 移动端隐藏
  if (!props.showOnMobile && isMobile.value) {
    styles.display = 'none'
  }

  return styles
})

// 检查移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// 获取滚动容器
const getScrollContainer = () => {
  if (props.container) {
    const element = document.querySelector(props.container)
    return element || window
  }
  return window
}

// 检查是否应该显示按钮
const checkVisibility = () => {
  const container = scrollContainer.value
  let scrollTop = 0

  if (container === window) {
    scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
  } else {
    scrollTop = container.scrollTop
  }

  const shouldBeVisible = scrollTop > props.visibilityHeight

  if (shouldBeVisible !== visible.value) {
    visible.value = shouldBeVisible
    emit('visible-change', shouldBeVisible)
  }
}

// 平滑滚动到顶部
const scrollToTop = () => {
  const container = scrollContainer.value
  const startTime = performance.now()
  const startScroll = container === window
    ? window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
    : container.scrollTop

  const scroll = (currentTime) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / props.duration, 1)

    // 使用缓动函数（easeInOutCubic）
    const easeInOutCubic = (t) => {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2
    }

    const scrollTo = startScroll * (1 - easeInOutCubic(progress))

    if (container === window) {
      window.scrollTo(0, scrollTo)
    } else {
      container.scrollTop = scrollTo
    }

    if (progress < 1) {
      requestAnimationFrame(scroll)
    }
  }

  emit('click')
  requestAnimationFrame(scroll)
}

// 处理滚动事件
const handleScroll = () => {
  checkVisibility()
}

// 处理窗口大小变化
const handleResize = () => {
  checkMobile()
}

// 初始化
const init = () => {
  scrollContainer.value = getScrollContainer()
  checkMobile()
  checkVisibility()

  // 监听滚动事件
  scrollContainer.value.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', handleResize)
}

// 清理
const cleanup = () => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', handleScroll)
  }
  window.removeEventListener('resize', handleResize)
}

// 生命周期
onMounted(() => {
  init()
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped lang="scss">
.back-to-top {
  position: fixed;
  z-index: 1000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  border-radius: 2px;
  background: #f2c94c;
  color: #0d0f11;
  border: none;
  box-shadow: 3px 3px 0px #000;
  transition: all 0.1s ease;
  opacity: 0.9;
  user-select: none;

  &:hover {
    opacity: 1;
    transform: translate(1px, 1px);
    box-shadow: 2px 2px 0px #000;
  }

  &:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0px #000;
    transition: transform 0.05s ease;
  }

  &.back-to-top-circular {
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .back-to-top-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    .el-icon {
      transition: all 0.3s ease;

      &.icon-hovering {
        transform: translateY(-2px);
      }
    }

    .back-to-top-text {
      font-size: 14px;
      font-weight: 500;
    }
  }
}

// 淡入淡出动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

// 移动端适配
@media (max-width: 768px) {
  .back-to-top {
    padding: 10px 14px;
    bottom: 20px !important;
    right: 20px !important;

    &.back-to-top-circular {
      padding: 0;
      width: 44px !important;
      height: 44px !important;
    }

    .back-to-top-content {
      .el-icon {
        font-size: 18px;
      }

      .back-to-top-text {
        font-size: 12px;
      }
    }
  }
}

@media (max-width: 480px) {
  .back-to-top {
    padding: 8px 12px;
    bottom: 16px !important;
    right: 16px !important;

    &.back-to-top-circular {
      padding: 0;
      width: 40px !important;
      height: 40px !important;
    }

    .back-to-top-content {
      .back-to-top-text {
        display: none;
      }
    }
  }
}
</style>