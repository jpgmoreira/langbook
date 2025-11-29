<script lang="ts" setup>
  import type { Card } from '@common/schemas/card';
  const props = defineProps<{ card: Card }>();
</script>

<template>
  <div class="home-card flex flex-col">
    <div>{{ card.front }}</div>
    <div v-if="card.back">{{ card.back }}</div>
    <div v-if="card.extra">{{ card.extra }}</div>
  </div>
</template>
