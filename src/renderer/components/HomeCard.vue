<script lang="ts" setup>
  import type { Card } from '@common/schemas/card';
  const props = defineProps<{ card: Card }>();

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
    <div v-if="card.media.length" class="flex flex-wrap gap-1.5">
      <button
        v-for="media in card.media"
        class="media-button"
        :class="mediaButtonClass(media.type)"
      ></button>
    </div>
  </div>
</template>
