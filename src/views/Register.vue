<template>
  <div class="register-page">
    <!-- 左侧品牌区域 -->
    <div class="register-left">
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
    <div class="register-right">
      <div class="form-container">
        <div class="form-header">
          <h2 class="form-title">注册</h2>
          <p class="form-subtitle">创建您的账号</p>
        </div>

        <el-form
          :model="form"
          :rules="rules"
          ref="formRef"
          size="large"
          class="register-form"
          @keyup.enter="handleRegister"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="用户名"
              :prefix-icon="User"
              @input="onUsernameInput"
            />
            <transition name="el-fade-in">
              <div
                v-if="usernameStatus"
                class="validation-hint"
                :class="usernameStatus.type"
              >
                <el-icon>
                  <CircleCheck v-if="usernameStatus.type === 'success'" />
                  <CircleClose v-else />
                </el-icon>
                {{ usernameStatus.message }}
              </div>
            </transition>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="密码"
              :prefix-icon="Lock"
              show-password
            />
            <div class="password-strength" v-if="form.password">
              <div class="strength-gauge">
                <div
                  class="gauge-fill"
                  :style="{ width: passwordStrengthPercent + '%' }"
                  :class="passwordStrengthClass"
                ></div>
              </div>
              <span class="strength-label" :class="passwordStrengthClass">
                {{ passwordStrengthText }}
              </span>
            </div>
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="确认密码"
              :prefix-icon="Lock"
              show-password
            />
            <transition name="el-fade-in">
              <div
                v-if="passwordMatchStatus"
                class="validation-hint"
                :class="passwordMatchStatus.type"
              >
                <el-icon>
                  <Warning v-if="passwordMatchStatus.type === 'error'" />
                  <CircleCheck v-else />
                </el-icon>
                {{ passwordMatchStatus.message }}
              </div>
            </transition>
          </el-form-item>

          <div class="form-actions">
            <el-button
              class="register-btn"
              :class="{ 'is-loading': loading }"
              :disabled="loading"
              @click="handleRegister"
            >
              <span v-if="!loading" class="btn-text">注册账号</span>
              <span v-else class="btn-loading">
                <span class="stripe-bar"></span>
              </span>
            </el-button>
            <div class="login-link">
              已有账号？
              <router-link to="/login" class="switch-link">立即登录</router-link>
            </div>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import {
  User,
  Lock,
  CircleCheck,
  CircleClose,
  Warning,
  Reading,
  ChatLineSquare,
  Notebook,
} from "@element-plus/icons-vue"
import { useAuth } from "@/composables/useAuth"

const router = useRouter()
const { register } = useAuth()

const formRef = ref()
const loading = ref(false)
const usernameStatus = ref(null)
const passwordMatchStatus = ref(null)
const shaking = ref(false)

let usernameTimer = null

const form = reactive({
  username: "",
  password: "",
  confirmPassword: "",
})

const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "长度在 3 到 20 个字符", trigger: "blur" },
    {
      pattern: /^[a-zA-Z0-9_]+$/,
      message: "仅限字母、数字及下划线",
      trigger: "blur",
    },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度在 6 到 20 个字符", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请再次输入密码", trigger: "blur" },
  ],
}

const passwordStrength = computed(() => {
  if (!form.password) return 0
  let s = 0
  if (form.password.length >= 8) s++
  if (/[A-Z]/.test(form.password)) s++
  if (/[a-z]/.test(form.password)) s++
  if (/[0-9]/.test(form.password)) s++
  if (/[^A-Za-z0-9]/.test(form.password)) s++
  return s
})

const passwordStrengthPercent = computed(() => {
  return Math.min(passwordStrength.value * 20, 100)
})

const passwordStrengthClass = computed(() => {
  const s = passwordStrength.value
  if (s <= 2) return "weak"
  if (s <= 4) return "medium"
  return "strong"
})

const passwordStrengthText = computed(() => {
  const s = passwordStrength.value
  if (s <= 2) return "弱"
  if (s <= 4) return "中"
  return "强"
})

