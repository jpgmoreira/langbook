<script lang="ts" setup>
  /**
   * This Backdrop component is independent from the Modals' backdrop.
   */
  import { useUIStore } from '@renderer/store/ui';
  const store = useUIStore();
</script>

<template>
  <Transition name="backdrop-fade">
    <div v-if="store.backdropVisible" class="main-backdrop"></div>
  </Transition>
</template>

<style scoped>
  .backdrop-fade-enter-from,
  .backdrop-fade-leave-to {
    opacity: 0;
  }
  .backdrop-fade-enter-to,
  .backdrop-fade-leave-from {
    opacity: 1;
  }
  .backdrop-fade-enter-active,
  .backdrop-fade-leave-active {
    transition: opacity 0.3s ease;
  }
</style>
