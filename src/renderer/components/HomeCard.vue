<script lang="ts" setup>
  import { useTemplateRef } from 'vue';
  import { useMediaStore } from '@renderer/store/media';
  import type { Card, MediaFile } from '@common/schemas/card';
  const store = useMediaStore();
  const cardRef = useTemplateRef('card-ref');
  const props = defineProps<{
    card: Card;
    onMediaClick?: (media: MediaFile) => void;
  }>();
  defineExpose({ getHeight });
  function mediaClick(media: MediaFile) {
    if (props.onMediaClick) {
      props.onMediaClick(media);
    }
  }
  function mediaButtonClass(mime: string) {
    if (mime.startsWith('image')) return 'image';
    if (mime.startsWith('audio')) return 'audio';
    return undefined;
  }
  function getHeight() {
    if (!cardRef.value) return 0;
    return cardRef.value.offsetHeight;
  }
</script>

<template>
  <div class="home-card flex flex-col whitespace-nowrap" ref="card-ref">
    <div v-html="store.processRteImages(card.front)" class="mx-1 field"></div>
    <div v-if="card.back" v-html="store.processRteImages(card.back)" class="mx-1 field"></div>
    <div v-if="card.extra" v-html="store.processRteImages(card.extra)" class="mx-1 field"></div>
    <div v-if="card.media.length" class="flex">
      <button
        type="button"
        v-for="media in card.media"
        class="media-button m-1"
        :class="mediaButtonClass(media.type)"
        @click="mediaClick(media)"
        v-tooltip="media.name"
      ></button>
    </div>
  </div>
</template>

<style scoped>
  :deep(.field img) {
    display: inline-block;
  }
  :deep(.field span) {
    color: inherit;
  }
</style>
