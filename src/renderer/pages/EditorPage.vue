<script lang="ts" setup>
  import RichTextEditor from '@renderer/components/UI/RichTextEditor/RichTextEditor.vue';
  import MediaInput from '@renderer/components/UI/MediaInput.vue';
  import { EventEmitter } from '@common/events/eventEmitter';
  import { Events } from '@renderer/events/events';
  import { EditorPageDTO } from '@common/dto/editorPageDTO';
  import { useUIStore } from '@renderer/store/ui';
  import { computed, ref, reactive, useTemplateRef, nextTick } from 'vue';
  import { Card, getEmptyCard, MediaFile } from '@common/schemas/card';
  import { randomId } from '@common/utils/utils';
  import { Tags } from '@common/schemas/tags';
  import { Sessions } from '@common/schemas/sessions';
  type RTEField = 'front' | 'back' | 'extra';
  EventEmitter.instance.on(Events.loadEditorData, (data: EditorPageDTO) => initData(data));
  const uiStore = useUIStore();
  const card = ref<Card>(null!);
  const allTags = ref<Tags>(null!);
  const allSessions = ref<Sessions>(null!);
  const isNewCard = ref(true);
  const isAllowReversedDisabled = ref(true);
  const showCardFields = reactive({
    front: false,
    back: false,
    extra: false,
  });
  const refs = {
    front: useTemplateRef('front-ref'),
    back: useTemplateRef('back-ref'),
    extra: useTemplateRef('extra-ref'),
    media: useTemplateRef('media-input'),
  };
  function initData(data: EditorPageDTO) {
    const now = Date.now();
    const newId = randomId();
    card.value = data.card || getEmptyCard(newId, now);
    allTags.value = data.tags;
    allSessions.value = data.sessions;
    isNewCard.value = !data.card;
    isAllowReversedDisabled.value = !data.card?.back;
    showCardFields.front = Boolean(data.card?.front);
    showCardFields.back = Boolean(data.card?.back);
    showCardFields.extra = Boolean(data.card?.extra);
  }
  const tagsOptions = computed(() =>
    Object.entries(allTags).map(([key, value]) => ({
      text: `${key} (${value})`,
      value: key,
    }))
  );
  const sessionsOptions = computed(() =>
    Object.values(allSessions).map((value) => ({
      text: `${value.name} (${value.count})`,
      value: value.id,
    }))
  );
  function rteBlur(field: RTEField) {
    const hasContent = Boolean(refs[field].value?.getContent());
    showCardFields[field] = hasContent;
    if (field === 'back') {
      isAllowReversedDisabled.value = !hasContent;
      if (!hasContent) card.value.allowReversed = false;
    }
  }
  function rteClick(field: RTEField) {
    showCardFields[field] = true;
    nextTick(() => {
      refs[field].value?.focus();
    });
  }
  function addMedia(items: MediaFile[]) {
    for (const file of items) {
      if (!file.type.includes('audio') && !file.type.includes('image')) {
        uiStore.showToast('Only images and audio can be added as media!', 'info');
        continue;
      }
      if (card.value.media.some((f) => f.name.trim() === file.name.trim())) {
        uiStore.showToast('Cannot have two media files with the same name!', 'info');
        continue;
      }
      card.value.media.push(file);
    }
  }
  function removeMedia(item: MediaFile) {
    card.value.media = card.value.media.filter((i) => i !== item);
  }
</script>

<template>
  <div class="editor-page flex flex-col gap-1 grow" style="border: 1px solid red">
    <div class="rte-parent">
      <RichTextEditor
        v-show="showCardFields.front"
        :initial="card?.front"
        class="grow"
        @blur="rteBlur('front')"
        ref="front-ref"
      />
      <div
        v-if="!showCardFields.front"
        class="rte-placeholder w-full text-xl font-bold"
        @mousedown.prevent="rteClick('front')"
      >
        <span>FRONT</span>
      </div>
    </div>
    <div class="rte-parent">
      <RichTextEditor
        v-show="showCardFields.back"
        :initial="card?.back"
        class="grow"
        @blur="rteBlur('back')"
        ref="back-ref"
      />
      <div
        v-if="!showCardFields.back"
        class="rte-placeholder w-full text-xl font-bold"
        @mousedown.prevent="rteClick('back')"
      >
        <span>BACK</span>
      </div>
    </div>
    <div class="rte-parent">
      <RichTextEditor
        v-show="showCardFields.extra"
        :initial="card?.extra"
        class="grow"
        @blur="rteBlur('extra')"
        ref="extra-ref"
      />
      <div
        v-if="!showCardFields.extra"
        class="rte-placeholder w-full text-xl font-bold"
        @mousedown.prevent="rteClick('extra')"
      >
        <span>EXTRA</span>
      </div>
    </div>
    <div class="media-parent relative">
      <MediaInput
        ref="media-input"
        class="grow"
        :class="{ 'opacity-0': !card?.media.length }"
        :items="card?.media || []"
        @add="addMedia"
        @remove="removeMedia"
      />
      <span
        v-if="!card?.media.length"
        class="absolute-center cursor-default font-bold opacity-70 text-center"
        @click="refs.media.value?.triggerInput()"
        @dragover.prevent
        @drop="refs.media.value?.drop"
      >
        <div class="text-xl">MEDIA</div>
        <div class>(Click or drop files here)</div>
      </span>
    </div>
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
