<template>
  <div class="project-manager">
    <div class="toolbar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索项目..."
        clearable
        class="search-input"
      />
      <el-button type="primary" @click="openDialog(null)">
        <el-icon><Plus /></el-icon> 新增项目
      </el-button>
      <span class="project-count">找到 {{ filteredProjects.length }} / 共 {{ projects.length }} 个项目</span>
    </div>

    <el-table :data="pagedProjects" v-loading="loading" class="project-table">
      <el-table-column prop="name" label="项目名称" min-width="140" />
      <el-table-column prop="category" label="分类" width="100" />
      <el-table-column prop="url" label="链接" min-width="200">
        <template #default="{ row }">
          <a :href="row.url" target="_blank" class="project-url">{{ row.url }}</a>
        </template>
      </el-table-column>
      <el-table-column label="技术栈" min-width="180">
        <template #default="{ row }">
          <span v-for="t in row.tech_stack" :key="t" class="tech-tag">#{{ t }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="sort_order" label="排序" width="70" align="center" />
      <el-table-column label="操作" width="160" align="center">
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
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="filteredProjects.length"
        :pager-count="5"
        layout="prev, pager, next"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑项目' : '新增项目'"
      width="560px"
      :append-to-body="true"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="80px" @keyup.enter="handleSave">
        <el-form-item label="名称">
          <el-input v-model="form.name" maxlength="100" placeholder="项目名称" />
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="form.url" maxlength="500" placeholder="https://github.com/..." />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" maxlength="100" placeholder="如：前端、后端、工具" />
        </el-form-item>
        <el-form-item label="技术栈">
          <el-input v-model="techStackInput" maxlength="500" placeholder="逗号分隔，如：Vue3, Vite, Node.js" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="500" placeholder="项目简介" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Edit, Delete } from "@element-plus/icons-vue";
import { getProjects, createProject, updateProject, deleteProject } from "@/api/services/adminService";
import { errMsg } from "@/utils/error";
import { confirmThen } from "@/utils/confirm";

const projects = ref([]);
const searchQuery = ref("");
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingId = ref(null);
const currentPage = ref(1);
const pageSize = ref(8);
const techStackInput = ref("");
const form = ref({
  name: "",
  url: "",
  category: "前端",
  description: "",
  sort_order: 0,
});

const filteredProjects = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return projects.value;
  return projects.value.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q)
  );
});

const totalPages = computed(() => Math.ceil(filteredProjects.value.length / pageSize.value));

const pagedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredProjects.value.slice(start, start + pageSize.value);
});

const confirmBase = {
  appendTo: "#app",
  lockScroll: false,
};

async function loadProjects() {
  loading.value = true;
  try {
    const res = await getProjects();
    if (res.data.success) {
      projects.value = res.data.data.map((p) => ({
        ...p,
        tech_stack: typeof p.tech_stack === 'string' ? JSON.parse(p.tech_stack) : (p.tech_stack || []),
      }));
    }
  } catch (error) {
    ElMessage.error("加载项目列表失败: " + errMsg(error));
  } finally {
    loading.value = false;
  }
}

function openDialog(row) {
  if (row) {
    editingId.value = row.id;
    form.value = {
      name: row.name || "",
      url: row.url || "",
      category: row.category || "前端",
      description: row.description || "",
      sort_order: row.sort_order || 0,
    };
    techStackInput.value = (row.tech_stack || []).join(", ");
  } else {
    editingId.value = null;
    form.value = { name: "", url: "", category: "前端", description: "", sort_order: 0 };
    techStackInput.value = "";
  }
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.value.name.trim()) {
    ElMessage.warning("请输入项目名称");
    return;
  }
  if (!form.value.url.trim()) {
    ElMessage.warning("请输入项目链接");
    return;
  }

  saving.value = true;
  try {
    const techStack = techStackInput.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      ...form.value,
      name: form.value.name.trim(),
      url: form.value.url.trim(),
      slug: form.value.name.trim().toLowerCase().replace(/\s+/g, "-"),
      tech_stack: techStack,
    };

    if (editingId.value) {
      const res = await updateProject(editingId.value, payload);
      if (res.data.success) {
        ElMessage.success("项目已更新");
        dialogVisible.value = false;
        await loadProjects();
      } else {
        ElMessage.error(res.data.message || "更新失败");
      }
    } else {
      const res = await createProject(payload);
      if (res.data.success) {
        ElMessage.success("项目已添加");
        dialogVisible.value = false;
        await loadProjects();
      } else {
        ElMessage.error(res.data.message || "添加失败");
      }
    }
  } catch (error) {
    ElMessage.error(errMsg(error));
  } finally {
    saving.value = false;
  }
}

function handleDelete(row) {
  confirmThen(`确定要删除项目「${row.name}」吗？`, "删除确认", "warning", async () => {
    try {
      const res = await deleteProject(row.id);
      if (res.data.success) {
        ElMessage.success("项目已删除");
        await loadProjects();
      } else {
        ElMessage.error(res.data.message || "删除失败");
      }
    } catch (error) {
      ElMessage.error(errMsg(error));
    }
  });
}

defineExpose({ projects });

watch(searchQuery, () => {
  currentPage.value = 1;
});

onMounted(() => {
  loadProjects();
});
</script>

<style scoped lang="scss">
.project-manager {
  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: var(--blog-spacing-md);

    .search-input {
      max-width: 240px;
    }

    .project-count {
      margin-left: auto;
      color: var(--blog-text-secondary);
      font-size: 14px;
    }
  }

  .project-url {
    color: var(--el-color-primary);
    text-decoration: none;
    font-size: 13px;
    &:hover {
      text-decoration: underline;
    }
  }

  .tech-tag {
    display: inline-block;
    font-family: "Courier New", monospace;
    font-size: 10px;
    color: var(--blog-text-secondary);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--blog-border-color);
    padding: 1px 6px;
    margin-right: 4px;
    margin-bottom: 2px;
    border-radius: 2px;
  }

  .project-table {
    :deep(.el-table__row) {
      cursor: default;
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: center;
    margin-top: var(--blog-spacing-md);
  }
}
</style>
