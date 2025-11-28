<script lang="ts" setup>
  import type { Card } from '@common/schemas/card';
  const props = defineProps<{
    page: Card[];
    anchor: number;
    height: number;
  }>();
</script>

<template>
  <div class="cards-info">
    <div>
      <strong>Anchor:</strong>
      {{ props.anchor }}
    </div>
    <div>
      <strong>Total Height:</strong>
      {{ props.height }}
    </div>
    <div class="cards-list">
      <strong>Cards:</strong>
      <div v-for="card in props.page" :key="card.id" class="card-item">
        <div>
          <strong>ID:</strong>
          {{ card.id }}
        </div>
        <div>
          <strong>Front:</strong>
          {{ card.front }}
        </div>
        <div>
          <strong>Back:</strong>
          {{ card.back }}
        </div>
        <div>
          <strong>Height:</strong>
          {{ card.height }}
        </div>
      </div>
    </div>
  </div>
</template>
