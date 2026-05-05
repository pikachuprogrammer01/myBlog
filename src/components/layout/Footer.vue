<template>
  <footer class="blog-footer">
    <div class="footer-container">
      <div class="footer-main">
        <!-- 关于本站 -->
        <div class="footer-section">
          <h3 class="section-title">
            <span class="sys-prefix">&gt;</span> 关于本站
          </h3>
          <p class="section-description">
            一个个人博客，用于分享技术与生活感悟。
          </p>
          <div class="social-links">
            <a href="https://github.com" target="_blank" class="social-link" title="GitHub">
              <el-icon><Platform /></el-icon>
            </a>
            <a href="https://weibo.com" target="_blank" class="social-link" title="微博">
              <el-icon><Promotion /></el-icon>
            </a>
            <a href="#" class="social-link" title="邮箱" @click.prevent="goToContact">
              <el-icon><Message /></el-icon>
            </a>
          </div>
        </div>

        <!-- 友情链接 -->
        <div class="footer-section">
          <h3 class="section-title">
            <span class="sys-prefix">&gt;</span> 友情链接
          </h3>
          <ul class="friend-links">
            <li><a href="https://vuejs.org" target="_blank" class="friend-link">> Vue.js</a></li>
            <li><a href="https://element-plus.org" target="_blank" class="friend-link">> Element Plus</a></li>
            <li><a href="https://vitejs.dev" target="_blank" class="friend-link">> Vite</a></li>
            <li><a href="https://github.com" target="_blank" class="friend-link">> GitHub</a></li>
          </ul>
        </div>

        <!-- 统计信息 -->
        <div class="footer-section">
          <h3 class="section-title">
            <span class="sys-prefix">&gt;</span> 站点统计
          </h3>
          <div class="site-stats">
            <div class="stat-item">
              <span class="stat-num">{{ stats.articles }}</span>
              <span class="stat-label">文章</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">{{ stats.comments }}</span>
              <span class="stat-label">评论</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">{{ stats.views }}</span>
              <span class="stat-label">阅读</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">{{ stats.days }}</span>
              <span class="stat-label">天</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部 -->
      <div class="footer-bottom">
        <div class="copyright">
          <p>© {{ currentYear }} myBlog. All rights reserved.</p>
        </div>
        <div class="footer-links">
          <router-link to="/contact" class="footer-link-small">> 联系我们</router-link>
          <router-link to="/privacy" class="footer-link-small">> 隐私政策</router-link>
          <a href="#" class="footer-link-small" @click.prevent="scrollToTop">> 回到顶部</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  Platform, Promotion, Message,
} from "@element-plus/icons-vue";
import { useArticles } from "@/composables/useArticles";
import { useComments } from "@/composables/useComments";

const router = useRouter();
const { getArticles, getTotalViews } = useArticles();
const { getTotalCommentCount, loadTotalCommentCount } = useComments();

const goToContact = () => router.push("/contact");

const currentYear = computed(() => new Date().getFullYear());

const stats = computed(() => {
  const articles = getArticles();
  return {
    articles: articles.length,
    comments: getTotalCommentCount(),
    views: getTotalViews(),
    days: Math.floor((Date.now() - new Date("2025-09-01").getTime()) / 86400000),
  };
});

onMounted(() => loadTotalCommentCount());

const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
</script>

<style scoped lang="scss">
$bg-panel: #161b22;
$border-color: #30363d;
$accent-gold: #f2c94c;
$text-bright: #e6edf3;
$text-muted: #8b949e;

.blog-footer {
  background: #0d1117;
  border-top: 1px solid $border-color;
  padding: 40px 0 20px;
  margin-top: auto;

  .footer-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
  }

  .footer-main {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 32px;
    margin-bottom: 32px;
  }

  .footer-section {
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: "Courier New", "Source Code Pro", monospace;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 2px;
      color: $text-bright;
      margin: 0 0 16px;

      .sys-prefix {
        color: $accent-gold;
      }
    }

    .section-description {
      font-size: 13px;
      color: $text-muted;
      margin-bottom: 16px;
      line-height: 1.6;
    }

    .social-links {
      display: flex;
      gap: 12px;

      .social-link {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 1px solid $border-color;
        color: $text-muted;
        text-decoration: none;
        transition: all 0.1s ease;
        box-shadow: 2px 2px 0px #000;

        &:hover {
          color: $accent-gold;
          border-color: $accent-gold;
          transform: translate(1px, 1px);
          box-shadow: 1px 1px 0px #000;
        }
      }
    }

    .friend-links {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        margin-bottom: 6px;
      }

      .friend-link {
        color: $text-muted;
        text-decoration: none;
        font-family: "Courier New", monospace;
        font-size: 12px;
        transition: color 0.1s ease;

        &:hover {
          color: $accent-gold;
        }
      }
    }

    .site-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;

      .stat-item {
        text-align: center;
        padding: 10px 8px;
        background: $bg-panel;
        border: 1px solid $border-color;

        .stat-num {
          display: block;
          font-family: "Courier New", monospace;
          font-size: 20px;
          font-weight: 700;
          color: $accent-gold;
        }

        .stat-label {
          font-size: 10px;
          color: $text-muted;
          letter-spacing: 2px;
          font-family: "Courier New", monospace;
        }
      }
    }
  }

  .footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 20px;
    border-top: 1px solid $border-color;
    font-size: 12px;

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }

    .copyright {
      color: $text-muted;
      font-family: "Courier New", monospace;
    }

    .footer-links {
      display: flex;
      gap: 16px;

      .footer-link-small {
        color: $text-muted;
        text-decoration: none;
        font-family: "Courier New", monospace;
        font-size: 11px;

        &:hover {
          color: $accent-gold;
        }
      }
    }
  }
}
</style>
