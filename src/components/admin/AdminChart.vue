<template>
  <div class="chart-container">
    <div ref="chartRef" :style="{ height: height, width: '100%' }"></div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted, watch } from "vue";
  import * as echarts from "echarts";

  const props = defineProps({
    options: {
      type: Object,
      required: true,
    },
    height: {
      type: String,
      default: "300px",
    },
  });

  const chartRef = ref(null);
  let chartInstance = null;

  // 初始化图表
  const initChart = () => {
    if (!chartRef.value) return;

    if (chartInstance) {
      chartInstance.dispose();
    }

    chartInstance = echarts.init(chartRef.value);
    chartInstance.setOption(props.options);
  };

  // 监听配置变化（用于动态更新数据）
  watch(
    () => props.options,
    (newOptions) => {
      if (chartInstance) {
        chartInstance.setOption(newOptions);
      }
    },
    { deep: true },
  );

  // 处理窗口缩放
  const handleResize = () => {
    chartInstance?.resize();
  };

  onMounted(() => {
    initChart();
    window.addEventListener("resize", handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
    chartInstance?.dispose();
    chartInstance = null;
  });

  // 暴露方法给父组件
  defineExpose({
    resize: handleResize,
  });
</script>

<style scoped>
  .chart-container {
    width: 100%;
  }
</style>
