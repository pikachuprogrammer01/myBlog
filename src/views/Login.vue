<template>
  <div class="login">
    <h1 class="blog-page-title">
      <el-icon><Key /></el-icon>
      登录
    </h1>
    <div class="blog-card auth-card">
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading">
            登录
          </el-button>
          <el-button @click="$router.push('/register')">
            注册账号
          </el-button>
        </el-form-item>
      </el-form>

      <div class="auth-hint">
        <p>演示账号：</p>
        <ul>
          <li>管理员：admin / admin123</li>
          <li>普通用户：user1 / user123</li>
          <li>普通用户：user2 / user456</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Key } from '@element-plus/icons-vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login } = useAuth()

const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  try {
    await formRef.value.validate()
    loading.value = true

    const result = await login(form.username, form.password)

    if (result.success) {
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login {
  padding: var(--blog-spacing-md) 0;
  max-width: 400px;
  margin: 0 auto;

  .auth-card {
    text-align: center;
  }

  .auth-hint {
    margin-top: var(--blog-spacing-lg);
    padding: var(--blog-spacing-md);
    background-color: var(--blog-bg-gray);
    border-radius: var(--blog-border-radius);
    text-align: left;

    p {
      font-weight: 600;
      margin-bottom: var(--blog-spacing-sm);
    }

    ul {
      list-style: none;
      padding: 0;

      li {
        padding: var(--blog-spacing-xs) 0;
        color: var(--blog-text-secondary);
      }
    }
  }
}
</style>