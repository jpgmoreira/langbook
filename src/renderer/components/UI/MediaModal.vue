<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import { MediaFile } from '@common/schemas/card';
  const props = defineProps<{
    media?: MediaFile;
  }>();
  const scale = ref(1);
  const style = computed(() => ({
    transform: `translate(-50%, -50%) scale(${scale.value})`,
  }));
  function onWheel(e: WheelEvent) {
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = scale.value * factor;
    scale.value = Math.min(5, Math.max(0.2, newScale));
  }
  watch(
    () => props.media,
    () => {
      scale.value = 1;
    },
    { deep: true }
  );
</script>

<template>
  <div v-if="props.media" class="media-modal-parent" @wheel.prevent="onWheel">
    <div class="media-modal" :style="style">
      <img :src="props.media.path" />
    </div>
  </div>
</template>
