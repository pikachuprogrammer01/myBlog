<template>
  <div class="admin">
    <h1 class="blog-page-title">
      <el-icon><Setting /></el-icon> 管理后台
    </h1>

    <div v-if="!isAdmin" class="permission-denied">
      非管理员，请使用管理员账号登录后再访问
    </div>

    <div v-else class="admin-dashboard">
      <AdminStats :stats="stats" />

      <div class="blog-card">
        <AdminChart v-if="articles.length > 0" :options="categoryOptions" />
      </div>

      <CommentManager
        :comments="comments"
        @delete="deleteComment"
        @batchDelete="batchDeleteComments"
      />

      <DataActions
        @export="exportData"
        @clearComments="clearAllComments"
        @resetAll="resetAllData"
      />
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted } from "vue";
  import { useRouter } from "vue-router";
  import { ElMessage, ElMessageBox } from "element-plus";
  import {
    Document,
    ChatDotRound,
    User,
    View,
    Download,
    Delete,
    Refresh,
    Setting,
    DataAnalysis,
    PieChart,
  } from "@element-plus/icons-vue";
  import adminClient from "@/api/client";
  import { getCache, setCache } from '@/utils/cache';
  import { STORAGE_KEYS } from '@/constants/storage-keys';
  import { useAuth } from "@/composables/useAuth";
  import { useComments } from "@/composables/useComments";
  import { useArticles } from "@/composables/useArticles";
  import AdminChart from "@/components/admin/AdminChart.vue";
  import AdminStats from "@/components/admin/AdminStats.vue";
  import CommentManager from "@/components/admin/CommentManager.vue";
  import DataActions from "@/components/admin/DataActions.vue";

  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { deleteComment: deleteCommentApi, permanentDeleteComment: permanentDeleteApi } = useComments();
  const { getArticles } = useArticles();

  const comments = ref([]);
  const articles = ref([]);

  const categoryOptions = computed(() => {
    if (articles.value.length === 0) return {};
    const categoryMap = {};
    articles.value.forEach((post) => {
      const cats = post.categories || (post.category_name ? [post.category_name] : ["未分类"]);
      cats.forEach((cat) => {
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      });
    });

    return {
      tooltip: { trigger: "item", formatter: "{b}: <b>{c}</b> 篇 ({d}%)" },
      legend: { bottom: "0", icon: "circle", itemGap: 15 },
      series: [
        {
          name: "分类占比",
          type: "pie",
          radius: ["45%", "70%"],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 10, borderColor: "#fff", borderWidth: 2 },
          emphasis: {
            label: { show: true, fontSize: "14", fontWeight: "bold" },
          },
          data: Object.keys(categoryMap).map((key) => ({
            name: key,
            value: categoryMap[key],
          })),
        },
      ],
    };
  });

  const isAdmin = computed(() => currentUser.value?.role === "admin");

  const stats = ref({
    totalArticles: 0,
    totalComments: 0,
    totalUsers: 0,
    totalViews: 0,
  });

  const loadData = async () => {
    if (!isAdmin.value) return;

    // Step 1: Show article store data immediately
    const localArticles = getArticles();
    articles.value = localArticles;

    // Step 2: Show cached stats & comments from previous admin visit
    const cachedStats = getCache(STORAGE_KEYS.CACHED_ADMIN_STATS);
    const cachedComments = getCache(STORAGE_KEYS.CACHED_ADMIN_COMMENTS);

    if (cachedStats) {
      stats.value = cachedStats;
    } else {
      stats.value = {
        totalArticles: localArticles.length,
        totalComments: 0,
        totalUsers: 0,
        totalViews: localArticles.reduce((sum, a) => sum + (a.view_count || a.views || 0), 0),
      };
    }

    if (cachedComments) {
      comments.value = cachedComments;
    }

    // Step 3: Refresh from API in background
    try {
      const [articlesRes, statsRes, commentsRes] = await Promise.all([
        adminClient.get('/api/articles', { params: { limit: 100 } }),
        adminClient.get('/api/admin/stats'),
        adminClient.get('/api/admin/comments', { params: { limit: 100 } }),
      ]);

      if (articlesRes.data.success) {
        articles.value = articlesRes.data.data.map(a => ({
          ...a,
          id: a.slug || a.id,
          categories: a.category_name ? [a.category_name] : (a.categories || []),
        }));
      }

      if (statsRes.data.success) {
        stats.value = statsRes.data.data;
        setCache(STORAGE_KEYS.CACHED_ADMIN_STATS, stats.value);
      }

      if (commentsRes.data.success) {
        comments.value = commentsRes.data.data.map(c => ({
          ...c,
          username: c.username || c.user_id,
          articleTitle: c.article_title,
          articleSlug: c.article_slug,
        }));
        setCache(STORAGE_KEYS.CACHED_ADMIN_COMMENTS, comments.value);
      }
    } catch (error) {
      console.error('API 加载管理数据失败，使用缓存数据:', error?.message || error);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await ElMessageBox.confirm("确定要删除这条评论吗？", "删除确认", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });

      const result = await deleteCommentApi(commentId);
      if (result.success) {
        ElMessage.success("评论已删除");
        await loadData();
      } else {
        ElMessage.error(result.message || "删除失败");
      }
    } catch (error) {
      // 用户取消删除
    }
  };

  const batchDeleteComments = async (commentIds) => {
    if (!commentIds || commentIds.length === 0) return;

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${commentIds.length} 条评论吗？`,
        "批量删除确认",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        },
      );

      let successCount = 0;
      for (const commentId of commentIds) {
        const result = await deleteCommentApi(commentId);
        if (result.success) successCount++;
      }

      ElMessage.success(`成功删除 ${successCount} 条评论`);
      await loadData();
    } catch (error) {
      // 用户取消删除
    }
  };

  const exportData = async () => {
    try {
      const data = {
        stats: stats.value,
        exportTime: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `blog-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      ElMessage.success("数据导出成功");
    } catch {
      ElMessage.error("导出失败");
    }
  };

  const clearAllComments = () => {
    ElMessageBox.confirm("确定要清空所有评论吗？此操作不可恢复！", "清空确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "error",
      confirmButtonClass: "el-button--danger",
    })
      .then(async () => {
        try {
          const res = await adminClient.delete('/api/admin/comments');
          if (res.data.success) {
            ElMessage.success(`已清空 ${res.data.data?.deletedCount || 0} 条评论`);
            comments.value = [];
            await loadData();
          } else {
            ElMessage.error(res.data.message || '清空失败');
          }
        } catch (error) {
          ElMessage.error('清空评论失败: ' + (error.response?.data?.message || error.message));
        }
      })
      .catch(() => {});
  };

  const resetAllData = () => {
    ElMessageBox.confirm(
      "确定要重置所有数据吗？这是破坏性操作！将清空所有评论、点赞、收藏和联系消息。用户和文章数据将保留。",
      "重置确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "error",
        confirmButtonClass: "el-button--danger",
      },
    )
      .then(async () => {
        try {
          const res = await adminClient.post('/api/admin/reset');
          if (res.data.success) {
            ElMessage.success('系统数据已重置');
          } else {
            ElMessage.error(res.data.message || '重置失败');
          }
        } catch (error) {
          ElMessage.error('重置失败: ' + (error.response?.data?.message || error.message));
        } finally {
          logout();
          router.push('/');
        }
      })
      .catch(() => {});
  };

  onMounted(() => {
    loadData();
  });
</script>

<style scoped lang="scss">
  .admin {
    padding: var(--blog-spacing-md) 0;

    .permission-denied {
      max-width: 600px;
      margin: 0 auto;
    }

    .admin-dashboard {
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--blog-spacing-md);

        h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
      }

      .comment-content {
        max-height: 60px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;

        .chart-item {
          min-height: 350px;
          padding: 15px;
          :deep(.chart-container) {
            height: 300px;
          }
          .chart-title {
            text-align: center;
            margin-bottom: 15px;
            font-size: 14px;
            color: #606266;
          }
        }
      }

      .empty-state {
        text-align: center;
        padding: var(--blog-spacing-xl);
        color: var(--blog-text-secondary);
      }

      .data-actions {
        display: flex;
        gap: var(--blog-spacing-md);
        margin-bottom: var(--blog-spacing-md);
      }

      .warning-hint {
        margin-top: var(--blog-spacing-md);
      }
    }
  }
</style>
