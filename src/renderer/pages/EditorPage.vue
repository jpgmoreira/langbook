<script lang="ts" setup>
  import { ref, reactive, onMounted, onBeforeUnmount, useTemplateRef, nextTick } from 'vue';
  import { useEditorStore } from '@renderer/store/editorStore';
  import { useUIStore } from '@renderer/store/ui';
  import RichTextEditor from '@renderer/components/UI/RichTextEditor/RichTextEditor.vue';
  import MediaInput, { type FileRecord } from '@renderer/components/UI/MediaInput.vue';
  import { Tags } from '@common/schemas/tags';
  import { Sessions } from '@common/schemas/sessions';

  type RTEField = 'front' | 'back' | 'extra';

  const uiStore = useUIStore();

  const lastScroll = ref(0);

  // initialize from editor store.

  const card = ref({
    front: '',
    back: 'bb',
    extra: 'cc',
    media: [] as FileRecord[],
  });
  const tags: Tags = {
    tag1: 10,
    tag2: 20,
    tag3: 30,
  };
  const sessions: Sessions = {
    s1: {
      id: 's1',
      name: 'Morning Routine',
      count: 3,
      createdAt: 1732250000000,
    },
    s2: {
      id: 's2',
      name: 'Workout',
      count: 1,
      createdAt: 1732253600000,
    },
    s3: {
      id: 's3',
      name: 'Reading Session',
      count: 5,
      createdAt: 1732257200000,
    },
    s4: {
      id: 's4',
      name: 'Learning Vue',
      count: 2,
      createdAt: 1732260800000,
    },
  };

  const refs = {
    front: useTemplateRef('front-ref'),
    back: useTemplateRef('back-ref'),
    extra: useTemplateRef('extra-ref'),
  };

  const mediaInput = useTemplateRef('media-input');

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
    for (const file of items) {
      if (!file.type.includes('audio') && !file.type.includes('image')) {
        uiStore.showToast('Only images and audio can be added as media!', 'info');
        continue;
      }
      if (card.value.media.some((f) => f.name.trim() === file.name.trim())) {
        uiStore.showToast('Cannot have two media files with the same name!', 'error');
        continue;
      }
      card.value.media.push(file);
    }
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
      <div
        v-else
        class="rte-placeholder w-full text-xl font-bold"
        @mousedown.prevent="rteClick('front')"
      >
        <span>FRONT</span>
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
      <div v-else class="rte-placeholder w-full text-xl font-bold" @mousedown="rteClick('back')">
        <span>BACK</span>
      </div>
    </div>
    <div class="rte-parent">
      <RichTextEditor
        v-if="showCardFields.extra"
        :initial="card.extra"
        class="grow"
        @blur="rteBlur('extra')"
        ref="extra-ref"
      />
      <div v-else class="rte-placeholder w-full text-xl font-bold" @mousedown="rteClick('extra')">
        <span>EXTRA</span>
      </div>
    </div>
    <div class="media-parent relative">
      <MediaInput
        ref="media-input"
        class="grow"
        :class="{ 'opacity-0': !card.media.length }"
        :items="card.media"
        @add="addMedia"
        @remove="removeMedia"
      />
      <span
        v-if="!card.media.length"
        class="absolute-center cursor-default font-bold opacity-70 text-center"
        @click="mediaInput?.triggerInput()"
      >
        <div class="text-xl">MEDIA</div>
        <div class>(Click or drop files here)</div>
      </span>
    </div>
    <hr />
  </div>
</template>

<style scoped>
  .rte-parent {
    display: flex;
    min-height: 132px;
  }
  .media-parent {
    display: flex;
    height: 100px;
  }
</style>
