<script lang="ts" setup>
  import { reactive, useTemplateRef, watch, nextTick } from 'vue';
  import Header from '@renderer/components/Header.vue';
  import LineChart, { type LineChartProps } from '@renderer/components/UI/LineChart.vue';
  import { useGraphStore } from '@renderer/store/graph';
  import { randomId } from '@common/utils/utils';
  import { getTodayDate, incrementDate, parseNumericDate } from '@common/utils/dateUtils';
  import { storeToRefs } from 'pinia';
  const store = useGraphStore();
  const { records } = storeToRefs(store);
  const chartRef = useTemplateRef('chart-ref');
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
    const today = getTodayDate();
    const minDate = records.value.length ? records.value[0].date : today;
    let r = 0;
    for (let d = minDate, i = 0; d <= today; d = incrementDate(d), i++) {
      series.x.push(i);
      content.allXValues.push(i);
      content.allXLabels.push(parseNumericDate(d));
      if (r < records.value.length && records.value[r].date === d) {
        const record = records.value[r];
        series.y.push(record.minutesStudied);
        r++;
      } else {
        series.y.push(0);
      }
    }
    content.data.push(series);
    nextTick(() => {
      chartRef.value?.flush();
    });
  }
  watch(
    records,
    () => {
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
