<template>
  <header :class="['blog-header', { 'is-scrolled': isScrolled }]">
    <div class="header-content">
      <!-- 左侧 Logo -->
      <div class="header-left" @click="router.push('/')">
        <span class="logo-bracket">[</span>
        <span class="logo-text">myBlog</span>
        <span class="logo-cursor">_</span>
        <span class="logo-bracket">]</span>
      </div>

      <!-- 中间导航 -->
      <nav class="header-center">
        <router-link to="/" class="nav-link">
          <span class="nav-bracket">[</span> 首页 <span class="nav-bracket">]</span>
        </router-link>
        <router-link to="/archive" class="nav-link">
          <span class="nav-bracket">[</span> 归档 <span class="nav-bracket">]</span>
        </router-link>
        <router-link to="/categories" class="nav-link">
          <span class="nav-bracket">[</span> 分类 <span class="nav-bracket">]</span>
        </router-link>
        <router-link to="/projects" class="nav-link">
          <span class="nav-bracket">[</span> 项目 <span class="nav-bracket">]</span>
        </router-link>
        <router-link to="/tags" class="nav-link">
          <span class="nav-bracket">[</span> 标签 <span class="nav-bracket">]</span>
        </router-link>

        <el-dropdown trigger="hover" @command="handleMoreCommand">
          <span class="nav-link more-link">
            <span class="nav-bracket">[</span> 更多 <span class="nav-bracket">]</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="tools">> 实用工具</el-dropdown-item>
              <el-dropdown-item command="interview">> 面试题库</el-dropdown-item>
              <el-dropdown-item command="about">> 关于我</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </nav>

      <!-- 右侧功能区 -->
      <div class="header-right">
        <div class="search-box">
          <el-input
            v-model="searchQuery"
            placeholder="搜索文章..."
            :prefix-icon="Search"
            clearable
            @keyup.enter="handleSearch"
            class="search-input"
          />
        </div>

        <div class="auth-zone">
          <template v-if="isAuthenticated">
            <el-tooltip content="管理后台" placement="bottom" effect="dark">
              <el-button
                v-if="isAdmin"
                type="primary"
                circle
                :icon="Monitor"
                @click="router.push('/admin')"
              />
            </el-tooltip>

            <el-dropdown @command="handleUserCommand" trigger="click">
              <div class="user-info-trigger">
                <el-avatar :size="32" :src="userAvatar" />
                <span class="user-name">{{ currentUser?.username }}</span>
                <el-icon><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <div class="dropdown-user-header">
                    <p class="name">{{ currentUser?.username }}</p>
                    <p class="role">{{ isAdmin ? "管理员" : "普通用户" }}</p>
                  </div>
                  <el-dropdown-item command="profile">> 个人中心</el-dropdown-item>
                  <el-dropdown-item command="bookmarks">> 我的收藏</el-dropdown-item>
                  <el-dropdown-item v-if="isAdmin" command="admin">> 管理后台</el-dropdown-item>
                  <el-dropdown-item divided command="logout" class="logout-item">
                    > 退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>

          <template v-else>
            <router-link to="/login" class="nav-link">[ 登录 ]</router-link>
            <router-link to="/register" class="nav-link accent">[ 注册 ]</router-link>
          </template>
        </div>

        <!-- 状态指示灯 -->
        <span class="status-indicator">状态: 运行中</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Search,
  ArrowDown,
  SwitchButton,
  Monitor,
} from "@element-plus/icons-vue";
import { useAuth } from "@/composables/useAuth";

const router = useRouter();
const { currentUser, logout: authLogout, isAuthenticated, isAdmin } = useAuth();

const searchQuery = ref("");

