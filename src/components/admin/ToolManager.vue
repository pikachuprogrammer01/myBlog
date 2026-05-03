<template>
  <div class="tool-manager">
    <div class="toolbar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索工具..."
        clearable
        class="search-input"
      />
      <el-button type="primary" @click="openDialog(null)">
        <el-icon><Plus /></el-icon> 新增工具
      </el-button>
      <span class="tool-count">找到 {{ filteredTools.length }} / 共 {{ tools.length }} 个工具</span>
    </div>

    <el-table :data="pagedTools" stripe v-loading="loading" class="tool-table">
      <el-table-column prop="name" label="工具名称" min-width="140" />
      <el-table-column prop="category" label="分类" width="100" />
      <el-table-column prop="url" label="链接" min-width="200">
        <template #default="{ row }">
          <a :href="row.url" target="_blank" class="tool-url">{{ row.url }}</a>
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
        :total="filteredTools.length"
        :pager-count="5"
        layout="prev, pager, next"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑工具' : '新增工具'"
      width="560px"
      :append-to-body="true"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="80px" @keyup.enter="handleSave">
        <el-form-item label="名称">
          <el-input v-model="form.name" maxlength="100" placeholder="工具名称" />
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="form.url" maxlength="500" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="图标URL">
          <el-input v-model="form.icon" maxlength="500" placeholder="图标链接（可选）" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" maxlength="100" placeholder="如：前端工具" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="500" placeholder="工具描述" />
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
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Edit, Delete } from "@element-plus/icons-vue";
import { getTools, createTool, updateTool, deleteTool } from "@/api/services/adminService";

const tools = ref([]);
const searchQuery = ref("");
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingId = ref(null);
const currentPage = ref(1);
const pageSize = ref(8);
const form = ref({
  name: "",
  url: "",
  icon: "",
  category: "其他",
  description: "",
  sort_order: 0,
});

const filteredTools = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return tools.value;
  return tools.value.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.description || "").toLowerCase().includes(q)
  );
});

const totalPages = computed(() => Math.ceil(filteredTools.value.length / pageSize.value));

const pagedTools = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredTools.value.slice(start, start + pageSize.value);
});

const confirmBase = {
  appendTo: "#app",
  lockScroll: false,
};

async function loadTools() {
  loading.value = true;
  try {
    const res = await getTools();
    if (res.data.success) {
      tools.value = res.data.data;
    }
  } catch (error) {
    ElMessage.error("加载工具列表失败: " + (error.response?.data?.message || error.message));
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
      icon: row.icon || "",
      category: row.category || "其他",
      description: row.description || "",
      sort_order: row.sort_order || 0,
    };
  } else {
    editingId.value = null;
    form.value = { name: "", url: "", icon: "", category: "其他", description: "", sort_order: 0 };
  }
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.value.name.trim()) {
    ElMessage.warning("请输入工具名称");
    return;
  }
  if (!form.value.url.trim()) {
    ElMessage.warning("请输入工具链接");
    return;
  }

  saving.value = true;
  try {
    if (editingId.value) {
      const res = await updateTool(editingId.value, form.value);
      if (res.data.success) {
        ElMessage.success("工具已更新");
        dialogVisible.value = false;
        await loadTools();
      } else {
        ElMessage.error(res.data.message || "更新失败");
      }
    } else {
      const res = await createTool(form.value);
      if (res.data.success) {
        ElMessage.success("工具已添加");
        dialogVisible.value = false;
        await loadTools();
      } else {
        ElMessage.error(res.data.message || "添加失败");
      }
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "操作失败");
  } finally {
    saving.value = false;
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(
    `确定要删除工具「${row.name}」吗？`,
    "删除确认",
    { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning", ...confirmBase }
  )
    .then(async () => {
      try {
        const res = await deleteTool(row.id);
        if (res.data.success) {
          ElMessage.success("工具已删除");
          await loadTools();
        } else {
          ElMessage.error(res.data.message || "删除失败");
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.message || "删除失败");
      }
    })
    .catch(() => {});
}

defineExpose({ tools });

watch(searchQuery, () => {
  currentPage.value = 1;
});

onMounted(() => {
  loadTools();
});
</script>

<style scoped lang="scss">
.tool-manager {
  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: var(--blog-spacing-md);

    .search-input {
      max-width: 240px;
    }

    .tool-count {
      margin-left: auto;
      color: var(--blog-text-secondary);
      font-size: 14px;
    }
  }

  .tool-url {
    color: var(--el-color-primary);
    text-decoration: none;
    font-size: 13px;
    &:hover {
      text-decoration: underline;
    }
  }

  .tool-table {
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
