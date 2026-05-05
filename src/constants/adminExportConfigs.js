const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("zh-CN") : "-");
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("zh-CN") : "-");

export function buildExportConfigs(ctx) {
  const {
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
  } = ctx;

  return [
    {
      tab: "overview",
      name: "overview",
      sheets: [
        {
          sheetName: "数据概览",
          columns: [
            { field: "metric", label: "指标" },
            { field: "value", label: "数值" },
          ],
          getRows: () => [
            { metric: "文章总数", value: stats.value.totalArticles },
            { metric: "评论总数", value: stats.value.totalComments },
            { metric: "用户总数", value: stats.value.totalUsers },
            { metric: "总阅读量", value: stats.value.totalViews },
          ],
        },
        {
          sheetName: "分类统计",
          columns: [
            { field: "category", label: "分类" },
            { field: "count", label: "文章数" },
          ],
          getRows: () =>
            (categoryOptions.value.series?.[0]?.data || []).map((d) => ({
              category: d.name,
              count: d.value,
            })),
          skipIfEmpty: true,
        },
      ],
    },
    {
      tab: "articles",
      name: "article-stats",
      sheets: [
        {
          sheetName: "文章数据",
          columns: [
            { field: "title", label: "文章标题" },
            { field: "status", label: "状态" },
            { field: "views", label: "浏览" },
            { field: "likes", label: "点赞" },
            { field: "comments", label: "评论" },
            { field: "bookmarks", label: "收藏" },
            { field: "created", label: "发布日期" },
          ],
          getRows: () =>
            articleStats.value.map((a) => ({
              title: a.title,
              status: a.status === "published" ? "已发布" : "草稿",
              views: a.view_count || 0,
              likes: a.likes || 0,
              comments: a.comments || 0,
              bookmarks: a.bookmarks || 0,
              created: fmtDate(a.created_at),
            })),
        },
      ],
    },
    {
      tab: "comments",
      name: "comments",
      sheets: [
        {
          sheetName: "评论管理",
          columns: [
            { field: "user", label: "用户" },
            { field: "content", label: "评论内容" },
            { field: "article", label: "所属文章" },
            { field: "time", label: "时间" },
          ],
          getRows: async () => {
            const res = await getAdminComments({ limit: 10000 });
            return (res.data?.data || []).map((c) => ({
              user: c.username || c.user_id || "-",
              content: c.content || "-",
              article: c.article_title || "-",
              time: fmtDateTime(c.created_at),
            }));
          },
        },
      ],
    },
    {
      tab: "article-manage",
      name: "article-list",
      sheets: [
        {
          sheetName: "文章管理",
          columns: [
            { field: "title", label: "文章标题" },
            { field: "status", label: "状态" },
            { field: "category", label: "分类" },
            { field: "tags", label: "标签" },
            { field: "views", label: "浏览" },
            { field: "created", label: "创建日期" },
          ],
          getRows: async () => {
            const res = await getAdminArticleList({ limit: 1000 });
            if (!res.data.success) return [];
            return res.data.data.map((a) => ({
              title: a.title || "-",
              status: a.status === "published" ? "已发布" : "草稿",
              category: a.category_name || "-",
              tags: Array.isArray(a.tags)
                ? a.tags.join(", ")
                : typeof a.tags === "string"
                  ? a.tags
                  : "-",
              views: a.view_count || 0,
              created: fmtDate(a.created_at),
            }));
          },
        },
      ],
    },
    {
      tab: "tags",
      name: "tags",
      sheets: [
        {
          sheetName: "标签管理",
          columns: [
            { field: "name", label: "标签名称" },
            { field: "slug", label: "别名" },
            { field: "count", label: "文章数" },
          ],
          getRows: () =>
            (tagManagerRef.value?.tags || []).map((t) => ({
              name: t.name,
              slug: t.slug,
              count: t.articleCount || 0,
            })),
        },
      ],
    },
    {
      tab: "tools",
      name: "tools",
      sheets: [
        {
          sheetName: "工具管理",
          columns: [
            { field: "name", label: "工具名称" },
            { field: "category", label: "分类" },
            { field: "url", label: "链接" },
            { field: "description", label: "描述" },
            { field: "sort", label: "排序" },
          ],
          getRows: () =>
            (toolManagerRef.value?.tools || []).map((t) => ({
              name: t.name,
              category: t.category,
              url: t.url,
              description: t.description,
              sort: t.sort_order,
            })),
        },
      ],
    },
    {
      tab: "interview",
      name: "interview",
      sheets: [
        {
          sheetName: "题库管理",
          columns: [
            { field: "title", label: "题目标题" },
            { field: "category", label: "分类" },
            { field: "difficulty", label: "难度" },
            { field: "tags", label: "标签" },
            { field: "summary", label: "简述" },
            { field: "views", label: "浏览" },
            { field: "updated", label: "更新时间" },
          ],
          getRows: async () => {
            const res = await getAdminInterviewQuestions({ limit: 10000 });
            return (res.data?.data || []).map((q) => ({
              title: q.title,
              category: q.category,
              difficulty:
                q.difficulty === "easy"
                  ? "简单"
                  : q.difficulty === "medium"
                    ? "中等"
                    : "困难",
              tags: Array.isArray(q.tags) ? q.tags.join(", ") : "",
              summary: q.summary || "",
              views: q.view_count || 0,
              updated: fmtDateTime(q.updated_at),
            }));
          },
        },
      ],
    },
    {
      tab: "projects",
      name: "projects",
      sheets: [
        {
          sheetName: "项目管理",
          columns: [
            { field: "name", label: "项目名称" },
            { field: "category", label: "分类" },
            { field: "url", label: "链接" },
            { field: "techStack", label: "技术栈" },
            { field: "description", label: "描述" },
            { field: "sort", label: "排序" },
          ],
          getRows: () =>
            (projectManagerRef.value?.projects || []).map((p) => ({
              name: p.name,
              category: p.category,
              url: p.url,
              techStack: Array.isArray(p.tech_stack)
                ? p.tech_stack.join(", ")
                : "",
              description: p.description,
              sort: p.sort_order,
            })),
        },
      ],
    },
    {
      tab: "users",
      name: "users",
      sheets: [
        {
          sheetName: "用户管理",
          columns: [
            { field: "username", label: "用户名" },
            { field: "role", label: "角色" },
            { field: "created", label: "注册时间" },
          ],
          getRows: async () => {
            const res = await getAdminUsers({ limit: 10000 });
            return (res.data?.data || []).map((u) => ({
              username: u.username,
              role: u.role === "admin" ? "管理员" : "普通用户",
              created: fmtDateTime(u.created_at),
            }));
          },
        },
      ],
    },
  ];
}