const userAvatar = computed(() => {
  if (!currentUser.value) return "";
  if (currentUser.value.avatarUrl) return currentUser.value.avatarUrl;
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentUser.value.username}`;
});

const handleSearch = () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning("请输入搜索关键词");
    return;
  }
  router.push(`/search?q=${encodeURIComponent(searchQuery.value)}`);
  searchQuery.value = "";
};

const handleUserCommand = (command) => {
  switch (command) {
    case "profile": router.push("/profile"); break;
    case "bookmarks": router.push("/bookmarks"); break;
    case "admin": router.push("/admin"); break;
    case "logout": handleLogout(); break;
  }
};

const handleMoreCommand = (command) => {
  switch (command) {
    case "tools": router.push("/tools"); break;
    case "interview": router.push("/interview"); break;
    case "about": router.push("/about"); break;
  }
};

const handleLogout = () => {
  ElMessageBox.confirm("确定要退出登录吗？", "退出确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      authLogout();
      ElMessage.success("已退出登录");
      router.push("/login");
    })
    .catch(() => {});
};

const isScrolled = ref(false);
const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

onMounted(() => window.addEventListener("scroll", handleScroll));
onUnmounted(() => window.removeEventListener("scroll", handleScroll));
</script>

<style scoped lang="scss">
$bg-header: rgba(13, 15, 17, 0.8);
$border-color: #30363d;
$accent-gold: #f2c94c;
$text-bright: #e6edf3;
$text-muted: #8b949e;
$monitor-green: #3fb950;

.blog-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: $bg-header;
  backdrop-filter: blur(12px);
  z-index: 1000;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(242, 201, 76, 0.3);

  &.is-scrolled {
    height: 56px;
    background: rgba(13, 15, 17, 0.95);
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.5);
  }

  .header-content {
    max-width: 1200px;
    height: 100%;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  // 左侧 Logo — 等宽字体模拟代码行
  .header-left {
    display: flex;
    align-items: center;
    gap: 2px;
    cursor: pointer;
    font-family: "Courier New", "Source Code Pro", monospace;
    font-size: 18px;

    .logo-bracket {
      color: $text-muted;
    }

    .logo-text {
      color: $accent-gold;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .logo-cursor {
      color: $accent-gold;
      animation: cursor-blink 1s step-end infinite;
    }
  }

  // 中间导航 — 开关式矩形边框
  .header-center {
    display: flex;
    gap: 4px;

    .nav-link {
      text-decoration: none;
      color: $text-muted;
      font-family: "Courier New", "Source Code Pro", monospace;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 6px 12px;
      border: 1px solid transparent;
      transition: all 0.1s ease;

      .nav-bracket {
        color: $border-color;
        font-size: 11px;
      }

      &:hover,
      &.router-link-active {
        color: $accent-gold;
        border-color: $accent-gold;
        background: rgba(242, 201, 76, 0.05);

        .nav-bracket {
          color: $accent-gold;
        }
      }
    }

    .more-link {
      cursor: pointer;
    }
  }

  // 右侧功能区
  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .search-input {
      width: 180px;

      :deep(.el-input__wrapper) {
        background: rgba(255, 255, 255, 0.04) !important;
        border-color: $border-color !important;
        height: 32px;
        font-size: 12px;
      }
    }

    .auth-zone {
      display: flex;
      align-items: center;
      gap: 12px;

      .nav-link {
        text-decoration: none;
        color: $text-muted;
        font-family: "Courier New", monospace;
        font-size: 11px;
        letter-spacing: 1px;
        padding: 4px 8px;
        border: 1px solid transparent;
        transition: all 0.1s ease;

        &:hover {
          color: $accent-gold;
          border-color: $accent-gold;
        }

        &.accent {
          color: $accent-gold;
          border-color: rgba(242, 201, 76, 0.3);

          &:hover {
            background: rgba(242, 201, 76, 0.08);
          }
        }
      }

      .user-info-trigger {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;

        .user-name {
          font-family: "Courier New", monospace;
          font-size: 12px;
          color: $text-muted;
        }
      }
    }

    .status-indicator {
      font-family: "Courier New", monospace;
      font-size: 10px;
      color: $monitor-green;
      letter-spacing: 1px;
      opacity: 0.7;
    }
  }
}

// 下拉菜单
.dropdown-user-header {
  padding: 12px 16px;
  border-bottom: 1px solid $border-color;
  margin-bottom: 4px;

  .name {
    font-weight: 700;
    font-size: 13px;
    margin: 0;
    color: $text-bright;
    font-family: "Courier New", monospace;
  }

  .role {
    font-size: 11px;
    color: $accent-gold;
    margin: 2px 0 0;
    font-family: "Courier New", monospace;
  }
}

.logout-item {
  color: #f85149 !important;
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

// 响应式
@media (max-width: 992px) {
  .header-center {
    display: none !important;
  }
  .search-box {
    display: none !important;
  }
  .status-indicator {
    display: none !important;
  }
}
</style>
