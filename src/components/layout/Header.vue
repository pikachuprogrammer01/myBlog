<template>
  <header :class="['blog-header', { 'is-scrolled': isScrolled }]">
    <div class="header-content">
      <div class="header-left" @click="router.push('/')">
        <div class="logo-circle">
          <img src="/favicon.ico" alt="LOGO" class="logo-img" />
        </div>
        <span class="logo-text">wushu<span>Blog</span></span>
      </div>

      <nav class="header-center">
        <router-link to="/" class="nav-link">
          <el-icon><HomeFilled /></el-icon> 首页
        </router-link>
        <router-link to="/archive" class="nav-link">
          <el-icon><Folder /></el-icon> 归档
        </router-link>
        <router-link to="/categories" class="nav-link">
          <el-icon><Folder /></el-icon>
          文章分类
        </router-link>
        <router-link to="/tags" class="nav-link">
          <el-icon><PriceTag /></el-icon> 标签
        </router-link>
        <router-link to="/tools" class="nav-link">
          <el-icon><Tools /></el-icon>
          实用工具
        </router-link>
        <router-link to="/about" class="nav-link">
          <el-icon><User /></el-icon>
          关于我
        </router-link>
      </nav>

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
            <el-button
              v-if="isAdmin"
              type="primary"
              circle
              :icon="CirclePlus"
              @click="router.push('/admin')"
              class="write-btn"
            />

            <el-dropdown @command="handleUserCommand" trigger="click">
              <div class="user-info-trigger">
                <el-avatar :size="36" :src="userAvatar" />
                <el-icon><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu class="user-dropdown">
                  <div class="dropdown-user-header">
                    <p class="name">{{ currentUser?.username }}</p>
                    <p class="role">{{ isAdmin ? "管理员" : "普通用户" }}</p>
                  </div>
                  <el-dropdown-item command="profile" :icon="User"
                    >个人中心</el-dropdown-item
                  >
                  <el-dropdown-item v-if="isAdmin" command="admin" :icon="Tools"
                    >管理后台</el-dropdown-item
                  >
                  <el-dropdown-item
                    divided
                    command="logout"
                    :icon="SwitchButton"
                    class="logout-item"
                  >
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>

          <template v-else>
            <el-button link @click="router.push('/login')">登录</el-button>
            <el-button type="primary" round @click="router.push('/register')"
              >注册</el-button
            >
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted } from "vue";
  import { useRouter } from "vue-router";
  import { ElMessage, ElMessageBox } from "element-plus";

  import {
    HomeFilled,
    Folder,
    PriceTag,
    User,
    Tools,
    Search,
    ArrowDown,
    SwitchButton,
    CirclePlus,
    Reading,
  } from "@element-plus/icons-vue";
  import { useAuth } from "@/composables/useAuth";

  const router = useRouter();
  const {
    currentUser,
    logout: authLogout,
    isAuthenticated,
    isAdmin,
  } = useAuth();

  const searchQuery = ref("");

  // 用户头像（模拟）
  const userAvatar = computed(() => {
    if (!currentUser.value) return "";
    return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentUser.value.username}`;
  });

  // 搜索处理
  const handleSearch = () => {
    if (!searchQuery.value.trim()) {
      ElMessage.warning("请输入搜索关键词");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(searchQuery.value)}`);
    searchQuery.value = "";
  };

  // 用户菜单命令处理
  const handleUserCommand = (command) => {
    switch (command) {
      case "profile":
        router.push("/profile");
        break;
      case "admin":
        router.push("/admin");
        break;
      case "logout":
        handleLogout();
        break;
    }
  };

  // 退出登录
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

  onMounted(() => {
    window.addEventListener("scroll", handleScroll);
  });

  onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll);
  });
</script>

<style scoped lang="scss">
  .blog-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 70px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(15px);
    z-index: 1000;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    &.is-scrolled {
      height: 60px;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
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

    // 左侧 Logo
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;

      .logo-circle {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, var(--el-color-primary), #67c23a);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;

        .logo-img {
          width: 30px;
          height: 30px;
        }
      }

      .logo-text {
        font-size: 20px;
        font-weight: 800;
        color: #303133;
        letter-spacing: -0.5px;
        span {
          color: var(--el-color-primary);
        }
      }
    }

    // 中间 导航
    .header-center {
      display: flex;
      gap: 25px;

      .nav-link {
        text-decoration: none;
        color: #606266;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: all 0.2s;
        font-size: 15px;

        &:hover,
        &.router-link-active {
          color: var(--el-color-primary);
        }

        .el-icon {
          font-size: 17px;
        }
      }
    }

    // 右侧 功能区
    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;

      .search-input {
        :deep(.el-input__wrapper) {
          border-radius: 20px;
          background: rgba(0, 0, 0, 0.04);
          box-shadow: none !important;
          border: 1px solid transparent;
          transition: all 0.3s;
          &:hover,
          &.is-focus {
            border-color: var(--el-color-primary-light-5);
            background: white;
          }
        }
      }

      .auth-zone {
        display: flex;
        align-items: center;
        gap: 15px;

        .user-info-trigger {
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 4px;
          border-radius: 20px;
          transition: background 0.3s;
          &:hover {
            background: rgba(0, 0, 0, 0.05);
          }
        }
      }
    }
  }

  // 下拉菜单增强
  .user-dropdown {
    padding: 8px;
    .dropdown-user-header {
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      margin-bottom: 8px;
      .name {
        font-weight: bold;
        font-size: 14px;
        margin: 0;
      }
      .role {
        font-size: 12px;
        color: #999;
        margin: 4px 0 0;
      }
    }
    .logout-item {
      color: var(--el-color-danger);
    }
  }

  // 移动端适配处理（隐藏中间导航，缩短搜索框）
  @media (max-width: 992px) {
    .header-center {
      display: none;
    }
    .search-box {
      display: none;
    } // 移动端建议使用你原有的 showSearchDialog
  }
</style>
