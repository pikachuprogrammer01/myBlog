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
  import * as echarts from "echarts";
  import { HARDCODED_USERS } from "@/constants/users";
  import { STORAGE_KEYS } from "@/constants/storage-keys";
  import { useAuth } from "@/composables/useAuth";
  import { useComments } from "@/composables/useComments";
  import { useArticles } from "@/composables/useArticles";
  import { formatDate } from "@/utils/date";
  import AdminChart from "@/components/admin/AdminChart.vue";
  import AdminStats from "@/components/admin/AdminStats.vue";
  import CommentManager from "@/components/admin/CommentManager.vue";
  import DataActions from "@/components/admin/DataActions.vue";

  const router = useRouter();
  const {
    currentUser,
    getAllUsers,
    promoteUserToAdmin,
    resetLocalUsers,
    logout,
  } = useAuth();
  const {
    getAllComments,
    deleteComment: deleteCommentApi,
    clearAllComments: clearAllCommentsApi,
    exportComments,
  } = useComments();
  const { getArticles, getTotalViews } = useArticles();

  // 模拟数据状态
  const comments = ref([]);
  const articles = ref([]);
  const users = ref([]);
  const selectedComments = ref([]);

  const categoryOptions = computed(() => {
    if (articles.value.length === 0) return {}; // 防护空数据

    const categoryMap = {};
    articles.value.forEach((post) => {
      const cat = post.categories || "未分类";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
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

  // 评论趋势配置
  const commentTrendOptions = computed(() => {
    const days = [];
    const counts = [];
    // 优化：预先转换日期，避免在循环中反复转换
    const commentDates = comments.value.map(
      (c) => new Date(c.createdAt).toISOString().split("T")[0],
    );

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      days.push(dateStr.substring(5)); // MM-DD

      // 使用预处理的数组统计，性能更佳
      const count = commentDates.filter((date) => date === dateStr).length;
      counts.push(count);
    }

    return {
      tooltip: { trigger: "axis", backgroundColor: "rgba(255, 255, 255, 0.9)" },
      grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: days,
        axisLine: { lineStyle: { color: "#E4E7ED" } },
        axisLabel: { color: "#909399" },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { type: "dashed" } },
      },
      series: [
        {
          name: "每日评论数",
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 8,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(64, 158, 255, 0.3)" },
              { offset: 1, color: "rgba(64, 158, 255, 0)" },
            ]),
          },
          lineStyle: { width: 3, color: "#409EFF" },
          itemStyle: { color: "#409EFF" },
          data: counts,
        },
      ],
    };
  });

  // 权限检查
  const isAdmin = computed(() => currentUser.value?.role === "admin");

  // 统计数据
  const stats = ref({
    totalArticles: 0,
    totalComments: 0,
    totalUsers: 0,
    totalViews: 0,
  });

  // 加载数据
  const loadData = () => {
    if (!isAdmin.value) return;

    // 同步获取基础数据
    const allArticles = getArticles();
    articles.value = allArticles; // 确保 articles 被赋值

    const allComments = getAllComments({ includeDeleted: false });
    comments.value = allComments;

    users.value = getAllUsers().map((user) => ({
      ...user,
      isBuiltin: HARDCODED_USERS.some((b) => b.id === user.id),
    }));

    // 统一更新统计
    stats.value = {
      totalArticles: allArticles.length,
      totalComments: allComments.length,
      totalUsers: users.value.length,
      totalViews: getTotalViews(),
    };
  };

  // 表格选择变化
  const handleSelectionChange = (selection) => {
    selectedComments.value = selection.map((item) => item.id);
  };

  // 删除单条评论
  const deleteComment = async (commentId) => {
    try {
      await ElMessageBox.confirm("确定要删除这条评论吗？", "删除确认", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });

      // 实际调用删除接口
      const result = deleteCommentApi(commentId);
      if (result.success) {
        ElMessage.success("评论已删除");
        loadData();
      } else {
        ElMessage.error(result.message || "删除失败");
      }
    } catch (error) {
      // 用户取消删除
    }
  };

  // 批量删除评论
  const batchDeleteComments = async () => {
    if (selectedComments.value.length === 0) return;

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${selectedComments.value.length} 条评论吗？`,
        "批量删除确认",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        },
      );

      // 批量删除
      let successCount = 0;
      selectedComments.value.forEach((commentId) => {
        const result = deleteCommentApi(commentId);
        if (result.success) successCount++;
      });

      ElMessage.success(`成功删除 ${successCount} 条评论`);
      selectedComments.value = [];
      loadData();
    } catch (error) {
      // 用户取消删除
    }
  };

  // 设为管理员
  const promoteToAdmin = (userId) => {
    ElMessageBox.confirm("确定要将此用户设为管理员吗？", "管理员设置确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    })
      .then(() => {
        const result = promoteUserToAdmin(userId);
        if (result.success) {
          ElMessage.success("用户角色已更新");
          loadData();
        } else {
          ElMessage.error(result.message || "更新失败");
        }
      })
      .catch(() => {
        // 取消
      });
  };

  // 导出数据
  const exportData = () => {
    const data = {
      comments: JSON.parse(exportComments()),
      users: users.value,
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
  };

  // 清空所有评论
  const clearAllComments = () => {
    ElMessageBox.confirm("确定要清空所有评论吗？此操作不可恢复！", "清空确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "error",
      confirmButtonClass: "el-button--danger",
    })
      .then(() => {
        const result = clearAllCommentsApi();
        if (result.success) {
          ElMessage.success("所有评论已清空");
          loadData();
        } else {
          ElMessage.error(result.message || "清空失败");
        }
      })
      .catch(() => {
        // 取消
      });
  };

  // 重置所有数据
  const resetAllData = () => {
    ElMessageBox.confirm(
      "确定要重置所有数据吗？这将删除所有用户、评论等数据，恢复为初始状态！",
      "重置确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "error",
        confirmButtonClass: "el-button--danger",
      },
    )
      .then(() => {
        localStorage.removeItem(STORAGE_KEYS.COMMENTS);
        localStorage.removeItem(STORAGE_KEYS.ARTICLE_VIEWS);
        localStorage.removeItem(STORAGE_KEYS.ARTICLE_LIKES);
        localStorage.removeItem(STORAGE_KEYS.LIKED_ARTICLES);
        localStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
        localStorage.removeItem(STORAGE_KEYS.CONTACT_MESSAGES);
        resetLocalUsers();
        logout();
        ElMessage.success("所有数据已重置");
        router.push("/");
      })
      .catch(() => {
        // 取消
      });
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