const onUsernameInput = () => {
  usernameStatus.value = null
  if (usernameTimer) clearTimeout(usernameTimer)
  if (!form.username || form.username.length < 3) return
  usernameTimer = setTimeout(() => {
    usernameStatus.value = { type: "success", message: "用户名格式可用" }
  }, 500)
}

watch(
  () => [form.password, form.confirmPassword],
  () => {
    if (!form.confirmPassword) {
      passwordMatchStatus.value = null
      return
    }
    const isMatch = form.password === form.confirmPassword
    passwordMatchStatus.value = {
      type: isMatch ? "success" : "error",
      message: isMatch ? "密码一致" : "两次输入的密码不匹配",
    }
  },
)

const triggerShake = async () => {
  if (shaking.value) return
  shaking.value = true
  await nextTick()
  // wait for animation, then reset
  setTimeout(() => {
    shaking.value = false
  }, 500)
}

const handleRegister = async () => {
  try {
    await formRef.value.validate()
  } catch {
    triggerShake()
    return
  }

  if (form.password !== form.confirmPassword) {
    ElMessage.error("两次输入的密码不一致")
    triggerShake()
    return
  }

  loading.value = true
  try {
    const result = await register(form.username, form.password)
    if (result.success) {
      ElMessage.success("注册成功，即将跳转...")
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } else {
      ElMessage.error(result.message)
      loading.value = false
    }
  } catch (error) {
    console.error("注册失败:", error)
    ElMessage.error("注册失败，请重试")
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
/* ========== CSS 变量 ========== */
$bg-deep: #121416;
$bg-panel: #1e2227;
$color-primary: #f2c94c;
$color-primary-dark: #d4af37;
$color-border: #3d444d;
$color-success: #42b983;
$color-danger: #ff5252;
$color-text: #e8eaed;
$color-text-muted: #8b9199;
$radius: 4px;
$transition-speed: 0.3s;

.register-page {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: $bg-deep;
  color: $color-text;
}

/* ========== 左侧品牌区域 ========== */
.register-left {
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
.register-right {
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
    margin-bottom: 28px;

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
.register-form {
  /* Element Plus input 深色覆盖 */
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
    margin-bottom: 18px;
  }

  :deep(.el-form-item__error) {
    color: $color-danger;
    font-size: 12px;
    padding-top: 4px;
  }
}

/* 校验提示 */
.validation-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  margin-top: 6px;
  line-height: 1;

  &.success {
    color: $color-success;
  }
  &.error {
    color: $color-danger;
  }
}

/* 密码强度仪表盘 */
.password-strength {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;

  .strength-gauge {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 2px;
    overflow: hidden;

    .gauge-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.4s ease, background 0.4s ease;

      &.weak {
        background: $color-danger;
      }
      &.medium {
        background: $color-primary;
      }
      &.strong {
        background: $color-success;
      }
    }
  }

  .strength-label {
    font-size: 12px;
    font-weight: 600;
    min-width: 20px;
    text-align: right;
    text-transform: uppercase;

    &.weak {
      color: $color-danger;
    }
    &.medium {
      color: $color-primary;
    }
    &.strong {
      color: $color-success;
    }
  }
}

/* 按钮区域 */
.form-actions {
  margin-top: 22px;
}

.register-btn {
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

  /* 条纹加载动画 */
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

.login-link {
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

/* 抖动动画 */
.register-form.shake {
  animation: shake 0.4s ease-in-out;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  50%,
  90% {
    transform: translateX(-4px);
  }
  30%,
  70% {
    transform: translateX(4px);
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
  .register-left {
    display: none;
  }

  .register-right {
    flex: 1;
    padding: 40px;

    .form-container {
      max-width: 450px;
    }
  }
}

@media (max-width: 768px) {
  .register-right {
    padding: 24px 1.5rem;

    .form-container {
      max-width: 100%;
    }
  }
}
</style>
