<script lang="ts" setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import RichTextEditor from '@renderer/components/UI/RichTextEditor/RichTextEditor.vue';

  const lastScroll = ref(0);

  // Fix toolbar toolbox position:
  function onWindowScroll() {
    const now = Date.now();
    if (now - lastScroll.value < 100) return;
    lastScroll.value = now;
    document.querySelectorAll('.toolbar').forEach((toolbar) => {
      const bottom = window.innerHeight - toolbar.getBoundingClientRect().bottom;
      const tolerance = 205;
      if (bottom < tolerance) toolbar.classList.add('sticky');
      else toolbar.classList.remove('sticky');
    });
  }

  onMounted(() => {
    window.addEventListener('scroll', onWindowScroll);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onWindowScroll);
  });
</script>

<template>
  <div>
    <RichTextEditor />
  </div>
</template>
