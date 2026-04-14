<template>
  <div class="login-wrapper">
    <div class="bg-decoration"></div>

    <div class="auth-container">
      <div class="auth-header">
        <div class="logo-icon">
          <el-icon><Key /></el-icon>
        </div>
        <h1 class="title">欢迎回来</h1>
        <p class="subtitle">请登录您的账号以继续</p>
      </div>

      <div class="blog-card auth-card">
        <el-form
          :model="form"
          :rules="rules"
          ref="formRef"
          size="large"
          label-position="top"
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
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <div class="auth-actions">
            <el-button
              type="primary"
              class="login-btn"
              @click="handleLogin"
              :loading="loading"
            >
              立即登录
            </el-button>
            <div class="register-link">
              还没有账号？<el-button
                link
                type="primary"
                @click="$router.push('/register')"
                >点击注册</el-button
              >
            </div>
          </div>
        </el-form>

        <el-divider>
          <span class="divider-text">演示账号</span>
        </el-divider>

        <div class="demo-accounts">
          <el-tooltip content="点击快速填充" placement="top">
            <el-tag
              size="small"
              effect="plain"
              @click="
                form.username = 'admin';
                form.password = 'admin123';
              "
              >管理员</el-tag
            >
          </el-tooltip>
          <el-tag
            size="small"
            effect="plain"
            @click="
              form.username = 'user1';
              form.password = 'user123';
            "
            >普通用户</el-tag
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive } from "vue";
  import { useRouter } from "vue-router";
  import { ElMessage } from "element-plus";
  import { User, Lock, Key } from "@element-plus/icons-vue";
  import { useAuth } from "@/composables/useAuth";

  const router = useRouter();
  const { login } = useAuth();

  const formRef = ref();
  const loading = ref(false);

  const form = reactive({
    username: "",
    password: "",
  });

  const rules = {
    username: [
      { required: true, message: "请输入用户名", trigger: "blur" },
      {
        min: 3,
        max: 20,
        message: "用户名长度在 3 到 20 个字符",
        trigger: "blur",
      },
    ],
    password: [
      { required: true, message: "请输入密码", trigger: "blur" },
      {
        min: 6,
        max: 20,
        message: "密码长度在 6 到 20 个字符",
        trigger: "blur",
      },
    ],
  };

  const handleLogin = async () => {
    try {
      await formRef.value.validate();
      loading.value = true;

      const result = await login(form.username, form.password);

      if (result.success) {
        ElMessage.success("登录成功");
        router.push("/");
      } else {
        ElMessage.error(result.message);
      }
    } catch (error) {
      console.error("登录失败:", error);
    } finally {
      loading.value = false;
    }
  };
</script>

<style scoped lang="scss">
  .login-wrapper {
    min-height: calc(100vh - 200px); // 居中处理
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 40px 20px;

    // 背景装饰圆圈
    .bg-decoration {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      height: 600px;
      background: radial-gradient(
        circle,
        var(--el-color-primary-light-9) 0%,
        transparent 70%
      );
      z-index: -1;
      filter: blur(40px);
    }
  }

  .auth-container {
    width: 100%;
    max-width: 420px;

    .auth-header {
      text-align: center;
      margin-bottom: 30px;

      .logo-icon {
        width: 60px;
        height: 60px;
        background: var(--el-color-primary);
        color: white;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
        margin: 0 auto 20px;
        box-shadow: 0 10px 20px rgba(var(--el-color-primary-rgb), 0.2);
      }

      .title {
        font-size: 28px;
        font-weight: 700;
        color: var(--blog-text-primary);
        margin: 0;
      }

      .subtitle {
        color: var(--blog-text-muted);
        margin-top: 8px;
      }
    }
  }

  .auth-card {
    padding: 40px !important;
    border-radius: 20px !important;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.05) !important;
    border: 1px solid rgba(0, 0, 0, 0.02);

    .login-btn {
      width: 100%;
      height: 48px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      margin-top: 10px;
    }

    .register-link {
      text-align: center;
      margin-top: 20px;
      font-size: 14px;
      color: var(--blog-text-secondary);
    }
  }

  .divider-text {
    font-size: 12px;
    color: var(--blog-text-muted);
    font-weight: normal;
  }

  .demo-accounts {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;

    .el-tag {
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        transform: translateY(-2px);
        background: var(--el-color-primary);
        color: white;
      }
    }
  }

  // 适配移动端
  @media (max-width: 480px) {
    .auth-card {
      padding: 25px !important;
    }
  }
</style>
