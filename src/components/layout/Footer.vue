<template>
  <footer class="blog-footer">
    <div class="footer-container">
      <!-- 主要部分 -->
      <div class="footer-main">
        <!-- 关于本站 -->
        <div class="footer-section">
          <h3 class="section-title">
            <el-icon><InfoFilled /></el-icon>
            关于本站
          </h3>
          <p class="section-description">
            一个个人博客，用于分享技术与生活感悟。
          </p>
          <div class="social-links">
            <a
              href="https://github.com"
              target="_blank"
              class="social-link"
              title="GitHub"
            >
              <el-icon><Platform /></el-icon>
            </a>
            <a
              href="https://weibo.com"
              target="_blank"
              class="social-link"
              title="微博"
            >
              <el-icon><Promotion /></el-icon>
            </a>
            <a href="https://mail.qq.com/" class="social-link" title="邮箱">
              <el-icon><Message /></el-icon>
            </a>
          </div>
        </div>

        <!-- 友情链接 -->
        <div class="footer-section">
          <h3 class="section-title">
            <el-icon><Connection /></el-icon>
            友情链接
          </h3>
          <ul class="friend-links">
            <li>
              <a href="https://vuejs.org" target="_blank" class="friend-link">
                <el-icon><DataLine /></el-icon>
                Vue.js
              </a>
            </li>
            <li>
              <a
                href="https://element-plus.org"
                target="_blank"
                class="friend-link"
              >
                <el-icon><ElementPlus /></el-icon>
                Element Plus
              </a>
            </li>
            <li>
              <a href="https://vitejs.dev" target="_blank" class="friend-link">
                <el-icon><Sunny /></el-icon>
                Vite
              </a>
            </li>
            <li>
              <a href="https://github.com" target="_blank" class="friend-link">
                <el-icon><Platform /></el-icon>
                GitHub
              </a>
            </li>
          </ul>
        </div>

        <!-- 统计信息 -->
        <div class="footer-section">
          <h3 class="section-title">
            <el-icon><DataAnalysis /></el-icon>
            站点统计
          </h3>
          <div class="site-stats">
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ stats.articles }}</div>
                <div class="stat-label">文章总数</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon><ChatDotRound /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ stats.comments }}</div>
                <div class="stat-label">评论总数</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon><View /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ stats.views }}</div>
                <div class="stat-label">阅读总量</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ stats.days }}</div>
                <div class="stat-label">运行天数</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 版权信息 -->
      <div class="footer-bottom">
        <div class="copyright">
          <p>© {{ currentYear }} 我的博客. 保留所有权利.</p>
        </div>
        <div class="footer-links">
          <router-link to="/contact" class="footer-link-small">
            <el-icon><Message /></el-icon>
            联系我们
          </router-link>
          <router-link to="/privacy" class="footer-link-small">
            <el-icon><Lock /></el-icon>
            隐私政策
          </router-link>
          <a href="#" class="footer-link-small" @click.prevent="scrollToTop">
            <el-icon><Top /></el-icon>
            回到顶部
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
  import { computed } from "vue";
  import {
    InfoFilled,
    Platform,
    Promotion,
    Message,
    Link,
    HomeFilled,
    Folder,
    PriceTag,
    Calendar,
    User,
    Tools,
    Connection,
    DataLine,
    ElementPlus,
    Sunny,
    DataAnalysis,
    Document,
    ChatDotRound,
    View,
    Timer,
    Lock,
    Top,
  } from "@element-plus/icons-vue";
  import { useArticles } from "@/composables/useArticles";
  import { useComments } from "@/composables/useComments";

  const { getArticles, getTotalViews } = useArticles();
  const { getTotalCommentCount } = useComments();

  // 当前年份
  const currentYear = computed(() => new Date().getFullYear());

  const stats = computed(() => {
    const articles = getArticles();
    const totalComments = getTotalCommentCount();

    return {
      articles: articles.length,
      comments: totalComments,
      views: getTotalViews(),
      days: Math.floor(
        (Date.now() - new Date("2025-01-01").getTime()) / (1000 * 60 * 60 * 24),
      ),
    };
  });

  // 滚动到顶部
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
</script>

