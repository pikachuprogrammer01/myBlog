<template>
  <div class="register">
    <h1 class="blog-page-title">
      <el-icon><User /></el-icon>
      注册
    </h1>
    <div class="blog-card auth-card">
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            @blur="checkUsername"
          />
          <div v-if="usernameStatus" class="validation-hint" :class="usernameStatus.type">
            {{ usernameStatus.message }}
          </div>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
          <div class="password-strength">
            <div class="strength-bar" :class="passwordStrengthClass"></div>
            <div class="strength-text">{{ passwordStrengthText }}</div>
          </div>
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请确认密码"
            :prefix-icon="Lock"
            show-password
          />
          <div v-if="passwordMatchStatus" class="validation-hint" :class="passwordMatchStatus.type">
            {{ passwordMatchStatus.message }}
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleRegister" :loading="loading">
            注册
          </el-button>
          <el-button @click="$router.push('/login')">
            返回登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { register, checkAuth } = useAuth()

const formRef = ref()
const loading = ref(false)
const usernameStatus = ref(null)
const passwordMatchStatus = ref(null)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' }
  ]
}

// 密码强度计算
const passwordStrength = computed(() => {
  if (!form.password) return 0

  let strength = 0
  if (form.password.length >= 8) strength++
  if (/[A-Z]/.test(form.password)) strength++
  if (/[a-z]/.test(form.password)) strength++
  if (/[0-9]/.test(form.password)) strength++
  if (/[^A-Za-z0-9]/.test(form.password)) strength++

  return Math.min(strength, 5)
})

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return 'weak'
  if (strength <= 3) return 'medium'
  return 'strong'
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return '弱'
  if (strength <= 3) return '中'
  return '强'
})

// 检查用户名是否可用
const checkUsername = () => {
  if (!form.username || form.username.length < 3) {
    usernameStatus.value = null
    return
  }

  // 这里可以添加更复杂的用户名检查逻辑
  if (form.username.length < 3) {
    usernameStatus.value = {
      type: 'error',
      message: '用户名太短'
    }
  } else if (form.username.length > 20) {
    usernameStatus.value = {
      type: 'error',
      message: '用户名太长'
    }
  } else {
    usernameStatus.value = {
      type: 'success',
      message: '用户名格式正确'
    }
  }
}

// 监听密码匹配
watch(() => [form.password, form.confirmPassword], () => {
  if (!form.confirmPassword) {
    passwordMatchStatus.value = null
    return
  }

  if (form.password === form.confirmPassword) {
    passwordMatchStatus.value = {
      type: 'success',
      message: '密码匹配'
    }
  } else {
    passwordMatchStatus.value = {
      type: 'error',
      message: '密码不匹配'
    }
  }
})

const handleRegister = async () => {
  try {
    await formRef.value.validate()

    // 检查密码匹配
    if (form.password !== form.confirmPassword) {
      ElMessage.error('两次输入的密码不一致')
      return
    }

    loading.value = true

    const result = await register(form.username, form.password)

    if (result.success) {
      ElMessage.success('注册成功，已自动登录')
      router.push('/')
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('注册失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.register {
  padding: var(--blog-spacing-md) 0;
  max-width: 400px;
  margin: 0 auto;

  .auth-card {
    text-align: center;
  }

  .validation-hint {
    font-size: 12px;
    margin-top: 4px;

    &.success {
      color: var(--blog-success-color);
    }

    &.error {
      color: var(--blog-danger-color);
    }
  }

  .password-strength {
    margin-top: 8px;

    .strength-bar {
      height: 4px;
      border-radius: 2px;
      transition: all 0.3s ease;

      &.weak {
        width: 33%;
        background-color: var(--blog-danger-color);
      }

      &.medium {
        width: 66%;
        background-color: var(--blog-warning-color);
      }

      &.strong {
        width: 100%;
        background-color: var(--blog-success-color);
      }
    }

    .strength-text {
      font-size: 12px;
      margin-top: 4px;
      color: var(--blog-text-secondary);
    }
  }
}
</style>