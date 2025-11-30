<script lang="ts" setup>
  import RichTextEditor from '@renderer/components/UI/RichTextEditor/RichTextEditor.vue';
  import MediaInput from '@renderer/components/UI/MediaInput.vue';
  import { EventEmitter } from '@common/events/eventEmitter';
  import { Events } from '@renderer/events/events';
  import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
  import { useUIStore } from '@renderer/store/ui';
  import {
    computed,
    ref,
    reactive,
    useTemplateRef,
    nextTick,
    onMounted,
    onBeforeUnmount,
    toRaw,
  } from 'vue';
  import { Card, getEmptyCard, MediaFile } from '@common/schemas/card';
  import { arrayRemove, randomId } from '@common/utils/utils';
  import { Tags } from '@common/schemas/tags';
  import { Sessions } from '@common/schemas/sessions';
  import Multiselect from '@renderer/components/UI/Multiselect.vue';
  import { Channels } from '@preload/channels';
  import Frequencymeter from '@renderer/components/UI/Frequencymeter.vue';
  import { RefreshPlace } from '@common/types/refreshPlace';

  type RTEField = 'front' | 'back' | 'extra';

  EventEmitter.instance.on(Events.refreshData, (data: RendererResponseDTO) => initData(data));

  const uiStore = useUIStore();

  // -- Dynamic data: ---

  const card = ref<Card>(getEmptyCard(randomId(), Date.now()));
  const allTags = ref<Tags>({});
  const allSessions = ref<Sessions>({});
  const isNewCard = ref(true);
  const isAllowReversedDisabled = ref(true);
  const lastScroll = ref(0);
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
  const tagsOptions = computed(() =>
    Object.entries(allTags.value).map(([key, value]) => ({
      text: `${key} (${value})`,
      value: key,
    }))
  );
  const sessionsOptions = computed(() =>
    Object.values(allSessions.value).map((value) => ({
      text: `${value.name} (${value.count})`,
      value: value.id,
    }))
  );
  const allowReversedTooltip = computed(() => {
    if (isAllowReversedDisabled.value)
      return 'Allow reversed is only available when the back field has content';
    return undefined;
  });
  const selectedFrequency = computed(() => [card.value.frequency]);

  // --- Initialization: ---

  function initData(data: RendererResponseDTO) {
    if (!data.where.includes(RefreshPlace.EDITOR_PAGE)) return;
    lastScroll.value = 0;
    card.value = (data.card as Card) || null;
    allTags.value = data.tags || {};
    allSessions.value = data.sessions || {};
    isNewCard.value = !data.card;
    isAllowReversedDisabled.value = !data.card?.back;
    showCardFields.front = Boolean(data.card?.front);
    showCardFields.back = Boolean(data.card?.back);
    showCardFields.extra = Boolean(data.card?.extra);
    refs.front.value?.refresh();
    refs.back.value?.refresh();
    refs.extra.value?.refresh();
  }

  // --- RTE: ---

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

  function rteDrop(field: RTEField, event: DragEvent) {
    const rte = refs[field]?.value;
    if (!rte) return;
    rte.drop(event);
    rteClick(field);
  }

  // --- Media: ---

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
  // --- Manage sessions: ---

  function selectSession(sessionId: string) {
    card.value.sessions.push(sessionId);
  }

  function deselectSession(sessionId: string) {
    arrayRemove(card.value.sessions, sessionId);
  }

  // --- Manage tags: ---

  function selectTag(tag: string) {
    card.value.tags.push(tag);
  }

  function deselectTag(tag: string) {
    arrayRemove(card.value.tags, tag);
    if (allTags.value[tag] === 0) {
      delete allTags.value[tag];
    }
  }

  function createTag(name: string) {
    allTags.value[name] = 0;
    card.value.tags.push(name);
  }

  // --- Actions: ---

  async function addOrSaveClick() {
    const front = refs.front.value?.getContent();
    if (!front) {
      uiStore.showToast('A card must at least have a front field!', 'info');
      return;
    }
    if (!card.value.sessions.length) {
      uiStore.showToast('A card must be on at least one session!', 'info');
      return;
    }
    card.value.front = front;
    card.value.back = refs.back.value?.getContent() || '';
    card.value.extra = refs.extra.value?.getContent() || '';
    card.value.media = card.value.media.map((m) => toRaw(m));
    await window.api.invoke(Channels.upsertCard, toRaw(card.value));
  }

  function cancel() {
    window.api.send(Channels.cancelCardEdit);
  }

  function setFrequency(value: number) {
    card.value.frequency = value;
  }

  // --- Lifecycle hooks: ---

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
  <div class="editor-page flex flex-col gap-1 grow p-1">
    <div class="rte-parent">
      <RichTextEditor
        v-show="showCardFields.front"
        :initial="card.front"
        class="grow"
        @blur="rteBlur('front')"
        ref="front-ref"
      />
      <div
        v-if="!showCardFields.front"
        class="rte-placeholder w-full text-xl font-bold"
        @mousedown.prevent="rteClick('front')"
        @dragover.prevent
        @drop="rteDrop('front', $event)"
      >
        <span>FRONT</span>
      </div>
    </div>
    <div class="rte-parent">
      <RichTextEditor
        v-show="showCardFields.back"
        :initial="card.back"
        class="grow"
        @blur="rteBlur('back')"
        ref="back-ref"
      />
      <div
        v-if="!showCardFields.back"
        class="rte-placeholder w-full text-xl font-bold"
        @mousedown.prevent="rteClick('back')"
        @dragover.prevent
        @drop="rteDrop('back', $event)"
      >
        <span>BACK</span>
      </div>
    </div>
    <div class="rte-parent">
      <RichTextEditor
        v-show="showCardFields.extra"
        :initial="card.extra"
        class="grow"
        @blur="rteBlur('extra')"
        ref="extra-ref"
      />
      <div
        v-if="!showCardFields.extra"
        class="rte-placeholder w-full text-xl font-bold"
        @mousedown.prevent="rteClick('extra')"
        @dragover.prevent
        @drop="rteDrop('extra', $event)"
      >
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
        @click="refs.media.value?.triggerInput()"
        @dragover.prevent
        @drop="refs.media.value?.drop"
      >
        <div class="text-xl">MEDIA</div>
        <div class>(Click or drop files here)</div>
      </span>
    </div>
    <hr />
    <Multiselect
      :options="tagsOptions"
      :selected="card.tags"
      placeholder="Tags"
      direction="up"
      create
      close
      @select-option="selectTag"
      @deselect-option="deselectTag"
      @create-option="createTag"
    />
    <Multiselect
      :options="sessionsOptions"
      :selected="card.sessions"
      placeholder="Sessions"
      direction="up"
      close
      @select-option="selectSession"
      @deselect-option="deselectSession"
    />
    <div>
      Frequency:
      <Frequencymeter :selected="selectedFrequency" @toggle="setFrequency" />
    </div>
    <footer class="flex justify-around mt-auto">
      <div class="flex items-center" v-tooltip="allowReversedTooltip">
        <label class="whitespace-nowrap mr-1" for="allow-reversed">Allow reversed</label>
        <input
          type="checkbox"
          id="allow-reversed"
          name="allow-reversed"
          :disabled="isAllowReversedDisabled"
          v-model="card.allowReversed"
        />
      </div>
      <button v-if="isNewCard" type="button" class="btn-primary" @click="addOrSaveClick">
        Add
      </button>
      <button v-else type="button" class="btn-primary" @click="addOrSaveClick">Save</button>
      <button type="button" class="btn-warning" @click="cancel">Cancel</button>
    </footer>
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
