<template>
  <div class="contact">
    <h1 class="blog-page-title">
      <el-icon><Message /></el-icon>
      联系
    </h1>

    <div class="contact-layout">
      <div class="blog-card contact-card">
        <div class="card-header">
          <h2>给我留言</h2>
          <p>
            这是一个前端模拟联系表单，提交后会保存在当前浏览器中，不会发送到真实邮箱。
          </p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
        >
          <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" placeholder="请输入您的姓名" />
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="name@example.com" />
          </el-form-item>

          <el-form-item label="主题" prop="subject">
            <el-input v-model="form.subject" placeholder="想聊点什么？" />
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
              模拟提交
            </el-button>
            <el-button @click="handleReset">清空表单</el-button>
          </div>
        </el-form>
      </div>

      <div class="blog-card info-card">
        <h2>联系说明</h2>
        <ul class="info-list">
          <li>支持必填项校验和邮箱格式校验。</li>
          <li>提交后会模拟网络请求并给出成功提示。</li>
          <li>当前浏览器已累计保存 {{ submissionCount }} 条联系记录。</li>
          <li v-if="lastSubmissionText">
            最近一次提交：{{ lastSubmissionText }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Message } from "@element-plus/icons-vue";
import client from "@/api/client";
import { formatDate } from "@/utils/date";

const formRef = ref(null);
const submitting = ref(false);

const form = reactive({
  name: "",
  email: "",
  subject: "",
  message: "",
});

const rules = {
  name: [
    { required: true, message: "请输入姓名", trigger: "blur" },
    {
      min: 2,
      max: 20,
      message: "姓名长度需在 2 到 20 个字符之间",
      trigger: "blur",
    },
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    {
      type: "email",
      message: "请输入正确的邮箱格式",
      trigger: ["blur", "change"],
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

const messages = ref([]);

const submissionCount = computed(() => messages.value.length);

const lastSubmissionText = computed(() => {
  const latestMessage = messages.value[0];
  if (!latestMessage) {
    return '';
  }
  return `${latestMessage.name} 于 ${formatDate(
    latestMessage.created_at,
    'YYYY-MM-DD HH:mm',
  )} 提交了”${latestMessage.subject}”`;
});

async function loadMessages() {
  try {
    const res = await client.get('/api/contact');
    if (res.data.success) {
      messages.value = res.data.data || [];
    }
  } catch {
    messages.value = [];
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    submitting.value = true;

    await client.post('/api/contact', {
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
    });

    ElMessage.success('留言提交成功');
    resetForm();
    await loadMessages();
  } catch (error) {
    if (error?.response) {
      ElMessage.error(error.response.data?.message || '提交失败');
    }
  } finally {
    submitting.value = false;
  }
}

const resetForm = () => {
  form.name = "";
  form.email = "";
  form.subject = "";
  form.message = "";
  formRef.value?.clearValidate();
};

const handleReset = () => {
  resetForm();
};

onMounted(() => {
  loadMessages();
});
</script>

<style scoped lang="scss">
.contact {
  padding: var(--blog-spacing-md) 0;

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
