<script lang="ts" setup>
  import type { Card, MediaFile } from '@common/schemas/card';
  const props = defineProps<{
    card: Card;
    onMediaClick?: (media: MediaFile) => void;
  }>();
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
</script>

<template>
  <div class="home-card flex flex-col">
    <div v-html="card.front"></div>
    <div v-if="card.back" v-html="card.back"></div>
    <div v-if="card.extra" v-html="card.extra"></div>
    <div v-if="card.media.length" class="flex gap-1.5">
      <button
        v-for="media in card.media"
        class="media-button"
        :class="mediaButtonClass(media.type)"
        @click="mediaClick(media)"
        v-tooltip="media.name"
      ></button>
    </div>
  </div>
</template>
