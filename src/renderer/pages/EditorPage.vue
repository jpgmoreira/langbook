<script lang="ts" setup>
  import { ref, reactive, onMounted, onBeforeUnmount, useTemplateRef, nextTick, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import RichTextEditor from '@renderer/components/UI/RichTextEditor/RichTextEditor.vue';
  import MediaInput, { type FileRecord } from '@renderer/components/UI/MediaInput.vue';

  type RTEField = 'front' | 'back' | 'extra';

  const route = useRoute();

  const lastScroll = ref(0);
  //const inputCard = ref(route.query.card as null);
  const card = ref({
    front: '',
    back: 'bb',
    extra: 'cc',
    media: [] as FileRecord[],
  });

  const refs = {
    front: useTemplateRef('front-ref'),
    back: useTemplateRef('back-ref'),
    extra: useTemplateRef('extra-ref'),
  };

  const showCardFields = reactive({
    front: Boolean(card.value.front),
    back: Boolean(card.value.back),
    extra: Boolean(card.value.extra),
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

  function rteClick(field: RTEField) {
    showCardFields[field] = true;
    nextTick(() => {
      refs[field].value?.focus();
    });
  }

  function rteBlur(field: RTEField) {
    const content = refs[field].value?.getContent();
    showCardFields[field] = Boolean(content);
  }

  function addMedia(items: FileRecord[]) {
    card.value.media.push(...items);
  }

  function removeMedia(item: FileRecord) {
    card.value.media = card.value.media.filter((i) => i !== item);
  }

  onMounted(() => {
    window.addEventListener('scroll', onWindowScroll);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onWindowScroll);
  });
</script>

<template>
  <div class="editor-page p-1 flex flex-col gap-1">
    <div class="rte-parent">
      <RichTextEditor
        v-if="showCardFields.front"
        :initial="card.front"
        class="grow"
        @blur="rteBlur('front')"
        ref="front-ref"
      />
      <div v-else class="rte-placeholder w-full text-lg" @mousedown.prevent="rteClick('front')">
        FRONT
      </div>
    </div>
    <div class="rte-parent">
      <RichTextEditor
        v-if="showCardFields.back"
        :initial="card.back"
        class="grow"
        @blur="rteBlur('back')"
        ref="back-ref"
      />
      <div v-else class="rte-placeholder w-full text-lg" @mousedown="rteClick('back')">BACK</div>
    </div>
    <div class="rte-parent">
      <RichTextEditor
        v-if="showCardFields.extra"
        :initial="card.extra"
        class="grow"
        @blur="rteBlur('extra')"
        ref="extra-ref"
      />
      <div v-else class="rte-placeholder w-full text-lg" @mousedown="rteClick('extra')">EXTRA</div>
    </div>
    <div class="rte-parent">
      <MediaInput class="grow" :items="card.media" @add="addMedia" @remove="removeMedia" />
    </div>
  </div>
</template>

<style scoped>
  .rte-parent {
    display: flex;
    min-height: 132px;
  }
</style>
