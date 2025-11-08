<script lang="ts" setup>
  import './style/index.css';
  import Toast from './components/ui/Toast.vue';
</script>

<template>
  <Toast />
  <main class="flex flex-col min-h-[100vh]">
    <RouterView />
  </main>
</template>
