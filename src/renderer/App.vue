<script lang="ts" setup>
  import './style/index.css';
  import Toast from './components/UI/Toast.vue';
  import Backdrop from './components/UI/Backdrop.vue';
</script>

<template>
  <Toast />
  <Backdrop />
  <main class="flex flex-col min-h-[100vh]">
    <RouterView />
  </main>
</template>
