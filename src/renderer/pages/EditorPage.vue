<script lang="ts" setup>
  import RichTextEditor from '@renderer/components/UI/RichTextEditor/RichTextEditor.vue';
  import { EventEmitter } from '@common/events/eventEmitter';
  import { Events } from '@renderer/events/events';
  import { EditorPageDTO } from '@common/dto/editorPageDTO';
  import { computed, ref, reactive, useTemplateRef } from 'vue';
  import { Card, getEmptyCard } from '@common/schemas/card';
  import { randomId } from '@common/utils/utils';
  import { Tags } from '@common/schemas/tags';
  import { Sessions } from '@common/schemas/sessions';
  type RTEField = 'front' | 'back' | 'extra';
  EventEmitter.instance.on(Events.loadEditorData, initData);
  const card = ref<Card>();
  const allTags = ref<Tags>();
  const allSessions = ref<Sessions>();
  const isNewCard = ref(true);
  const isAllowReversedDisabled = ref(true);
  const showCardField = reactive({
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
    showCardField.front = Boolean(data.card?.front);
    showCardField.back = Boolean(data.card?.back);
    showCardField.extra = Boolean(data.card?.extra);
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
    showCardField[field] = hasContent;
    if (field === 'back') {
      isAllowReversedDisabled.value = !hasContent;
      if (!hasContent) card.value!.allowReversed = false;
    }
  }
</script>

<template>
  <div class="editor-page flex flex-col gap-1 grow" style="border: 1px solid red">
    <div class="rte-parent">
      <RichTextEditor
        v-show="showCardField.front"
        :initial="card?.front"
        class="grow"
        @blur="rteBlur('front')"
        ref="front-ref"
      />
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
