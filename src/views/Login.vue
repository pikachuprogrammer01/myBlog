<template>
  <div class="login-page">
    <!-- 左侧品牌区域 -->
    <div class="login-left">
      <div class="brand-content">
        <div class="brand-logo">
          <span class="logo-text">myBlog</span>
          <span class="logo-cursor">_</span>
        </div>
        <p class="brand-desc">分享技术，记录成长</p>
        <div class="brand-features">
          <div class="feature-item">
            <el-icon><Reading /></el-icon>
            <span>优质技术文章</span>
          </div>
          <div class="feature-item">
            <el-icon><ChatLineSquare /></el-icon>
            <span>深度技术交流</span>
          </div>
          <div class="feature-item">
            <el-icon><Notebook /></el-icon>
            <span>面试题库练习</span>
          </div>
        </div>
      </div>
      <div class="decoration-circles">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
      </div>
    </div>

    <!-- 右侧表单区域 -->
    <div class="login-right">
      <div class="form-container">
        <div class="form-header">
          <h2 class="form-title">登录</h2>
          <p class="form-subtitle">欢迎回来，请登录您的账号</p>
        </div>

        <el-form
          :model="form"
          :rules="rules"
          ref="formRef"
          size="large"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="用户名"
              :prefix-icon="User"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="密码"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <div class="form-actions">
            <el-button
              class="login-btn"
              :class="{ 'is-loading': loading }"
              :disabled="loading"
              @click="handleLogin"
            >
              <span v-if="!loading" class="btn-text">立即登录</span>
              <span v-else class="btn-loading">
                <span class="stripe-bar"></span>
              </span>
            </el-button>
            <div class="register-link">
              还没有账号？
              <router-link to="/register" class="switch-link">点击注册</router-link>
            </div>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { User, Lock, Reading, ChatLineSquare, Notebook } from "@element-plus/icons-vue"
import { useAuth } from "@/composables/useAuth"

const router = useRouter()
const { login } = useAuth()

const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: "",
  password: "",
})

const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "用户名长度在 3 到 20 个字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度在 6 到 20 个字符", trigger: "blur" },
  ],
}

const handleLogin = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    const result = await login(form.username, form.password)
    if (result.success) {
      ElMessage.success("登录成功")
      router.push("/")
    } else {
      ElMessage.error(result.message)
      loading.value = false
    }
  } catch (error) {
    console.error("登录失败:", error)
    ElMessage.error("登录失败，请重试")
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
$bg-deep: #121416;
$bg-panel: #1e2227;
$color-primary: #f2c94c;
$color-primary-dark: #d4af37;
$color-border: #3d444d;
$color-text: #e8eaed;
$color-text-muted: #8b9199;
$radius: 4px;
$transition-speed: 0.3s;

.login-page {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: $bg-deep;
  color: $color-text;
}

/* ========== 左侧品牌区域 ========== */
.login-left {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 40px;
  background: $bg-panel;
  border-right: 1px solid $color-border;

  .brand-content {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 400px;
  }

  .brand-logo {
    margin-bottom: 8px;

    .logo-text {
      font-size: 40px;
      font-weight: 800;
      letter-spacing: 2px;
      color: $color-primary;
      text-transform: lowercase;
    }

    .logo-cursor {
      font-size: 40px;
      font-weight: 300;
      color: $color-primary;
      animation: blink 1s step-end infinite;
    }
  }

  .brand-desc {
    font-size: 15px;
    color: $color-text-muted;
    margin: 0 0 32px;
    letter-spacing: 4px;
  }

  .brand-features {
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: left;

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      color: $color-text-muted;
      padding: 10px 16px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid $color-border;
      border-radius: $radius;
      transition: all $transition-speed;

      &:hover {
        background: rgba(242, 201, 76, 0.06);
        border-color: rgba(242, 201, 76, 0.3);
        color: $color-text;

        .el-icon {
          color: $color-primary;
        }
      }

      .el-icon {
        font-size: 20px;
        color: $color-text-muted;
        transition: color $transition-speed;
      }
    }
  }

  .decoration-circles {
    position: absolute;
    inset: 0;
    pointer-events: none;

    .circle {
      position: absolute;
      border-radius: 50%;
      border: 1px solid $color-border;

      &.circle-1 {
        width: 300px;
        height: 300px;
        top: -80px;
        right: -80px;
        opacity: 0.4;
      }

      &.circle-2 {
        width: 200px;
        height: 200px;
        bottom: -40px;
        left: -60px;
        opacity: 0.25;
      }

      &.circle-3 {
        width: 120px;
        height: 120px;
        top: 50%;
        left: -30px;
        opacity: 0.15;
      }
    }
  }
}

