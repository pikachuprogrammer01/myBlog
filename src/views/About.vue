<template>
  <div class="about-container">
    <div class="blog-card profile-header-card">
      <div class="header-content">
        <div class="info">
          <h1 class="name">吴澍</h1>
          <p class="role">2026届毕业生 / 追求卓越的前端开发应届生</p>
          <div class="social-links">
            <el-tooltip content="查看我的 GitHub 项目" placement="top">
              <el-button
                circle
                :icon="Platform"
                @click="openLink('https://github.com/pikachuprogrammer01')"
              />
            </el-tooltip>
            <el-tooltip content="发送邮件联系我" placement="top">
              <el-button circle :icon="Message" @click="clickEmal" />
            </el-tooltip>
            <el-tag type="success" effect="dark" round class="ml-10"
              >毕业设计项目</el-tag
            >
          </div>
        </div>
      </div>
    </div>

    <el-row :gutter="20" class="mt-20">
      <el-col :md="16" :sm="24">
        <div class="blog-card intro-card">
          <h3 class="section-title">
            <el-icon><User /></el-icon> 自我评价
          </h3>
          <p class="bio-text">
            作为一名即将在 2026
            年毕业的专科生，我深知技术实操的重要性。本项目<strong
              >《基于 Vue 3 的个人博客系统》</strong
            >是我的毕业设计作品，旨在通过工程化手段解决内容管理与展示需求。
            我性格踏实，具备较强的自学能力，在校期间通过网课与文档自学了 Vue
            全家桶、Node.js 等前端主流技术。
          </p>

          <h3 class="section-title mt-30">
            <el-icon><Setting /></el-icon> 技能栈 (由深至浅)
          </h3>
          <div class="skills-grid">
            <div v-for="skill in skills" :key="skill.name" class="skill-item">
              <div class="skill-info">
                <span>{{ skill.name }}</span>
                <el-tag size="small" :type="getSkillType(skill.percentage)">{{
                  getSkillLevel(skill.percentage)
                }}</el-tag>
              </div>
              <el-progress
                :percentage="skill.percentage"
                :color="skill.color"
                :stroke-width="12"
                striped
                striped-flow
                :show-text="false"
              />
            </div>
          </div>
        </div>
      </el-col>

      <el-col :md="8" :sm="24">
        <div class="blog-card timeline-card">
          <h3 class="section-title">
            <el-icon><Timer /></el-icon> 成长足迹
          </h3>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in timeline"
              :key="index"
              :timestamp="activity.timestamp"
              :type="activity.type"
              :hollow="true"
              :size="index === 0 ? 'large' : 'normal'"
            >
              <h4 class="timeline-content-title">{{ activity.title }}</h4>
              <p class="timeline-content-body">{{ activity.content }}</p>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
  import { ref } from "vue";
  import { useRouter } from "vue-router";
  import {
    User,
    Setting,
    Timer,
    Platform,
    Message,
  } from "@element-plus/icons-vue";

  const skills = ref([
    { name: "Java / Spring Boot", percentage: 80, color: "#e76f00" },
    { name: "MySQL / MyBatis-Plus", percentage: 75, color: "#00758f" },
    { name: "Redis 缓存控制", percentage: 60, color: "#d82c20" },
    { name: "RESTful API 设计", percentage: 88, color: "#409eff" },
    { name: "Vue 3 & Composition API", percentage: 85, color: "#42b883" },
    { name: "Element Plus UI 组件库", percentage: 90, color: "#409eff" },
    { name: "HTML5 / CSS3 / SCSS", percentage: 80, color: "#264de4" },
    { name: "ES6+ & TypeScript", percentage: 70, color: "#f7df1e" },
    { name: "Node.js & Express", percentage: 60, color: "#68a063" },
    { name: "Git 版本控制 / Webpack", percentage: 75, color: "#f05032" },
  ]);

  // 技能等级文案辅助函数
  const getSkillLevel = (p) => {
    if (p >= 85) return "精通/熟练";
    if (p >= 70) return "掌握";
    return "熟悉";
  };
  const getSkillType = (p) => {
    if (p >= 85) return "success";
    if (p >= 70) return "primary";
    return "info";
  };

  // 时间线优化
  const timeline = ref([
    {
      title: "毕业设计系统开发",
      content: "完成博客系统前后端联调及演示，准备答辩。",
      timestamp: "2026-03 至 2026-06",
      type: "primary",
    },
    {
      title: "校外实习/项目实战",
      content: "参与真实项目开发，提升团队协作与代码质量。",
      timestamp: "2025-07 至 2026-02",
      type: "success",
    },
    {
      title: "深入进阶 Vue 3",
      content: "从 Vue 2 转向 Vue 3，学习 Vite 与 Pinia 等新生态。",
      timestamp: "2024-09",
      type: "warning",
    },
    {
      title: "入校与技术启蒙",
      content: "接触计算机基础，开启 Web 编程之路。",
      timestamp: "2023-09",
      type: "info",
    },
  ]);

  const router = useRouter();

  const openLink = (url) => {
    window.open(url, "_blank");
  };

  const clickEmal = () => {
    router.push("/contact");
  };
</script>

<style scoped lang="scss">
  .about-container {
    padding: 20px 0;
    .ml-10 {
      margin-left: 10px;
    }
    .mt-20 {
      margin-top: 20px;
    }
    .mt-30 {
      margin-top: 30px;
    }

    .profile-header-card {
      padding: 40px !important;
      background: linear-gradient(
        135deg,
        var(--el-color-primary-light-9) 0%,
        #ffffff 100%
      );
      border: none;

      .header-content {
        display: flex;
        align-items: center;
        gap: 30px;

        @media (max-width: 768px) {
          flex-direction: column;
          text-align: center;
        }
      }

      .name {
        font-size: 32px;
        margin: 0;
        color: var(--el-text-color-primary);
      }

      .role {
        color: var(--el-text-color-secondary);
        font-size: 18px;
        margin: 10px 0 20px;
      }

      .avatar-hover {
        border: 4px solid #fff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s ease;
        &:hover {
          transform: scale(1.05);
        }
      }
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      margin-bottom: 20px;
      color: var(--el-color-primary);
      border-bottom: 2px solid var(--el-color-primary-light-8);
      padding-bottom: 8px;
    }

    .bio-text {
      line-height: 1.8;
      color: var(--el-text-color-regular);
      font-size: 15px;
    }

    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;

      .skill-item {
        .skill-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: bold;
        }
      }
    }

    .timeline-card {
      height: 100%;
    }
  }
</style>
