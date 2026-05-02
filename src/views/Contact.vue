<template>
  <div class="contact">
    <h1 class="blog-page-title">
      <el-icon><Message /></el-icon>
      联系我
    </h1>

    <div v-if="!isAuthenticated" class="blog-card login-required">
      <el-empty description="请先登录后再发送留言">
        <el-button type="primary" @click="$router.push('/login')">去登录</el-button>
      </el-empty>
    </div>

    <div v-else class="contact-layout">
      <div class="blog-card contact-card">
        <div class="card-header">
          <h2>发送留言</h2>
          <p>留言将发送到站长邮箱，每人每天最多发送 10 条。</p>
          <p v-if="remainingToday !== null" class="rate-hint">
            今日还可发送 <strong>{{ remainingToday }}</strong> 条
          </p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
        >
          <el-form-item label="您的邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入您的邮箱地址" maxlength="100" />
          </el-form-item>

          <el-form-item label="主题" prop="subject">
            <el-input v-model="form.subject" placeholder="想聊点什么？" maxlength="40" show-word-limit />
          </el-form-item>

          <el-form-item label="消息内容" prop="message">
            <el-input
              v-model="form.message"
              type="textarea"
              :rows="6"
              maxlength="500"
              show-word-limit
              placeholder="请输入您的消息内容"
            />
          </el-form-item>

          <div class="form-actions">
            <el-button
              type="primary"
              :loading="submitting"
              @click="handleSubmit"
            >
              发送留言
            </el-button>
            <el-button @click="handleReset">清空表单</el-button>
          </div>
        </el-form>
      </div>

      <div class="blog-card info-card">
        <h2>说明</h2>
        <ul class="info-list">
          <li>请填写您的真实邮箱，以便站长回复您。</li>
          <li>留言通过站长 QQ 邮箱发送，请认真填写。</li>
          <li>每人每天最多发送 <strong>10 条</strong>留言。</li>
          <li>主题长度 4-40 字符，内容长度 10-500 字符。</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Message } from "@element-plus/icons-vue";
import { submitContact, getRemaining } from "@/api/services/contactService";
import { useAuth } from "@/composables/useAuth";

const { isAuthenticated } = useAuth();

const formRef = ref(null);
const submitting = ref(false);
const remainingToday = ref(null);

const form = reactive({
  email: "",
  subject: "",
  message: "",
});

const rules = {
  email: [
    { required: true, message: "请输入您的邮箱地址", trigger: "blur" },
    {
      type: "email",
      message: "请输入有效的邮箱地址",
      trigger: "blur",
    },
  ],
  subject: [
    { required: true, message: "请输入主题", trigger: "blur" },
    {
      min: 4,
      max: 40,
      message: "主题长度需在 4 到 40 个字符之间",
      trigger: "blur",
    },
  ],
  message: [
    { required: true, message: "请输入消息内容", trigger: "blur" },
    {
      min: 10,
      max: 500,
      message: "消息内容长度需在 10 到 500 个字符之间",
      trigger: "blur",
    },
  ],
};

async function loadRemaining() {
  try {
    const res = await getRemaining();
    if (res.data.success) {
      remainingToday.value = res.data.data.remaining;
    }
  } catch {
    remainingToday.value = null;
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    submitting.value = true;

    const res = await submitContact({
      subject: form.subject,
      message: form.message,
      email: form.email,
    });

    ElMessage.success(res.data?.message || "留言已发送");
    resetForm();
    // 更新剩余次数
    if (res.data?.data?.remaining !== undefined) {
      remainingToday.value = res.data.data.remaining;
    } else if (remainingToday.value !== null) {
      remainingToday.value = Math.max(0, remainingToday.value - 1);
    }
  } catch (error) {
    if (error?.response) {
      const msg = error.response.data?.message || "发送失败";
      ElMessage.error(msg);
      form.subject = "";
      form.message = "";
      formRef.value?.clearValidate();
      if (error.response.status === 429) {
        loadRemaining();
      }
    }
  } finally {
    submitting.value = false;
  }
}

const resetForm = () => {
  form.email = "";
  form.subject = "";
  form.message = "";
  formRef.value?.clearValidate();
};

const handleReset = () => {
  resetForm();
};

onMounted(() => {
  if (isAuthenticated.value) {
    loadRemaining();
  }
});
</script>

<style scoped lang="scss">
.contact {
  padding: var(--blog-spacing-md) 0;

  .login-required {
    text-align: center;
  }

  .contact-layout {
    display: grid;
    gap: var(--blog-spacing-lg);

    @media (min-width: 992px) {
      grid-template-columns: 2fr 1fr;
    }
  }

  .card-header {
    margin-bottom: var(--blog-spacing-lg);

    h2 {
      margin: 0 0 var(--blog-spacing-sm);
    }

    p {
      margin: 0;
      color: var(--blog-text-secondary);
      line-height: 1.7;
    }

    .rate-hint {
      margin-top: var(--blog-spacing-xs);
      color: var(--blog-primary-color);
    }
  }

  .form-actions {
    display: flex;
    gap: var(--blog-spacing-sm);
  }

  .info-card {
    h2 {
      margin-top: 0;
      margin-bottom: var(--blog-spacing-md);
    }

    .info-list {
      margin: 0;
      padding-left: 20px;
      color: var(--blog-text-secondary);
      line-height: 1.9;
    }
  }
}
</style>
