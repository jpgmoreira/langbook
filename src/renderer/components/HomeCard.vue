<script lang="ts" setup>
  import type { Card } from '@common/schemas/card';
  const props = defineProps<{ card: Card }>();
</script>

<template>
  <div style="border: 1px solid orange">
    {{ card.front }}
  </div>
</template>
