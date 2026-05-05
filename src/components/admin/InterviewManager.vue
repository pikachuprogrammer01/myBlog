<template>
  <div class="interview-manager">
    <div class="toolbar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索题目..."
        clearable
        class="search-input"
        @input="onSearchChange"
      />
      <el-select v-model="categoryFilter" placeholder="分类筛选" clearable class="filter-select" @change="onFilterChange">
        <el-option label="全部" value="" />
        <el-option v-for="c in categories" :key="c.value" :label="c.label" :value="c.value" />
      </el-select>
      <el-select v-model="difficultyFilter" placeholder="难度筛选" clearable class="filter-select" @change="onFilterChange">
        <el-option label="全部" value="" />
        <el-option label="简单" value="easy" />
        <el-option label="中等" value="medium" />
        <el-option label="困难" value="hard" />
      </el-select>
      <el-button type="primary" @click="openDialog(null)">
        <el-icon><Plus /></el-icon> 新建题目
      </el-button>
      <span class="item-count">找到 {{ filteredTotal }} / 共 {{ total }} 道题目</span>
    </div>

    <el-table :data="questions" v-loading="loading" class="question-table">
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="category" label="分类" width="100" align="center">
        <template #default="{ row }">
          {{ getCategoryLabel(row.category) }}
        </template>
      </el-table-column>
      <el-table-column prop="difficulty" label="难度" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="getDifficultyType(row.difficulty)" size="small">
            {{ getDifficultyLabel(row.difficulty) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="标签" width="160">
        <template #default="{ row }">
          <span v-if="row.tags && row.tags.length > 0">
            <el-tag
              v-for="tag in row.tags"
              :key="tag"
              size="small"
              effect="plain"
              class="inline-tag"
            >
              {{ tag }}
            </el-tag>
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="view_count" label="浏览" width="70" align="center" />
      <el-table-column prop="updated_at" label="更新时间" width="110" align="center">
        <template #default="{ row }">
          {{ row.updated_at ? new Date(row.updated_at).toLocaleDateString('zh-CN') : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" align="center" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="totalPages > 1" class="pagination-wrap">
      <el-pagination
        v-model:current-page="page"
        :page-size="limit"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadQuestions"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑题目' : '新建题目'"
      width="800px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="form" label-width="80px" class="question-form">
        <el-row :gutter="16">
          <el-col :span="16">
            <el-form-item label="标题">
              <el-input v-model="form.title" placeholder="题目" maxlength="255" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="难度">
              <el-select v-model="form.difficulty" class="w-full">
                <el-option label="简单" value="easy" />
                <el-option label="中等" value="medium" />
                <el-option label="困难" value="hard" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select v-model="form.category" class="w-full">
                <el-option v-for="c in categories" :key="c.value" :label="c.label" :value="c.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标签">
              <el-input v-model="form.tags" placeholder="多个标签用逗号分隔，如：闭包,作用域" maxlength="200" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="简述">
          <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="简短描述（可选）" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="答案">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="14"
            placeholder="Markdown 格式的答案"
            class="content-textarea"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ editingId ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from "vue";
import { ElMessage } from "element-plus";
import { errMsg } from "@/utils/error";
import { confirmThen } from "@/utils/confirm";
import { Plus, Edit, Delete } from "@element-plus/icons-vue";
import {
  getAdminInterviewQuestions,
  getAdminInterviewQuestion,
  createInterviewQuestion,
  updateInterviewQuestion,
  deleteInterviewQuestion,
} from "@/api/services/interviewService";

const refreshAdminData = inject("refreshAdminData", null);

const categories = [
  { value: "js", label: "JavaScript" },
  { value: "vue", label: "Vue.js" },
  { value: "css", label: "CSS" },
  { value: "algorithm", label: "算法" },
  { value: "engineering", label: "工程化" },
  { value: "project", label: "项目经验" },
];

const CATEGORY_LABEL_MAP = Object.fromEntries(categories.map((c) => [c.value, c.label]));
const DIFFICULTY_LABELS = { easy: "简单", medium: "中等", hard: "困难" };

const questions = ref([]);
const loading = ref(false);
const saving = ref(false);
const searchQuery = ref("");
const categoryFilter = ref("");
const difficultyFilter = ref("");
const page = ref(1);
const limit = ref(8);
const total = ref(0);
const totalPages = ref(0);
const dialogVisible = ref(false);
const editingId = ref(null);

const form = ref({
  title: "",
  category: "js",
  difficulty: "medium",
  summary: "",
  content: "",
  tags: "",
});

let searchTimer = null;

const filteredTotal = computed(() => questions.value.length);

function getCategoryLabel(cat) {
  return CATEGORY_LABEL_MAP[cat] || cat;
}

function getDifficultyType(d) {
  if (d === "easy") return "success";
  if (d === "medium") return "warning";
  return "danger";
}

function getDifficultyLabel(d) {
  return DIFFICULTY_LABELS[d] || d;
}

function resetForm() {
  form.value = {
    title: "",
    category: "js",
    difficulty: "medium",
    summary: "",
    content: "",
    tags: "",
  };
}

async function loadQuestions() {
  loading.value = true;
  try {
    const params = { page: page.value, limit: limit.value };
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim();
    if (categoryFilter.value) params.category = categoryFilter.value;
    if (difficultyFilter.value) params.difficulty = difficultyFilter.value;
    const res = await getAdminInterviewQuestions(params);
    if (res.data.success) {
      questions.value = res.data.data;
      total.value = res.data.pagination.total;
      totalPages.value = res.data.pagination.totalPages;
    }
  } catch (error) {
    ElMessage.error("加载题目列表失败: " + errMsg(error));
  } finally {
    loading.value = false;
  }
}

function onSearchChange() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 1;
    loadQuestions();
  }, 400);
}

function onFilterChange() {
  page.value = 1;
  loadQuestions();
}

async function openDialog(row) {
  resetForm();
  if (row) {
    editingId.value = row.id;
    try {
      const res = await getAdminInterviewQuestion(row.id);
      if (res.data.success) {
        const q = res.data.data;
        form.value = {
          title: q.title || "",
          category: q.category || "js",
          difficulty: q.difficulty || "medium",
          summary: q.summary || "",
          content: q.content || "",
          tags: Array.isArray(q.tags) ? q.tags.join(", ") : "",
        };
      }
    } catch (error) {
      ElMessage.error("加载题目详情失败: " + errMsg(error));
      return;
    }
  } else {
    editingId.value = null;
  }
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.value.title.trim()) {
    ElMessage.warning("请输入题目标题");
    return;
  }
  if (!form.value.content.trim()) {
    ElMessage.warning("请输入答案内容");
    return;
  }

  saving.value = true;
  try {
    const data = {
      ...form.value,
      title: form.value.title.trim(),
      content: form.value.content.trim(),
      tags: form.value.tags
        ? form.value.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    };

    if (editingId.value) {
      await updateInterviewQuestion(editingId.value, data);
      ElMessage.success("题目已更新");
    } else {
      await createInterviewQuestion(data);
      ElMessage.success("题目已创建");
    }
    dialogVisible.value = false;
    await loadQuestions();
    refreshAdminData?.();
  } catch (error) {
    ElMessage.error(
      (editingId.value ? "更新" : "创建") +
        "失败: " +
        errMsg(error)
    );
  } finally {
    saving.value = false;
  }
}

function handleDelete(row) {
  confirmThen(`确定要删除题目「${row.title}」吗？此操作不可恢复！`, "删除确认", "warning", async () => {
    try {
      await deleteInterviewQuestion(row.id);
      ElMessage.success("题目已删除");
      await loadQuestions();
      refreshAdminData?.();
      } catch (error) {
        ElMessage.error(errMsg(error, "删除失败: "));
      }
  });
}

defineExpose({ questions });

onMounted(() => {
  loadQuestions();
});
</script>

<style scoped lang="scss">
.interview-manager {
  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: var(--blog-spacing-md);
    flex-wrap: wrap;

    .search-input {
      max-width: 220px;
    }

    .filter-select {
      width: 120px;
    }

    .item-count {
      margin-left: auto;
      color: var(--blog-text-secondary);
      font-size: 14px;
    }
  }

  .question-table {
    .inline-tag {
      margin-right: 4px;
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: center;
    margin-top: var(--blog-spacing-md);
  }

  .question-form {
    .w-full {
      width: 100%;
    }

    .content-textarea {
      :deep(.el-textarea__inner) {
        font-family: "Consolas", "Monaco", "Courier New", monospace;
        font-size: 13px;
        line-height: 1.6;
      }
    }
  }
}
</style>
