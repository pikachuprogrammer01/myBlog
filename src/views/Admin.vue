<template>
  <div class="admin">
    <h1 class="blog-page-title">
      <el-icon><Setting /></el-icon> 管理后台
    </h1>

    <div v-if="!isAdmin" class="permission-denied">
      非管理员，请使用管理员账号登录后再访问
    </div>

    <div v-else class="admin-dashboard">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="数据概览" name="overview">
          <AdminStats :stats="stats" />
          <div class="blog-card">
            <AdminChart ref="overviewChartRef" v-if="articles.length > 0" :options="categoryOptions" />
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
            :comments="comments"
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
  import { ref, computed, onMounted, watch, nextTick } from "vue";
  import { useRouter } from "vue-router";
  import { ElMessage, ElMessageBox } from "element-plus";
  import { Setting } from "@element-plus/icons-vue";

  import { getAdminArticles, getAdminStats, getAdminComments, getAdminArticleStats, getAdminArticleList, clearAllComments as clearAllCommentsApi, resetAllData as resetAllDataApi, testEmailConfig } from "@/api/services/adminService";
  import { getCache, setCache } from "@/utils/cache";
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
  import DataActions from "@/components/admin/DataActions.vue";

  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const {
    deleteComment: deleteCommentApi,
    batchDeleteComments: batchDeleteApi,
    permanentDeleteComment: permanentDeleteApi,
  } = useComments();
  const { getArticles } = useArticles();

  const confirmBase = {
    appendTo: '#app',
    lockScroll: false,
  };

  const activeTab = ref("overview");
  const comments = ref([]);
  const articles = ref([]);
  const articleStats = ref([]);
  const tagManagerRef = ref(null);
  const toolManagerRef = ref(null);
  const overviewChartRef = ref(null);

  const categoryOptions = computed(() => {
    if (articles.value.length === 0) return {};
    const categoryMap = {};
    articles.value.forEach((post) => {
      const cats =
        post.categories ||
        (post.category_name ? [post.category_name] : ["未分类"]);
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

    // Step 2: Show cached data from previous admin visit
    const cachedStats = getCache(STORAGE_KEYS.CACHED_ADMIN_STATS);
    const cachedComments = getCache(STORAGE_KEYS.CACHED_ADMIN_COMMENTS);
    const cachedArticleStats = getCache(STORAGE_KEYS.CACHED_ADMIN_ARTICLE_STATS);

    if (cachedStats) {
      stats.value = cachedStats;
    } else {
      stats.value = {
        totalArticles: localArticles.length,
        totalComments: 0,
        totalUsers: 0,
        totalViews: localArticles.reduce(
          (sum, a) => sum + (a.view_count || a.views || 0),
          0,
        ),
      };
    }

    if (cachedComments) {
      comments.value = cachedComments;
    }

    if (cachedArticleStats) {
      articleStats.value = cachedArticleStats;
    }

    // Step 3: Refresh from API in background
    try {
      const [articlesRes, statsRes, commentsRes, articleStatsRes] = await Promise.all([
        getAdminArticles(),
        getAdminStats(),
        getAdminComments({ limit: 100 }),
        getAdminArticleStats(),
      ]);

      if (articlesRes.data.success) {
        articles.value = articlesRes.data.data.map((a) => ({
          ...a,
          id: a.slug || a.id,
          categories: a.category_name ? [a.category_name] : a.categories || [],
        }));
      }

      if (statsRes.data.success) {
        stats.value = statsRes.data.data;
        setCache(STORAGE_KEYS.CACHED_ADMIN_STATS, stats.value);
      }

      if (commentsRes.data.success) {
        comments.value = commentsRes.data.data.map((c) => ({
          ...c,
          username: c.username || c.user_id,
          articleTitle: c.article_title,
          articleSlug: c.article_slug,
        }));
        setCache(STORAGE_KEYS.CACHED_ADMIN_COMMENTS, comments.value);
      }

      if (articleStatsRes.data.success) {
        articleStats.value = articleStatsRes.data.data;
        setCache(STORAGE_KEYS.CACHED_ADMIN_ARTICLE_STATS, articleStats.value);
      }
    } catch (error) {
      console.error(
        "API 加载管理数据失败，使用缓存数据:",
        error?.message || error,
      );
    }
  };

  const deleteComment = (commentId) => {
    ElMessageBox.confirm("确定要删除这条评论吗？", "删除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      ...confirmBase,
    })
      .then(async () => {
        try {
          const result = await deleteCommentApi(commentId);
          if (result.success) {
            ElMessage.success("评论已删除");
            await loadData();
          } else {
            ElMessage.error(result.message || "删除失败");
          }
        } catch (error) {
          ElMessage.error(
            "删除失败: " +
              (error.response?.data?.message || error.message || "网络错误"),
          );
        }
      })
      .catch(() => {
        ElMessage.info("已取消删除");
        return;
      });
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
          ...confirmBase,
        },
      );
    } catch {
      ElMessage.info("已取消批量删除");
      return;
    }

    try {
      const result = await batchDeleteApi(commentIds);
      if (result.success) {
        ElMessage.success(
          `已删除 ${result.deletedCount || commentIds.length} 条评论`,
        );
        await loadData();
      } else {
        ElMessage.error(result.message || "批量删除失败");
      }
    } catch (error) {
      ElMessage.error(
        "批量删除失败: " +
          (error.response?.data?.message || error.message || "网络错误"),
      );
    }
  };

  const exportData = async () => {
    try {
      const { utils, writeFile } = await import("xlsx");

      const dateStr = new Date().toISOString().split("T")[0];
      const wb = utils.book_new();
      let fileName = `blog-data-${dateStr}.xlsx`;

      if (activeTab.value === "overview") {
        fileName = `blog-overview-${dateStr}.xlsx`;
        // Sheet 1: 数据概览
        utils.book_append_sheet(
          wb,
          utils.json_to_sheet([
            { 指标: "文章总数", 数值: stats.value.totalArticles },
            { 指标: "评论总数", 数值: stats.value.totalComments },
            { 指标: "用户总数", 数值: stats.value.totalUsers },
            { 指标: "总阅读量", 数值: stats.value.totalViews },
          ]),
          "数据概览",
        );

        // Sheet 2: 分类统计（来自饼图数据）
        const catData = (categoryOptions.value.series?.[0]?.data || []).map(
          (d) => ({ 分类: d.name, 文章数: d.value }),
        );
        if (catData.length > 0) {
          utils.book_append_sheet(
            wb,
            utils.json_to_sheet(catData),
            "分类统计",
          );
        }
      } else if (activeTab.value === "articles") {
        fileName = `blog-article-stats-${dateStr}.xlsx`;
        const data = articleStats.value.map((a) => ({
          文章标题: a.title,
          状态: a.status === "published" ? "已发布" : "草稿",
          浏览: a.view_count || 0,
          点赞: a.likes || 0,
          评论: a.comments || 0,
          收藏: a.bookmarks || 0,
          发布日期: a.created_at
            ? new Date(a.created_at).toLocaleDateString("zh-CN")
            : "-",
        }));
        utils.book_append_sheet(wb, utils.json_to_sheet(data), "文章数据");
      } else if (activeTab.value === "comments") {
        fileName = `blog-comments-${dateStr}.xlsx`;
        const data = comments.value.map((c) => ({
          用户: c.username || "-",
          评论内容: c.content || "-",
          所属文章: c.articleTitle || "-",
          时间: c.created_at
            ? new Date(c.created_at).toLocaleString("zh-CN")
            : "-",
        }));
        utils.book_append_sheet(wb, utils.json_to_sheet(data), "评论管理");
      } else if (activeTab.value === "article-manage") {
        fileName = `blog-article-list-${dateStr}.xlsx`;
        const res = await getAdminArticleList({ limit: 1000 });
        if (res.data.success) {
          const data = res.data.data.map((a) => ({
            文章标题: a.title || "-",
            状态: a.status === "published" ? "已发布" : "草稿",
            分类: a.category_name || "-",
            标签: Array.isArray(a.tags)
              ? a.tags.join(", ")
              : typeof a.tags === "string"
                ? a.tags
                : "-",
            浏览: a.view_count || 0,
            创建日期: a.created_at
              ? new Date(a.created_at).toLocaleDateString("zh-CN")
              : "-",
          }));
          utils.book_append_sheet(wb, utils.json_to_sheet(data), "文章管理");
        }
      } else if (activeTab.value === "tags") {
        fileName = `blog-tags-${dateStr}.xlsx`;
        const tagData = (tagManagerRef.value?.tags || []).map((t) => ({
          标签名称: t.name,
          别名: t.slug,
          文章数: t.articleCount || 0,
        }));
        utils.book_append_sheet(wb, utils.json_to_sheet(tagData), "标签管理");
      } else if (activeTab.value === "tools") {
        fileName = `blog-tools-${dateStr}.xlsx`;
        const toolData = (toolManagerRef.value?.tools || []).map((t) => ({
          工具名称: t.name,
          分类: t.category,
          链接: t.url,
          描述: t.description,
          排序: t.sort_order,
        }));
        utils.book_append_sheet(wb, utils.json_to_sheet(toolData), "工具管理");
      }

      writeFile(wb, fileName);
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
      ...confirmBase,
    })
      .then(async () => {
        try {
          const res = await clearAllCommentsApi();
          if (res.data.success) {
            ElMessage.success(
              `已清空 ${res.data.data?.deletedCount || 0} 条评论`,
            );
            comments.value = [];
            await loadData();
          } else {
            ElMessage.error(res.data.message || "清空失败");
          }
        } catch (error) {
          ElMessage.error(
            "清空评论失败: " + (error.response?.data?.message || error.message),
          );
        }
      })
      .catch(() => {});
  };

  const testEmail = async () => {
    try {
      const res = await testEmailConfig();
      if (res.data.success) {
        ElMessage.success(res.data.message || "测试邮件已发送");
      } else {
        ElMessage.error(res.data.message || "邮件测试失败");
      }
    } catch (error) {
      ElMessage.error(
        "邮件测试失败: " + (error.response?.data?.message || error.message),
      );
    }
  };

  const resetAllData = () => {
    ElMessageBox.confirm(
      "确定要重置所有数据吗？这是破坏性操作！将清空所有评论、点赞、收藏和联系消息。用户和文章数据将保留。",
      "重置确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "error",
        ...confirmBase,
      },
    )
      .then(async () => {
        try {
          const res = await resetAllDataApi();
          if (res.data.success) {
            ElMessage.success("系统数据已重置");
          } else {
            ElMessage.error(res.data.message || "重置失败");
          }
        } catch (error) {
          ElMessage.error(
            "重置失败: " + (error.response?.data?.message || error.message),
          );
        } finally {
          logout();
          router.push("/");
        }
      })
      .catch(() => {});
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