/* ========== 右侧表单区域 ========== */
.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-deep;
  padding: 40px;

  .form-container {
    width: 100%;
    max-width: 420px;
  }

  .form-header {
    text-align: center;
    margin-bottom: 36px;

    .form-title {
      font-size: 26px;
      font-weight: 700;
      color: $color-text;
      margin: 0 0 6px;
    }

    .form-subtitle {
      font-size: 14px;
      color: $color-text-muted;
      margin: 0;
    }
  }
}

/* ========== 表单样式 ========== */
.login-form {
  :deep(.el-input__wrapper) {
    background: $bg-panel;
    border: 1px solid $color-border;
    border-radius: $radius;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
    padding: 4px 15px;
    transition: border-color $transition-speed, box-shadow $transition-speed;

    &:hover {
      border-color: lighten($color-border, 10%);
    }

    &.is-focus {
      border-color: $color-primary;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3),
        0 0 8px rgba(242, 201, 76, 0.25);
    }
  }

  :deep(.el-input__inner) {
    color: $color-text;
    caret-color: $color-primary;

    &::placeholder {
      color: $color-text-muted;
    }
  }

  :deep(.el-input__prefix .el-icon) {
    color: $color-text-muted;
    transition: color $transition-speed;
  }

  :deep(.el-input__wrapper.is-focus .el-input__prefix .el-icon) {
    color: $color-primary;
  }

  :deep(.el-input__suffix .el-icon) {
    color: $color-text-muted;

    &:hover {
      color: $color-text;
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 24px;
  }

  :deep(.el-form-item__error) {
    color: #ff5252;
    font-size: 12px;
    padding-top: 4px;
  }
}

/* 按钮区域 */
.form-actions {
  margin-top: 28px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 2px;
  border-radius: $radius;
  border: none;
  background: linear-gradient(135deg, $color-primary 0%, $color-primary-dark 100%);
  color: #1a1a1a;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: opacity $transition-speed, box-shadow $transition-speed;

  &:hover:not(:disabled) {
    opacity: 0.92;
    box-shadow: 0 4px 16px rgba(242, 201, 76, 0.3);
  }

  &:disabled {
    cursor: wait;
  }

  .btn-text {
    position: relative;
    z-index: 1;
  }

  &.is-loading {
    background: $color-primary-dark;
    pointer-events: none;

    .btn-loading {
      display: block;
      width: 100%;
      height: 100%;
      position: absolute;
      inset: 0;

      .stripe-bar {
        display: block;
        width: 100%;
        height: 100%;
        background: repeating-linear-gradient(
          -45deg,
          $color-primary 0px,
          $color-primary 8px,
          $color-primary-dark 8px,
          $color-primary-dark 16px
        );
        animation: stripe-slide 0.8s linear infinite;
      }
    }
  }
}

.register-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: $color-text-muted;

  .switch-link {
    color: $color-primary;
    font-weight: 600;
    text-decoration: none;

    &:hover {
      color: lighten($color-primary, 10%);
    }
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

@keyframes stripe-slide {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(16px);
  }
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .login-left {
    display: none;
  }

  .login-right {
    flex: 1;
    padding: 40px;

    .form-container {
      max-width: 450px;
    }
  }
}

@media (max-width: 768px) {
  .login-right {
    padding: 24px 1.5rem;

    .form-container {
      max-width: 100%;
    }
  }
}
</style>
