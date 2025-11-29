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
  <div class="cards-view h-full relative" style="border: 1px solid red">
    <div v-if="!props.page.length" class="text-xl opacity-70 absolute-center">No cards to show</div>
    <div v-else class="overflow-y-auto relative h-full" style="border: 1px solid orchid">
      <div class="absolute top-0 left-0 w-full bottom-0" :style="{ height: '500px' }">
        <div v-for="(card, index) in props.page">
          <div class="card-number">{{ index + anchor + 1 }}</div>
          <HomeCard :card="card" />
        </div>
      </div>
    </div>
  </div>
</template>
