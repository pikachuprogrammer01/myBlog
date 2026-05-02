<template>
  <div class="tag-manager">
    <div class="toolbar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索标签..."
        clearable
        class="search-input"
      />
      <el-input
        v-model="newTagName"
        placeholder="输入新标签名称"
        maxlength="50"
        class="tag-input"
        @keyup.enter="handleAdd"
      />
      <el-button type="primary" :loading="adding" @click="handleAdd">
        <el-icon><Plus /></el-icon> 新增标签
      </el-button>
      <span class="tag-count">找到 {{ filteredTags.length }} / 共 {{ tags.length }} 个标签</span>
    </div>

    <el-table :data="filteredTags" stripe class="tag-table">
      <el-table-column prop="name" label="标签名称" min-width="150">
        <template #default="{ row }">
          <span v-if="editingId !== row.id">{{ row.name }}</span>
          <el-input
            v-else
            v-model="editName"
            size="small"
            maxlength="50"
            @keyup.enter="handleSave(row.id)"
            @keyup.escape="cancelEdit"
          />
        </template>
      </el-table-column>
      <el-table-column prop="slug" label="别名" min-width="120" />
      <el-table-column prop="articleCount" label="文章数" width="80" align="center" />
      <el-table-column label="操作" width="160" align="center">
        <template #default="{ row }">
          <template v-if="editingId === row.id">
            <el-button size="small" type="primary" @click="handleSave(row.id)">保存</el-button>
            <el-button size="small" @click="cancelEdit">取消</el-button>
          </template>
          <template v-else>
            <el-button size="small" @click="startEdit(row)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Edit, Delete } from "@element-plus/icons-vue";
import { getTags, createTag, updateTag, deleteTag } from "@/api/services/adminService";

const tags = ref([]);
const searchQuery = ref("");
const newTagName = ref("");
const adding = ref(false);
const editingId = ref(null);
const editName = ref("");

const filteredTags = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return tags.value;
  return tags.value.filter(
    (t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
  );
});

const confirmBase = {
  appendTo: "#app",
  lockScroll: false,
};

async function loadTags() {
  try {
    const res = await getTags();
    if (res.data.success) {
      tags.value = res.data.data;
    }
  } catch (error) {
    ElMessage.error("加载标签失败: " + (error.response?.data?.message || error.message));
  }
}

async function handleAdd() {
  const name = newTagName.value.trim();
  if (!name) {
    ElMessage.warning("请输入标签名称");
    return;
  }
  adding.value = true;
  try {
    const res = await createTag(name);
    if (res.data.success) {
      ElMessage.success("标签已添加");
      newTagName.value = "";
      await loadTags();
    } else {
      ElMessage.error(res.data.message || "添加失败");
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "添加失败");
  } finally {
    adding.value = false;
  }
}

function startEdit(row) {
  editingId.value = row.id;
  editName.value = row.name;
}

function cancelEdit() {
  editingId.value = null;
  editName.value = "";
}

async function handleSave(id) {
  const name = editName.value.trim();
  if (!name) {
    ElMessage.warning("标签名称不能为空");
    return;
  }
  try {
    const res = await updateTag(id, name);
    if (res.data.success) {
      ElMessage.success("标签已更新");
      editingId.value = null;
      editName.value = "";
      await loadTags();
    } else {
      ElMessage.error(res.data.message || "更新失败");
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "更新失败");
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(
    `确定要删除标签「${row.name}」吗？将从所有文章中移除此标签。`,
    "删除确认",
    { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning", ...confirmBase }
  )
    .then(async () => {
      try {
        const res = await deleteTag(row.id);
        if (res.data.success) {
          ElMessage.success("标签已删除");
          await loadTags();
        } else {
          ElMessage.error(res.data.message || "删除失败");
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.message || "删除失败");
      }
    })
    .catch(() => {});
}

defineExpose({ tags, filteredTags });

onMounted(() => {
  loadTags();
});
</script>

<style scoped lang="scss">
.tag-manager {
  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: var(--blog-spacing-md);

    .search-input {
      max-width: 200px;
    }

    .tag-input {
      max-width: 280px;
    }

    .tag-count {
      margin-left: auto;
      color: var(--blog-text-secondary);
      font-size: 14px;
    }
  }

  .tag-table {
    :deep(.el-table__row) {
      cursor: default;
    }
  }
}
</style>
