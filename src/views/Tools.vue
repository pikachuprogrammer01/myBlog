<template>
  <div class="tools-container">
    <div class="page-header">
      <h1 class="title">
        <el-icon><Tools /></el-icon> 常用工具推荐
      </h1>
      <p class="description">收集了一些开发过程中常用的工具和优秀资源站点。</p>
    </div>

    <div class="filter-section">
      <el-radio-group v-model="currentCategory" size="large">
        <el-radio-button value="全部">全部</el-radio-button>
        <el-radio-button v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</el-radio-button>
      </el-radio-group>
    </div>

    <el-row :gutter="20" class="tools-grid">
      <el-col
        v-for="tool in filteredTools"
        :key="tool.name"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
      >
        <div class="blog-card tool-card" @click="openLink(tool.url)">
          <div class="tool-icon">
            <img :src="tool.icon" :alt="tool.name" @error="handleIconError" />
          </div>
          <div class="tool-info">
            <h4 class="tool-name">{{ tool.name }}</h4>
            <p class="tool-desc">{{ tool.desc }}</p>
          </div>
          <div class="tool-tag">
            <el-tag size="small" effect="plain">{{ tool.category }}</el-tag>
          </div>
          <el-icon class="external-link-icon"><TopRight /></el-icon>
        </div>
      </el-col>
    </el-row>

    <el-empty v-if="filteredTools.length === 0" description="暂无相关工具" />
  </div>
</template>

<script setup>
  import { ref, computed } from "vue";
  import { Tools, TopRight } from "@element-plus/icons-vue";

  // 分类数据
  const categories = ["前端工具", "Java/后端", "开发辅助", "学习社区"];
  const currentCategory = ref("全部");

  // 工具数据列表
  const toolsList = ref([
    {
      name: "Vue.js",
      desc: "渐进式 JavaScript 框架，本项目核心技术。",
      url: "https://vuejs.org/",
      icon: "https://vuejs.org/logo.svg",
      category: "前端工具",
    },
    {
      name: "Element Plus",
      desc: "基于 Vue 3，面向设计师和开发者的组件库。",
      url: "https://element-plus.org/",
      icon: "https://element-plus.org/images/element-plus-logo-small.svg",
      category: "前端工具",
    },
    {
      name: "MDN Web Docs",
      desc: "最权威的 Web 开发技术文档，自学必备。",
      url: "https://developer.mozilla.org/",
      icon: "https://developer.mozilla.org/favicon-48x48.png",
      category: "学习社区",
    },
    {
      name: "Can I Use",
      desc: "查询浏览器对前端特性的兼容性支持情况。",
      url: "https://caniuse.com/",
      icon: "https://caniuse.com/img/favicon-128.png",
      category: "前端工具",
    },
    {
      name: "Unsplash",
      desc: "免费的高质量摄影图片库，适合找博客配图。",
      url: "https://unsplash.com/",
      icon: "https://unsplash.com/favicon-32x32.png",
      category: "设计资源",
    },
    {
      name: "Iconify",
      desc: "统一的图标框架，可轻松使用数千个图标。",
      url: "https://icon-sets.iconify.design/",
      icon: "https://icon-sets.iconify.design/favicon.ico",
      category: "设计资源",
    },
    {
      name: "Spring Initializr",
      desc: "快速生成 Spring Boot 项目骨架的官方神器。",
      url: "https://start.spring.io/",
      icon: "https://spring.io/favicon.svg",
      category: "Java/后端",
    },
    {
      name: "Maven Repository",
      desc: "Java 依赖包查询库，配置 pom.xml 的必备站点。",
      url: "https://mvnrepository.com/",
      icon: "https://mvnrepository.com/favicon.ico",
      category: "Java/后端",
    },
    {
      name: "Hutool",
      desc: "一个让 Java 变得甜甜的工具库，大大简化代码。",
      url: "https://hutool.cn/",
      icon: "https://plus.hutool.cn/images/logo.png",
      category: "Java/后端",
    },
    {
      name: "Postman",
      desc: "接口调试利器，前后端联调的桥梁。",
      url: "https://www.postman.com/",
      icon: "https://www.postman.com/favicon.ico",
      category: "开发辅助",
    },
    {
      name: "JSON 格式化",
      desc: "在线解析和美化 JSON 数据，后端接口联调必备。",
      url: "https://www.json.cn/",
      icon: "https://www.json.cn/favicon.ico",
      category: "开发辅助",
    },
  ]);

  // 过滤后的工具列表
  const filteredTools = computed(() => {
    if (currentCategory.value === "全部") return toolsList.value;
    return toolsList.value.filter(
      (item) => item.category === currentCategory.value,
    );
  });

  const openLink = (url) => {
    window.open(url, "_blank");
  };

  // 图标加载失败处理
  const handleIconError = (e) => {
    e.target.src =
      "https://element-plus.org/images/element-plus-logo-small.svg"; // 默认占位图
  };
</script>

<style scoped lang="scss">
  .tools-container {
    padding: 20px 0;

    .page-header {
      text-align: center;
      margin-bottom: 40px;

      .title {
        font-size: 28px;
        color: var(--el-text-color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }

      .description {
        color: var(--el-text-color-secondary);
        margin-top: 10px;
      }
    }

    .filter-section {
      display: flex;
      justify-content: center;
      margin-bottom: 30px;

      :deep(.el-radio-button__inner) {
        border-radius: 8px;
        margin: 0 5px;
        border-left: 1px solid var(--el-border-color);
      }
    }

    .tools-grid {
      .el-col {
        margin-bottom: 20px;
      }
    }

    .tool-card {
      position: relative;
      padding: 24px !important;
      height: 100%;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      border: 1px solid transparent;

      &:hover {
        transform: translateY(-5px);
        border-color: var(--el-color-primary-light-5);
        box-shadow: 0 12px 20px rgba(var(--el-color-primary-rgb), 0.1) !important;

        .external-link-icon {
          opacity: 1;
          transform: translate(0, 0);
        }

        .tool-icon {
          background: var(--el-color-primary-light-9);
        }
      }

      .tool-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        background: #f9f9f9;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        transition: background 0.3s;

        img {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }
      }

      .tool-name {
        margin: 0 0 8px 0;
        font-size: 18px;
        color: var(--el-text-color-primary);
      }

      .tool-desc {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        line-height: 1.5;
        margin: 0 0 15px 0;
        // 限制两行文本
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .tool-tag {
        margin-top: auto;
      }

      .external-link-icon {
        position: absolute;
        top: 15px;
        right: 15px;
        font-size: 18px;
        color: var(--el-color-primary);
        opacity: 0;
        transform: translate(-5px, 5px);
        transition: all 0.3s ease;
      }
    }
  }
</style>
