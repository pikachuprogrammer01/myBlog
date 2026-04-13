<template>
  <header class="blog-header">
    <div class="header-container">
      <!-- 左侧：Logo和站点名称 -->
      <div class="header-left">
        <router-link to="/" class="logo-link">
          <div class="logo-icon">
            <el-icon :size="28"><Reading /></el-icon>
          </div>
          <div class="logo-text">
            <h1 class="site-title">我的博客</h1>
            <p class="site-subtitle">分享技术与生活</p>
          </div>
        </router-link>
      </div>

      <!-- 中间：导航菜单 -->
      <div class="header-center">
        <nav class="main-nav">
          <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
            <el-icon><HomeFilled /></el-icon>
            <span class="nav-text">首页</span>
          </router-link>

          <router-link to="/categories" class="nav-item" :class="{ active: $route.path.startsWith('/categories') }">
            <el-icon><Folder /></el-icon>
            <span class="nav-text">分类</span>
          </router-link>

          <router-link to="/tags" class="nav-item" :class="{ active: $route.path.startsWith('/tags') }">
            <el-icon><PriceTag /></el-icon>
            <span class="nav-text">标签</span>
          </router-link>

          <router-link to="/archive" class="nav-item" :class="{ active: $route.path.startsWith('/archive') }">
            <el-icon><Calendar /></el-icon>
            <span class="nav-text">归档</span>
          </router-link>

          <router-link to="/about" class="nav-item" :class="{ active: $route.path.startsWith('/about') }">
            <el-icon><User /></el-icon>
            <span class="nav-text">关于</span>
          </router-link>

          <router-link to="/tools" class="nav-item" :class="{ active: $route.path.startsWith('/tools') }">
            <el-icon><Tools /></el-icon>
            <span class="nav-text">工具</span>
          </router-link>
        </nav>
      </div>

      <!-- 右侧：用户操作 -->
      <div class="header-right">
        <!-- 搜索按钮（移动端） -->
        <el-button
          class="mobile-search-btn"
          link
          size="large"
          @click="showSearchDialog = true"
        >
          <el-icon><Search /></el-icon>
        </el-button>

        <!-- 搜索框（桌面端） -->
        <div class="desktop-search">
          <el-input
            v-model="searchQuery"
            placeholder="搜索文章..."
            size="small"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <!-- 用户状态 -->
        <div class="user-section">
          <template v-if="isAuthenticated">
            <el-dropdown @command="handleUserCommand">
              <div class="user-avatar">
                <el-avatar :size="36" :src="userAvatar" />
                <span class="user-name">{{ currentUser?.username }}</span>
                <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item v-if="isAdmin" command="admin">
                    <el-icon><Setting /></el-icon>
                    管理后台
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <div class="auth-buttons">
              <el-button link size="small" @click="$router.push('/login')">
                <el-icon><User /></el-icon>
                登录
              </el-button>
              <el-button type="primary" size="small" @click="$router.push('/register')">
                <el-icon><CirclePlus /></el-icon>
                注册
              </el-button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 移动端搜索对话框 -->
    <el-dialog
      v-model="showSearchDialog"
      title="搜索文章"
      width="90%"
      top="20vh"
      :close-on-click-modal="false"
    >
      <div class="search-dialog-content">
        <el-input
          v-model="searchQuery"
          placeholder="输入关键词搜索文章..."
          size="large"
          @keyup.enter="handleMobileSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <div class="search-hint">
          <p>按 Enter 键搜索</p>
        </div>
      </div>
    </el-dialog>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  HomeFilled,
  Folder,
  PriceTag,
  Calendar,
  User,
  Tools,
  Search,
  ArrowDown,
  Setting,
  SwitchButton,
  CirclePlus,
  Reading
} from '@element-plus/icons-vue'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { getCurrentUser, logout: authLogout, isAuthenticated, isAdmin } = useAuth()

const searchQuery = ref('')
const showSearchDialog = ref(false)

// 用户信息
const currentUser = computed(() => getCurrentUser())

// 用户头像（模拟）
const userAvatar = computed(() => {
  if (!currentUser.value) return ''
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.value.username}`
})

// 搜索处理
const handleSearch = () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  router.push(`/search?q=${encodeURIComponent(searchQuery.value)}`)
  searchQuery.value = ''
}

// 移动端搜索处理
const handleMobileSearch = () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  router.push(`/search?q=${encodeURIComponent(searchQuery.value)}`)
  searchQuery.value = ''
  showSearchDialog.value = false
}

// 用户菜单命令处理
const handleUserCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'admin':
      router.push('/admin')
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 退出登录
const handleLogout = () => {
  authLogout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped lang="scss">
.blog-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--blog-header-height, 64px);
  background-color: var(--blog-bg-white);
  box-shadow: var(--blog-shadow-light);
  z-index: 1000;
  border-bottom: 1px solid var(--blog-border-light);

  .header-container {
    height: 100%;
    max-width: var(--blog-container-width, 1200px);
    margin: 0 auto;
    padding: 0 var(--blog-spacing-md);
    display: flex;
    align-items: center;
    justify-content: space-between;

    @media (max-width: 768px) {
      padding: 0 var(--blog-spacing-sm);
    }
  }

  .header-left {
    .logo-link {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: inherit;

      .logo-icon {
        margin-right: var(--blog-spacing-sm);
        color: var(--blog-primary-color);
      }

      .logo-text {
        .site-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          color: var(--blog-text-primary);
          line-height: 1.2;
        }

        .site-subtitle {
          font-size: 12px;
          margin: 0;
          color: var(--blog-text-secondary);
          line-height: 1.2;
        }
      }
    }
  }

  .header-center {
    flex: 1;
    margin: 0 var(--blog-spacing-lg);

    @media (max-width: 992px) {
      display: none;
    }

    .main-nav {
      display: flex;
      justify-content: center;
      gap: var(--blog-spacing-md);

      .nav-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: var(--blog-spacing-xs) var(--blog-spacing-sm);
        color: var(--blog-text-secondary);
        text-decoration: none;
        border-radius: var(--blog-border-radius);
        transition: all 0.3s ease;

        &:hover {
          color: var(--blog-primary-color);
          background-color: var(--blog-bg-gray);
        }

        &.active {
          color: var(--blog-primary-color);
          background-color: var(--blog-primary-light);
          font-weight: 500;
        }

        .el-icon {
          font-size: 16px;
        }

        .nav-text {
          font-size: 14px;
        }
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--blog-spacing-md);

    .mobile-search-btn {
      display: none;

      @media (max-width: 768px) {
        display: flex;
      }
    }

    .desktop-search {
      width: 200px;

      @media (max-width: 768px) {
        display: none;
      }
    }

    .user-section {
      .user-avatar {
        display: flex;
        align-items: center;
        gap: var(--blog-spacing-sm);
        cursor: pointer;
        padding: var(--blog-spacing-xs) var(--blog-spacing-sm);
        border-radius: var(--blog-border-radius);
        transition: background-color 0.3s ease;

        &:hover {
          background-color: var(--blog-bg-gray);
        }

        .user-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--blog-text-primary);

          @media (max-width: 576px) {
            display: none;
          }
        }

        .dropdown-icon {
          font-size: 12px;
          color: var(--blog-text-secondary);
        }
      }

      .auth-buttons {
        display: flex;
        gap: var(--blog-spacing-sm);
      }
    }
  }
}

.search-dialog-content {
  .el-input {
    margin-bottom: var(--blog-spacing-md);
  }

  .search-hint {
    text-align: center;
    color: var(--blog-text-secondary);
    font-size: 12px;
  }
}
</style>