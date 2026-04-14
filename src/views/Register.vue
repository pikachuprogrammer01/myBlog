<template>
  <div class="login-wrapper">
    <div class="bg-decoration"></div>

    <div class="auth-container">
      <div class="auth-header">
        <div class="logo-icon">
          <el-icon><User /></el-icon>
        </div>
        <h1 class="title">创建新账号</h1>
        <p class="subtitle">加入我们的社区，开始您的创作之旅</p>
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
              placeholder="设置用户名"
              :prefix-icon="User"
              @blur="checkUsername"
            />
            <transition name="el-fade-in">
              <div
                v-if="usernameStatus"
                class="validation-hint"
                :class="usernameStatus.type"
              >
                <el-icon
                  ><CircleCheck
                    v-if="usernameStatus.type === 'success'" /><CircleClose
                    v-else
                /></el-icon>
                {{ usernameStatus.message }}
              </div>
            </transition>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="设置密码"
              :prefix-icon="Lock"
              show-password
            />
            <div class="password-strength-wrapper">
              <div class="strength-labels">
                <span>安全强度</span>
                <span :class="passwordStrengthClass">{{
                  passwordStrengthText
                }}</span>
              </div>
              <div class="strength-progress">
                <div
                  class="bar"
                  :class="passwordStrengthClass"
                  :style="{ width: passwordStrength * 20 + '%' }"
                ></div>
              </div>
            </div>
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="确认您的密码"
              :prefix-icon="Lock"
              show-password
            />
            <transition name="el-fade-in">
              <div
                v-if="passwordMatchStatus"
                class="validation-hint"
                :class="passwordMatchStatus.type"
              >
                <el-icon
                  ><Warning
                    v-if="passwordMatchStatus.type === 'error'" /><CircleCheck
                    v-else
                /></el-icon>
                {{ passwordMatchStatus.message }}
              </div>
            </transition>
          </el-form-item>

          <div class="auth-actions">
            <el-button
              type="primary"
              class="login-btn"
              @click="handleRegister"
              :loading="loading"
            >
              立即注册
            </el-button>
            <div class="register-link">
              已有账号？<el-button
                link
                type="primary"
                @click="$router.push('/login')"
                >返回登录</el-button
              >
            </div>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive, computed, watch } from "vue";
  import { useRouter } from "vue-router";
  import { ElMessage } from "element-plus";
  import {
    User,
    Lock,
    CircleCheck,
    CircleClose,
    Warning,
  } from "@element-plus/icons-vue";
  import { useAuth } from "@/composables/useAuth";

  const router = useRouter();
  const { register } = useAuth();

  const formRef = ref();
  const loading = ref(false);
  const usernameStatus = ref(null);
  const passwordMatchStatus = ref(null);

  const form = reactive({
    username: "",
    password: "",
    confirmPassword: "",
  });

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
      {
        min: 6,
        max: 20,
        message: "密码长度在 6 到 20 个字符",
        trigger: "blur",
      },
    ],
    confirmPassword: [
      { required: true, message: "请再次输入密码", trigger: "blur" },
    ],
  };

  // 密码强度计算 (0-5)
  const passwordStrength = computed(() => {
    if (!form.password) return 0;
    let s = 0;
    if (form.password.length >= 8) s++;
    if (/[A-Z]/.test(form.password)) s++;
    if (/[a-z]/.test(form.password)) s++;
    if (/[0-9]/.test(form.password)) s++;
    if (/[^A-Za-z0-9]/.test(form.password)) s++;
    return s;
  });

  const passwordStrengthClass = computed(() => {
    const s = passwordStrength.value;
    if (s <= 2) return "weak";
    if (s <= 4) return "medium";
    return "strong";
  });

  const passwordStrengthText = computed(() => {
    const s = passwordStrength.value;
    if (s === 0) return "无";
    if (s <= 2) return "弱";
    if (s <= 4) return "中";
    return "强";
  });

  const checkUsername = () => {
    if (!form.username || form.username.length < 3) {
      usernameStatus.value = null;
      return;
    }
    // 模拟格式校验反馈
    usernameStatus.value = {
      type: "success",
      message: "用户名格式可用",
    };
  };

  watch(
    () => [form.password, form.confirmPassword],
    () => {
      if (!form.confirmPassword) {
        passwordMatchStatus.value = null;
        return;
      }
      const isMatch = form.password === form.confirmPassword;
      passwordMatchStatus.value = {
        type: isMatch ? "success" : "error",
        message: isMatch ? "密码一致" : "两次输入的密码不匹配",
      };
    },
  );

  const handleRegister = async () => {
    try {
      await formRef.value.validate();
      if (form.password !== form.confirmPassword) {
        ElMessage.error("两次输入的密码不一致");
        return;
      }
      loading.value = true;
      const result = await register(form.username, form.password);
      if (result.success) {
        ElMessage.success("注册成功");
        router.push("/");
      } else {
        ElMessage.error(result.message);
      }
    } catch (error) {
      console.error("注册失败:", error);
    } finally {
      loading.value = false;
    }
  };
</script>

<style scoped lang="scss">
  /* 引入与登录页完全一致的基础样式 */
  .login-wrapper {
    min-height: calc(100vh - 100px);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 40px 20px;

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
        color: #303133;
        margin: 0;
      }

      .subtitle {
        color: #909399;
        margin-top: 8px;
      }
    }
  }

  .auth-card {
    padding: 40px !important;
    border-radius: 20px !important;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.05) !important;
    background: white;

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
      color: #606266;
    }
  }

  /* 注册页特有的辅助样式 */
  .validation-hint {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    margin-top: 6px;
    line-height: 1;

    &.success {
      color: #67c23a;
    }
    &.error {
      color: #f56c6c;
    }
  }

  .password-strength-wrapper {
    margin-top: 10px;

    .strength-labels {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 6px;
      color: #909399;

      .weak {
        color: #f56c6c;
        font-weight: bold;
      }
      .medium {
        color: #e6a23c;
        font-weight: bold;
      }
      .strong {
        color: #67c23a;
        font-weight: bold;
      }
    }

    .strength-progress {
      height: 6px;
      background: #f2f6fc;
      border-radius: 3px;
      overflow: hidden;

      .bar {
        height: 100%;
        width: 0;
        transition: all 0.4s ease;

        &.weak {
          background: #f56c6c;
        }
        &.medium {
          background: #e6a23c;
        }
        &.strong {
          background: #67c23a;
        }
      }
    }
  }

  @media (max-width: 480px) {
    .auth-card {
      padding: 25px !important;
    }
  }
</style>
