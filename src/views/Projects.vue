<template>
  <div class="projects-container">
    <div class="page-header">
      <h1 class="title">
        <span class="sys-prefix">&gt;&gt;</span> 个人项目
        <span class="sys-cursor">_</span>
      </h1>
      <p class="description">我开发并部署的项目汇总，点击卡片可跳转至项目详情。</p>
    </div>

    <!-- 筛选 -->
    <div class="filter-section">
      <button
        v-for="cat in categories"
        :key="cat"
        :class="['filter-btn', { active: currentCategory === cat }]"
        @click="currentCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <!-- 项目列表 -->
    <div v-if="filteredProjects.length > 0" class="projects-grid">
      <div
        v-for="project in filteredProjects"
        :key="project.id || project.name"
        class="project-card"
        @click="openProject(project.url)"
      >
        <!-- 左侧状态条 -->
        <div class="status-bar"></div>

        <div class="card-body">
          <div class="card-header">
            <h3 class="project-name">{{ project.name }}</h3>
            <el-icon class="external-icon"><TopRight /></el-icon>
          </div>
          <p class="project-desc">{{ project.description || project.desc }}</p>
          <div class="card-footer">
            <div class="tech-tags">
              <span
                v-for="tech in (project.tech_stack || project.techStack || [])"
                :key="tech"
                class="tech-tag"
              >#{{ tech }}</span>
            </div>
            <span class="hex-id">0x{{ projectHexId(project) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <p>暂无项目数据</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { TopRight } from "@element-plus/icons-vue";
import { getProjects } from "@/api/services/projectService";

const currentCategory = ref("全部");
const projects = ref([]);

// 静态后备数据
const fallbackProjects = [
  {
    id: 1,
    name: "个人博客系统",
    description: "基于 Vue 3 + Element Plus 的全栈个人博客，支持文章管理、评论、收藏、管理后台等功能。",
    url: "https://github.com/pikachuprogrammer01/myBlog",
    tech_stack: ["Vue3", "Element Plus", "Vite", "Node.js", "MySQL"],
    category: "前端",
  },
];

const categories = computed(() => {
  const cats = new Set(["全部"]);
  projects.value.forEach((p) => {
    if (p.category) cats.add(p.category);
  });
  return Array.from(cats);
});

const filteredProjects = computed(() => {
  if (currentCategory.value === "全部") return projects.value;
  return projects.value.filter((p) => p.category === currentCategory.value);
});

const projectHexId = (project) => {
  const id = project.id || project.name;
  if (typeof id === "number") return id.toString(16).toUpperCase().padStart(4, "0");
  let hash = 0;
  for (let i = 0; i < String(id).length; i++) {
    hash = (hash << 5) - hash + String(id).charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(4, "0").slice(0, 4);
};

const openProject = (url) => {
  window.open(url, "_blank", "noopener");
};

onMounted(async () => {
  try {
    const res = await getProjects();
    if (res.data.success && res.data.data) {
      projects.value = res.data.data.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        url: p.url,
        tech_stack: p.tech_stack || [],
        category: p.category,
      }));
      return;
    }
  } catch {
    // API unavailable, use fallback
  }
  projects.value = fallbackProjects;
});
</script>

<style lang="scss" scoped>
$bg-panel: #161b22;
$border-color: #30363d;
$accent-gold: #f2c94c;
$text-bright: #e6edf3;
$text-muted: #8b949e;
$link-blue: #58a6ff;

.projects-container {
  padding: 28px 0;

  .page-header {
    margin-bottom: 28px;

    .title {
      font-size: 24px;
      font-weight: 700;
      color: $text-bright;
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 0 8px;
      font-family: "Courier New", "Source Code Pro", monospace;

      .sys-prefix {
        color: $accent-gold;
      }

      .sys-cursor {
        color: $accent-gold;
        font-weight: 300;
        animation: cursor-blink 1s step-end infinite;
      }
    }

    .description {
      color: $text-muted;
      margin: 0;
      font-size: 14px;
    }
  }

  .filter-section {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid $border-color;

    .filter-btn {
      font-family: "Courier New", monospace;
      font-size: 12px;
      letter-spacing: 1px;
      color: $text-muted;
      background: $bg-panel;
      border: 1px solid $border-color;
      padding: 6px 16px;
      cursor: pointer;
      transition: all 0.12s ease;
      box-shadow: 2px 2px 0px #000;

      &:hover {
        color: $text-bright;
        border-color: lighten($border-color, 10%);
      }

      &.active {
        background: $accent-gold;
        color: #0d0f11;
        border-color: $accent-gold;
        font-weight: 700;
      }
    }
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }

  .project-card {
    background: $bg-panel;
    border: 1px solid $border-color;
    border-radius: 2px;
    box-shadow: 4px 4px 0px #000;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.15s ease;
    display: flex;

    &:hover {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0px #000;

      .status-bar {
        opacity: 1;
      }

      .external-icon {
        color: $accent-gold;
        transform: translate(3px, -3px);
      }
    }

    .status-bar {
      width: 3px;
      background: $link-blue;
      opacity: 0.5;
      transition: opacity 0.15s ease;
      flex-shrink: 0;
    }

    .card-body {
      flex: 1;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;

      .project-name {
        font-size: 16px;
        font-weight: 600;
        color: $text-bright;
        margin: 0;
        line-height: 1.3;
      }

      .external-icon {
        color: $text-muted;
        font-size: 16px;
        transition: all 0.15s ease;
        flex-shrink: 0;
        margin-left: 8px;
      }
    }

    .project-desc {
      font-size: 13px;
      color: $text-muted;
      line-height: 1.6;
      margin: 0 0 16px;
      flex: 1;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: auto;

      .tech-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .tech-tag {
          font-family: "Courier New", monospace;
          font-size: 10px;
          color: $text-muted;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba($border-color, 0.6);
          padding: 2px 8px;
          border-radius: 2px;
        }
      }

      .hex-id {
        font-family: "Courier New", monospace;
        font-size: 10px;
        color: rgba($text-muted, 0.6);
        letter-spacing: 1px;
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 60px 0;
    color: $text-muted;
  }
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
