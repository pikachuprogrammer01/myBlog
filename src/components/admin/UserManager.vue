<template>
  <div class="user-manager">
    <div class="toolbar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索用户名..."
        clearable
        class="search-input"
        @input="onSearchChange"
      />
      <el-select v-model="roleFilter" placeholder="角色筛选" clearable class="role-filter" @change="onFilterChange">
        <el-option label="全部" value="" />
        <el-option label="管理员" value="admin" />
        <el-option label="普通用户" value="user" />
      </el-select>
      <span class="user-count">找到 {{ filteredTotal }} / 共 {{ total }} 个用户</span>
    </div>

    <el-table :data="users" stripe v-loading="loading" class="user-table">
      <el-table-column prop="id" label="ID" width="60" align="center" />
      <el-table-column label="头像" width="60" align="center">
        <template #default="{ row }">
          <el-avatar :size="32" :src="getUserAvatar(row.username, row.avatar_url)" />
        </template>
      </el-table-column>
      <el-table-column prop="username" label="用户名" min-width="140" />
      <el-table-column prop="role" label="角色" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">
            {{ row.role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="180" align="center">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button size="small" type="warning" :loading="resettingId === row.id" @click="handleResetPassword(row)">
            <el-icon><Key /></el-icon>
          </el-button>
          <el-button size="small" type="danger" :loading="deletingId === row.id" @click="handleDelete(row)">
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
        :pager-count="5"
        layout="prev, pager, next"
        @current-change="onPageChange"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑用户' : '查看用户'"
      width="460px"
      :append-to-body="true"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="80px" @keyup.enter="handleSave">
        <el-form-item label="用户名">
          <el-input v-model="form.username" maxlength="20" placeholder="用户名" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" class="role-select">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
          <span class="readonly-text">{{ formatDate(form.created_at) || '-' }}</span>
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
import { ref, computed, onMounted, inject } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Edit, Delete, Key } from "@element-plus/icons-vue";
import { getAdminUsers, updateAdminUser, deleteAdminUser, resetAdminUserPassword } from "@/api/services/adminService";

const users = ref([]);
const searchQuery = ref("");
const roleFilter = ref("");
const loading = ref(false);
const saving = ref(false);
const deletingId = ref(null);
const resettingId = ref(null);
const dialogVisible = ref(false);
const editingId = ref(null);
const page = ref(1);
const limit = ref(8);
const total = ref(0);
const totalPages = ref(0);

const form = ref({
  username: "",
  role: "user",
  created_at: "",
});

let searchTimer = null;

const filteredTotal = computed(() => {
  // When using local search on current page vs unfiltered API results
  return users.value.length;
});

const confirmBase = {
  appendTo: "#app",
  lockScroll: false,
};

const refreshAdminData = inject('refreshAdminData', null);

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

function getUserAvatar(username, avatarUrl) {
  if (avatarUrl) return avatarUrl;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
}

async function loadUsers() {
  loading.value = true;
  try {
    const res = await getAdminUsers({
      page: page.value,
      limit: limit.value,
      search: searchQuery.value.trim(),
      role: roleFilter.value,
    });
    if (res.data.success) {
      users.value = res.data.data;
      total.value = res.data.pagination.total;
      totalPages.value = res.data.pagination.totalPages;
    }
  } catch (error) {
    ElMessage.error("加载用户列表失败: " + (error.response?.data?.message || error.message));
  } finally {
    loading.value = false;
  }
}

function onSearchChange() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 1;
    loadUsers();
  }, 400);
}

function onFilterChange() {
  page.value = 1;
  loadUsers();
}

function onPageChange() {
  loadUsers();
}

function openDialog(row) {
  if (row) {
    editingId.value = row.id;
    form.value = {
      username: row.username || "",
      role: row.role || "user",
      created_at: row.created_at || "",
    };
  } else {
    editingId.value = null;
    form.value = { username: "", role: "user", created_at: "" };
  }
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.value.username.trim()) {
    ElMessage.warning("请输入用户名");
    return;
  }

  saving.value = true;
  try {
    const res = await updateAdminUser(editingId.value, {
      username: form.value.username.trim(),
      role: form.value.role,
    });
    if (res.data.success) {
      ElMessage.success("用户已更新");
      dialogVisible.value = false;
      await loadUsers();
      refreshAdminData?.();
    } else {
      ElMessage.error(res.data.message || "更新失败");
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "操作失败");
  } finally {
    saving.value = false;
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(
    `确定要删除用户「${row.username}」吗？该用户的所有评论、点赞、收藏将被清除。`,
    "删除确认",
    { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning", ...confirmBase }
  )
    .then(async () => {
      deletingId.value = row.id;
      try {
        const res = await deleteAdminUser(row.id);
        if (res.data.success) {
          ElMessage.success("用户已删除");
          await loadUsers();
          refreshAdminData?.();
        } else {
          ElMessage.error(res.data.message || "删除失败");
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.message || "删除失败");
      } finally {
        deletingId.value = null;
      }
    })
    .catch(() => {});
}

function handleResetPassword(row) {
  ElMessageBox.confirm(
    `确定要将用户「${row.username}」的密码重置为 123456 吗？`,
    "重置密码确认",
    { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning", ...confirmBase }
  )
    .then(async () => {
      resettingId.value = row.id;
      try {
        const res = await resetAdminUserPassword(row.id);
        if (res.data.success) {
          ElMessage.success(`用户「${row.username}」的密码已重置为 123456`);
        } else {
          ElMessage.error(res.data.message || "重置失败");
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.message || "重置密码失败");
      } finally {
        resettingId.value = null;
      }
    })
    .catch(() => {});
}

defineExpose({ users });

onMounted(() => {
  loadUsers();
});
</script>

<style scoped lang="scss">
.user-manager {
  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: var(--blog-spacing-md);

    .search-input {
      max-width: 220px;
    }

    .role-filter {
      width: 130px;
    }

    .user-count {
      margin-left: auto;
      color: var(--blog-text-secondary);
      font-size: 14px;
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: center;
    margin-top: var(--blog-spacing-md);
  }

  .role-select {
    width: 100%;
  }

  .readonly-text {
    color: var(--blog-text-secondary);
    font-size: 14px;
  }
}
</style>
