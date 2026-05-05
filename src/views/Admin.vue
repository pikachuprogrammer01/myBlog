<template>
  <div class="admin">
    <h1 class="blog-page-title">
      <el-icon><Setting /></el-icon> 管理后台
    </h1>

    <div v-if="!isAdmin" class="permission-denied">
      非管理员，请使用管理员账号登录后再访问
    </div>

    <div v-else class="admin-dashboard" v-loading="adminLoading">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="数据概览" name="overview">
          <AdminStats :stats="stats" />
          <div class="blog-card">
            <AdminChart
              ref="overviewChartRef"
              v-if="articles.length > 0"
              :options="categoryOptions"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="文章数据" name="articles">
          <ArticleStatsTable :articles="articleStats" />
        </el-tab-pane>

        <el-tab-pane label="文章管理" name="article-manage">
          <ArticleManager />
        </el-tab-pane>

        <el-tab-pane label="评论管理" name="comments">
          <CommentManager
            ref="commentManagerRef"
            @delete="deleteComment"
            @batchDelete="batchDeleteComments"
          />
        </el-tab-pane>

        <el-tab-pane label="标签管理" name="tags">
          <TagManager ref="tagManagerRef" />
        </el-tab-pane>

        <el-tab-pane label="工具管理" name="tools">
          <ToolManager ref="toolManagerRef" />
        </el-tab-pane>

        <el-tab-pane label="题库管理" name="interview">
          <InterviewManager ref="interviewManagerRef" />
        </el-tab-pane>

        <el-tab-pane label="项目管理" name="projects">
          <ProjectManager ref="projectManagerRef" />
        </el-tab-pane>

        <el-tab-pane label="用户管理" name="users">
          <UserManager ref="userManagerRef" />
        </el-tab-pane>
      </el-tabs>

      <DataActions
        @export="exportData"
        @clearComments="clearAllComments"
        @resetAll="resetAllData"
        @testEmail="testEmail"
      />
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, watch, nextTick, provide } from "vue";
  import { useRouter } from "vue-router";
  import { ElMessage } from "element-plus";
  import { Setting } from "@element-plus/icons-vue";

  import {
    getAdminArticles,
    getAdminStats,
    getAdminComments,
    getAdminArticleStats,
    getAdminArticleList,
    getAdminUsers,
    clearAllComments as clearAllCommentsApi,
    resetAllData as resetAllDataApi,
    testEmailConfig,
  } from "@/api/services/adminService";
  import { getCache, setCache, removeCache } from "@/utils/cache";
  import { STORAGE_KEYS } from "@/constants/storage-keys";
  import { useAuth } from "@/composables/useAuth";
  import { useComments } from "@/composables/useComments";
  import { useArticles } from "@/composables/useArticles";
  import AdminChart from "@/components/admin/AdminChart.vue";
  import AdminStats from "@/components/admin/AdminStats.vue";
  import CommentManager from "@/components/admin/CommentManager.vue";
  import ArticleStatsTable from "@/components/admin/ArticleStatsTable.vue";
  import TagManager from "@/components/admin/TagManager.vue";
  import ArticleManager from "@/components/admin/ArticleManager.vue";
  import ToolManager from "@/components/admin/ToolManager.vue";
  import InterviewManager from "@/components/admin/InterviewManager.vue";
  import ProjectManager from "@/components/admin/ProjectManager.vue";
  import UserManager from "@/components/admin/UserManager.vue";
  import DataActions from "@/components/admin/DataActions.vue";
  import { getAdminInterviewQuestions } from "@/api/services/interviewService";
  import { buildExportConfigs } from "@/constants/adminExportConfigs";
  import { errMsg } from "@/utils/error";
  import { confirmThen } from "@/utils/confirm";

  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const {
    deleteComment: deleteCommentApi,
    batchDeleteComments: batchDeleteApi,
    permanentDeleteComment: permanentDeleteApi,
  } = useComments();
  const { getArticles } = useArticles();

  const activeTab = ref("overview");
  const articles = ref([]);
  const articleStats = ref([]);
  const tagManagerRef = ref(null);
  const toolManagerRef = ref(null);
  const commentManagerRef = ref(null);
  const interviewManagerRef = ref(null);
  const projectManagerRef = ref(null);
  const userManagerRef = ref(null);
  const overviewChartRef = ref(null);

  const categoryOptions = computed(() => {
    if (articles.value.length === 0) return {};
    const map = {};
    articles.value.forEach((post) => {
      (post.categories || (post.category_name ? [post.category_name] : ["未分类"])).forEach((c) => {
        map[c] = (map[c] || 0) + 1;
      });
    });
    return {
      tooltip: { trigger: "item", formatter: "{b}: <b>{c}</b> 篇 ({d}%)" },
      legend: { bottom: "0", icon: "circle", itemGap: 15 },
      series: [{
        name: "分类占比", type: "pie", radius: ["45%", "70%"], avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: "#161b22", borderWidth: 2 },
        emphasis: { label: { show: true, fontSize: "14", fontWeight: "bold" } },
        data: Object.keys(map).map((k) => ({ name: k, value: map[k] })),
      }],
    };
  });

  const isAdmin = computed(() => currentUser.value?.role === "admin");

  const stats = ref({
    totalArticles: 0,
    totalComments: 0,
    totalUsers: 0,
    totalViews: 0,
  });

  const adminLoading = ref(false);

  const loadData = async (skipCache = false) => {
    if (!isAdmin.value) return;

    if (skipCache) {
      removeCache(STORAGE_KEYS.CACHED_ADMIN_STATS);
      removeCache(STORAGE_KEYS.CACHED_ADMIN_ARTICLE_STATS);
      adminLoading.value = true;
    } else {
      const localArticles = getArticles();
      articles.value = localArticles;

      const cachedStats = getCache(STORAGE_KEYS.CACHED_ADMIN_STATS);
      const cachedArticleStats = getCache(STORAGE_KEYS.CACHED_ADMIN_ARTICLE_STATS);

      stats.value = cachedStats || {
        totalArticles: localArticles.length, totalComments: 0, totalUsers: 0,
        totalViews: localArticles.reduce((sum, a) => sum + (a.view_count || a.views || 0), 0),
      };
      if (cachedArticleStats) articleStats.value = cachedArticleStats;
    }

    try {
      const [articlesRes, statsRes, articleStatsRes] = await Promise.all([
        getAdminArticles(), getAdminStats(), getAdminArticleStats(),
      ]);

      if (articlesRes.data.success) {
        articles.value = articlesRes.data.data.map((a) => ({
          ...a, id: a.slug || a.id,
          categories: a.category_name ? [a.category_name] : a.categories || [],
        }));
      }
      if (statsRes.data.success) {
        stats.value = statsRes.data.data;
        setCache(STORAGE_KEYS.CACHED_ADMIN_STATS, stats.value);
      }
      if (articleStatsRes.data.success) {
        articleStats.value = articleStatsRes.data.data;
        setCache(STORAGE_KEYS.CACHED_ADMIN_ARTICLE_STATS, articleStats.value);
      }
    } catch (error) {
      console.error("API 加载管理数据失败，使用缓存数据:", error?.message || error);
    } finally {
      if (skipCache) adminLoading.value = false;
    }
  };

  provide("refreshAdminData", () => loadData(true));

  const deleteComment = (commentId) => {
    confirmThen("确定要删除这条评论吗？", "删除确认", "warning", async () => {
      try {
        const result = await deleteCommentApi(commentId);
        if (result.success) {
          ElMessage.success("评论已删除");
          commentManagerRef.value?.loadComments();
        } else {
          ElMessage.error(result.message || "删除失败");
        }
      } catch (error) {
        ElMessage.error(errMsg(error, "删除失败: "));
      }
    });
  };

  const batchDeleteComments = (commentIds) => {
    if (!commentIds || commentIds.length === 0) return;
    confirmThen(`确定要删除选中的 ${commentIds.length} 条评论吗？`, "批量删除确认", "warning", async () => {
      try {
        const result = await batchDeleteApi(commentIds);
        if (result.success) {
          ElMessage.success(`已删除 ${result.deletedCount || commentIds.length} 条评论`);
          commentManagerRef.value?.loadComments();
        } else {
          ElMessage.error(result.message || "批量删除失败");
        }
      } catch (error) {
        ElMessage.error(errMsg(error, "批量删除失败: "));
      }
    });
  };

  const exportConfigs = buildExportConfigs({
    stats,
    categoryOptions,
    articleStats,
    tagManagerRef,
    toolManagerRef,
    projectManagerRef,
    getAdminComments,
    getAdminArticleList,
    getAdminInterviewQuestions,
    getAdminUsers,
  });

  const exportData = async () => {
    try {
      const cfg = exportConfigs.find((c) => c.tab === activeTab.value);
      if (!cfg) {
        ElMessage.error("暂无导出配置");
        return;
      }

      const { utils, writeFile } = await import("xlsx");
      const dateStr = new Date().toISOString().split("T")[0];
      const wb = utils.book_new();

      for (const sheet of cfg.sheets) {
        const rows = await sheet.getRows();
        if (sheet.skipIfEmpty && rows.length === 0) continue;
        const header = sheet.columns.map((c) => c.label);
        const body = rows.map((row) => sheet.columns.map((c) => row[c.field]));
        utils.book_append_sheet(
          wb,
          utils.aoa_to_sheet([header, ...body]),
          sheet.sheetName,
        );
      }

      writeFile(wb, `blog-${cfg.name}-${dateStr}.xlsx`);
      ElMessage.success("数据导出成功");
    } catch {
      ElMessage.error("导出失败");
    }
  };

  const clearAllComments = () => {
    confirmThen("确定要清空所有评论吗？此操作不可恢复！", "清空确认", "error", async () => {
      try {
        const res = await clearAllCommentsApi();
        if (res.data.success) {
          ElMessage.success(`已清空 ${res.data.data?.deletedCount || 0} 条评论`);
          commentManagerRef.value?.loadComments();
          await loadData();
        } else {
          ElMessage.error(res.data.message || "清空失败");
        }
      } catch (error) {
        ElMessage.error(errMsg(error, "清空评论失败: "));
      }
    });
  };

  const testEmail = async () => {
    try {
      const res = await testEmailConfig();
      const msg = res.data.message;
      if (res.data.success) ElMessage.success(msg || "测试邮件已发送");
      else ElMessage.error(msg || "邮件测试失败");
    } catch (error) {
      ElMessage.error(errMsg(error, "邮件测试失败: "));
    }
  };

  const resetAllData = () => {
    confirmThen(
      "确定要重置所有数据吗？这是破坏性操作！将清空所有评论、点赞、收藏和联系消息。用户和文章数据将保留。",
      "重置确认", "error", async () => {
        try {
          const res = await resetAllDataApi();
          if (res.data.success) {
            ElMessage.success("系统数据已重置");
          } else {
            ElMessage.error(res.data.message || "重置失败");
          }
        } catch (error) {
          ElMessage.error(errMsg(error, "重置失败: "));
        } finally {
          logout();
          router.push("/");
        }
      });
  };

  watch(activeTab, (newTab) => {
    if (newTab === "overview") {
      nextTick(() => {
        overviewChartRef.value?.resize();
      });
    }
  });

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
      :deep(.el-tabs__content) {
        padding: var(--blog-spacing-md);
        overflow: visible;
      }
    }
  }
</style>
