<script lang="ts" setup>
  import type { Card, MediaFile } from '@common/schemas/card';
  import HomeCard from './HomeCard.vue';
  import { parseTimestamp } from '@common/utils/dateUtils';
  const props = defineProps<{
    page: Card[];
    anchor: number;
    height: number;
    onMediaClick: (media: MediaFile) => void;
  }>();
</script>

<template>
  <div class="cards-view h-full relative">
    <div v-if="!props.page.length" class="text-xl opacity-70 absolute-center">No cards to show</div>
    <div v-else class="overflow-auto relative h-full">
      <div
        class="absolute top-0 left-0 bottom-0 w-full flex flex-col"
        :style="{ height: '3000px' }"
      >
        <div v-for="(card, index) in props.page" class="w-fit min-w-full">
          <div class="card-number flex justify-between whitespace-nowrap mx-1">
            <span>{{ index + anchor + 1 }}</span>
            <span>{{ parseTimestamp(card.createdAt) }}</span>
          </div>
          <HomeCard :card="card" :on-media-click="onMediaClick" />
        </div>
      </div>
    </div>
  </div>
</template>
