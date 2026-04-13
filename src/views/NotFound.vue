<template>
  <div class="not-found">
    <div class="blog-card error-card">
      <div class="error-content">
        <div class="error-icon">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <h1>404</h1>
        <h2>页面未找到</h2>
        <p class="error-description">
          抱歉，您访问的页面不存在或已被移动。
        </p>
        <div class="error-actions">
          <el-button type="primary" @click="$router.push('/')">
            返回首页
          </el-button>
          <el-button @click="$router.go(-1)">
            返回上一页
          </el-button>
        </div>
        <div class="error-suggestions">
          <p>您也可以尝试：</p>
          <ul>
            <li>检查网址是否正确</li>
            <li>使用搜索功能查找内容</li>
            <li>浏览<a href="/">首页</a>的最新文章</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { WarningFilled } from '@element-plus/icons-vue'
</script>

<style scoped lang="scss">
.not-found {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--blog-spacing-md) 0;

  .error-card {
    max-width: 500px;
    margin: 0 auto;
    text-align: center;
  }

  .error-content {
    .error-icon {
      font-size: 80px;
      color: var(--blog-warning-color);
      margin-bottom: var(--blog-spacing-lg);
    }

    h1 {
      font-size: 96px;
      font-weight: 700;
      margin: 0;
      color: var(--blog-primary-color);
      line-height: 1;
    }

    h2 {
      font-size: 32px;
      font-weight: 600;
      margin: var(--blog-spacing-md) 0;
      color: var(--blog-text-primary);
    }

    .error-description {
      font-size: 18px;
      color: var(--blog-text-secondary);
      margin-bottom: var(--blog-spacing-xl);
    }

    .error-actions {
      display: flex;
      justify-content: center;
      gap: var(--blog-spacing-md);
      margin-bottom: var(--blog-spacing-xl);
    }

    .error-suggestions {
      text-align: left;
      padding: var(--blog-spacing-lg);
      background-color: var(--blog-bg-gray);
      border-radius: var(--blog-border-radius);

      p {
        font-weight: 600;
        margin-bottom: var(--blog-spacing-sm);
        color: var(--blog-text-primary);
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          padding: var(--blog-spacing-xs) 0;
          color: var(--blog-text-secondary);
          position: relative;
          padding-left: var(--blog-spacing-md);

          &::before {
            content: '•';
            position: absolute;
            left: 0;
            color: var(--blog-primary-color);
          }
        }

        a {
          color: var(--blog-primary-color);
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  }
}
</style>