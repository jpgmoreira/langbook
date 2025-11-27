<script setup lang="ts">
  interface Props {
    selected?: number[];
  }
  const props = defineProps<Props>();
  const minVal = 0;
  const maxVal = 10;
  const values: boolean[] = [];
  const emit = defineEmits<{ (e: 'toggle', value: number): void }>();
  for (let i = minVal; i <= maxVal; i++) {
    if (props.selected?.includes(i)) values[i] = true;
    else values[i] = false;
  }
  function toggle(value: number) {
    emit('toggle', value);
  }
  function valueClass(value: number) {
    if (props.selected?.includes(value)) return 'selected';
    return '';
  }
</script>

<template>
  <div class="frequencymeter">
    <div v-for="i in maxVal - minVal + 1" @click="toggle(i - 1)" :class="valueClass(i - 1)">
      {{ minVal + i - 1 }}
    </div>
  </div>
</template>
