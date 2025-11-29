<script lang="ts" setup>
  import type { Card } from '@common/schemas/card';
  import HomeCard from './HomeCard.vue';
  const props = defineProps<{
    page: Card[];
    anchor: number;
    height: number;
  }>();
</script>

<template>
  <div class="cards-view h-full relative">
    <div v-if="!props.page.length" class="text-xl opacity-70 absolute-center">No cards to show</div>
    <div v-else class="overflow-auto relative h-full" style="border: 1px solid orchid">
      <div
        class="absolute top-0 left-0 bottom-0 w-full flex flex-col gap-y-2.5"
        :style="{ height: '3000px' }"
      >
        <div v-for="(card, index) in props.page" class="w-fit min-w-full">
          <div class="card-number">{{ index + anchor + 1 }}</div>
          <HomeCard :card="card" />
        </div>
      </div>
    </div>
  </div>
</template>
