<script lang="ts" setup>
  import { reactive, ref, useTemplateRef, watch } from 'vue';
  import Header from '@renderer/components/Header.vue';
  import LineChart, { type LineChartProps } from '@renderer/components/UI/LineChart.vue';
  import { useGraphStore } from '@renderer/store/graph';
  import { randomId } from '@common/utils/utils';
  import { GraphRecord } from '@common/schemas/graph';
  import { parseNumericDate } from '@common/utils/dateUtils';
  const store = useGraphStore();
  const chartRef = useTemplateRef('chart-ref');
  const records = ref<GraphRecord[]>([]);
  const content = reactive<LineChartProps>({
    allXValues: [],
    allXLabels: [],
    data: [],
  });
  function updateData() {
    const series: LineChartProps['data'][number] = {
      id: randomId(),
      color: '#181818',
      title: 'Minutes studied',
      x: [],
      y: [],
    };
    content.allXValues = [];
    content.allXLabels = [];
    content.data = [];
    for (let i = 0; i < records.value.length; i++) {
      const record = records.value[i];
      series.x.push(i);
      series.y.push(record.minutesStudied);
      content.allXValues.push(i);
      content.allXLabels.push(parseNumericDate(record.date));
    }
    content.data.push(series);
    chartRef.value?.reset();
  }
  watch(
    () => store.records,
    (newVal) => {
      records.value = newVal;
      updateData();
    },
    { deep: true, immediate: true }
  );
</script>

<template>
  <div class="w-[100vw] h-[100vh] flex flex-col">
    <Header />
    <LineChart v-bind="content" ref="chart-ref" />
  </div>
</template>