<style scoped lang="scss">
  .blog-footer {
    background-color: var(--blog-bg-gray);
    border-top: 1px solid var(--blog-border-light);
    padding: var(--blog-spacing-xl) 0 var(--blog-spacing-md);
    margin-top: auto;

    .footer-container {
      max-width: var(--blog-container-width, 1200px);
      margin: 0 auto;
      padding: 0 var(--blog-spacing-md);

      @media (max-width: 768px) {
        padding: 0 var(--blog-spacing-sm);
      }
    }

    .footer-main {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--blog-spacing-xl);
      margin-bottom: var(--blog-spacing-xl);

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: var(--blog-spacing-lg);
      }
    }

    .footer-section {
      .section-title {
        display: flex;
        align-items: center;
        gap: var(--blog-spacing-xs);
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 var(--blog-spacing-md) 0;
        color: var(--blog-text-primary);

        .el-icon {
          color: var(--blog-primary-color);
        }
      }

      .section-description {
        font-size: 14px;
        line-height: 1.6;
        color: var(--blog-text-secondary);
        margin-bottom: var(--blog-spacing-md);
      }

      .social-links {
        display: flex;
        gap: var(--blog-spacing-md);

        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: var(--blog-bg-white);
          color: var(--blog-text-secondary);
          text-decoration: none;
          transition: all 0.3s ease;

          &:hover {
            background-color: var(--blog-primary-color);
            color: white;
            transform: translateY(-2px);
          }

          .el-icon {
            font-size: 18px;
          }
        }
      }

      .quick-links,
      .friend-links {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          margin-bottom: var(--blog-spacing-sm);

          &:last-child {
            margin-bottom: 0;
          }
        }

        .footer-link,
        .friend-link {
          display: flex;
          align-items: center;
          gap: var(--blog-spacing-xs);
          color: var(--blog-text-secondary);
          text-decoration: none;
          font-size: 14px;
          transition: all 0.3s ease;

          &:hover {
            color: var(--blog-primary-color);
            padding-left: var(--blog-spacing-xs);
          }

          .el-icon {
            font-size: 14px;
            width: 16px;
          }
        }

        .friend-link {
          color: var(--blog-info-color);
        }
      }
    }

    .site-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--blog-spacing-sm);

      .stat-item {
        display: flex;
        align-items: center;
        gap: var(--blog-spacing-xs);
        padding: var(--blog-spacing-sm);
        background-color: var(--blog-bg-white);
        border-radius: var(--blog-border-radius);
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: var(--blog-shadow-light);
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--blog-primary-light);
          color: var(--blog-primary-color);

          .el-icon {
            font-size: 16px;
          }
        }

        .stat-content {
          .stat-number {
            font-size: 16px;
            font-weight: 600;
            color: var(--blog-text-primary);
            line-height: 1.2;
          }

          .stat-label {
            font-size: 12px;
            color: var(--blog-text-secondary);
          }
        }
      }
    }

    .footer-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: var(--blog-spacing-lg);
      border-top: 1px solid var(--blog-border-light);
      font-size: 14px;

      @media (max-width: 768px) {
        flex-direction: column;
        gap: var(--blog-spacing-md);
        text-align: center;
      }

      .copyright {
        color: var(--blog-text-secondary);

        p {
          margin: 0 0 var(--blog-spacing-xs);
          display: flex;
          align-items: center;
          gap: var(--blog-spacing-xs);

          &:last-child {
            margin-bottom: 0;
          }

          .el-icon {
            font-size: 14px;
          }
        }

        .copyright-extra {
          font-size: 12px;
          color: var(--blog-info-color);
        }
      }

      .footer-links {
        display: flex;
        gap: var(--blog-spacing-lg);

        @media (max-width: 768px) {
          flex-wrap: wrap;
          justify-content: center;
          gap: var(--blog-spacing-md);
        }

        .footer-link-small {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--blog-text-secondary);
          text-decoration: none;
          transition: color 0.3s ease;

          &:hover {
            color: var(--blog-primary-color);
          }

          .el-icon {
            font-size: 12px;
          }
        }
      }
    }
  }
</style>
