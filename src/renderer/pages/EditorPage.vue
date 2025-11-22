<script lang="ts" setup>
  import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
  import { useRoute } from 'vue-router';
  import RichTextEditor from '@renderer/components/UI/RichTextEditor/RichTextEditor.vue';

  const route = useRoute();

  const lastScroll = ref(0);
  const inputCard = ref(route.query.card as null);

  const cardFields = reactive({
    front: 'aa',
    back: 'bb',
    extra: 'cc',
  });

  // Fix rte toolbar toolbox position:
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
  <div class="p-1.5 flex flex-col gap-1.5">
    <div class="rte-parent">
      <RichTextEditor v-if="cardFields.front" v-model="cardFields.front" class="grow" />
      <div v-else>AA</div>
    </div>
    <div class="rte-parent">
      <RichTextEditor v-if="cardFields.back" v-model="cardFields.back" class="grow" />
      <div v-else>AA</div>
    </div>
    <div class="rte-parent">
      <RichTextEditor v-if="cardFields.extra" v-model="cardFields.extra" class="grow" />
      <div v-else>AA</div>
    </div>
  </div>
</template>

<style scoped>
  .rte-parent {
    display: flex;
    min-height: 132px;
  }
</style>
