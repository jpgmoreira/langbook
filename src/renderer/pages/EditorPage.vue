<script lang="ts" setup>
  import RichTextEditor from '@renderer/components/UI/RichTextEditor/RichTextEditor.vue';
  import MediaInput from '@renderer/components/UI/MediaInput.vue';
  import { EventEmitter } from '@common/events/eventEmitter';
  import { Events } from '@renderer/events/events';
  import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
  import { useUIStore } from '@renderer/store/ui';
  import { useMediaStore } from '@renderer/store/media';
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
  import Multiselect, { MultiselectOption } from '@renderer/components/UI/Multiselect.vue';
  import { Channels } from '@preload/channels';
  import Frequencymeter from '@renderer/components/UI/Frequencymeter.vue';
  import { RefreshPlace } from '@common/types/refreshPlace';
  import DeleteCardModal from '@renderer/components/UI/DeleteCardModal.vue';
  import HomeCard from '@renderer/components/HomeCard.vue';

  type RTEField = 'front' | 'back' | 'extra';

  EventEmitter.instance.on(Events.refreshData, (data: RendererResponseDTO) => initData(data));

  const uiStore = useUIStore();
  const mediaStore = useMediaStore();

  // -- Dynamic data: ---

  const card = ref<Card>(getEmptyCard(randomId(), Date.now()));
  const allTags = ref<Tags>({});
  const allSessions = ref<Sessions>({});
  const isNewCard = ref(true);
  const isAllowReversedDisabled = ref(true);
  const lastScroll = ref(0);
  const mustCloseAfterModalAnimation = ref(false);
  const showCardFields = reactive({
    front: false,
    back: false,
    extra: false,
  });
  const modalState = reactive({
    card: null as Card | null,
    visible: false,
    isDeleting: false,
  });
  const refs = {
    front: useTemplateRef('front-ref'),
    back: useTemplateRef('back-ref'),
    extra: useTemplateRef('extra-ref'),
    media: useTemplateRef('media-input'),
  };
  const cardRef = useTemplateRef('card-ref');
  const tagsOptions = computed(() => {
    const entries = Object.entries(allTags.value);
    const result: MultiselectOption[] = [];
    for (const [tag, count] of entries) {
      if (tag === 'audio' && !card.value.tags.includes('audio')) {
        // Audio tag cannot be manually added.
        continue;
      }
      const option: MultiselectOption = {
        text: `${tag} (${count})`,
        value: tag,
      };
      if (tag === 'audio') {
        option.class = 'audio non-closeable';
      }
      result.push(option);
    }
    return result;
  });
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
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!data.where.includes(RefreshPlace.EDITOR_PAGE)) return;
    if (!('card' in data && 'tags' in data && 'sessions' in data)) return;
    lastScroll.value = 0;
    card.value = data.card || getEmptyCard(randomId(), Date.now());
    if (data.card === null) {
      const latestSession = getLatestSession(data.sessions as Sessions);
      if (latestSession) {
        card.value.sessions.push(latestSession.id);
      }
    }
    allTags.value = data.tags as Tags;
    allSessions.value = data.sessions as Sessions;
    isNewCard.value = !data.card;
    isAllowReversedDisabled.value = !data.card?.back;
    showCardFields.front = Boolean(data.card?.front);
    showCardFields.back = Boolean(data.card?.back);
    showCardFields.extra = Boolean(data.card?.extra);
    refs.front.value?.refresh();
    refs.back.value?.refresh();
    refs.extra.value?.refresh();
  }

  function getLatestSession(sessions: Sessions) {
    const sessionsList = Object.values(sessions);
    if (sessionsList.length === 0) return null;
    let result = sessionsList[0];
    for (const session of sessionsList) {
      if (session.createdAt > result.createdAt) {
        result = session;
      }
    }
    return result;
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
      if (file.type.includes('audio')) {
        const tag = 'audio';
        if (!(tag in allTags.value)) {
          allTags.value[tag] = 0;
        }
        if (!card.value.tags.includes(tag)) {
          card.value.tags.push(tag);
        }
      }
      card.value.media.push(file);
    }
  }

  function removeMedia(item: MediaFile) {
    card.value.media = card.value.media.filter((i) => i !== item);
    if (card.value.media.filter((m) => m.type.includes('audio')).length === 0) {
      card.value.tags = card.value.tags.filter((t) => t !== 'audio');
    }
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
    if (tag === 'audio') return;
    arrayRemove(card.value.tags, tag);
    if (allTags.value[tag] === 0) {
      delete allTags.value[tag];
    }
  }

  function manuallyCreateTag(name: string) {
    if (name === 'audio') {
      uiStore.showToast('Cannot manually create the "audio" tag!', 'info');
      return;
    }
    if (name in allTags.value) return;
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
    nextTick(async () => {
      if (!cardRef.value) return;
      const height = cardRef.value.getHeight();
      card.value.height = height;
      await window.api.invoke(Channels.upsertCard, toRaw(card.value));
    });
  }

  function openModal() {
    if (isNewCard.value) return;
    modalState.card = card.value;
    modalState.visible = true;
  }

  function closeModal() {
    modalState.card = null;
    modalState.visible = false;
  }

  function modalAnimationFinished() {
    if (mustCloseAfterModalAnimation.value) {
      mustCloseAfterModalAnimation.value = false;
      window.api.send(Channels.closeEditor);
    }
  }

  async function deleteCard() {
    card.value.media = card.value.media.map((m) => toRaw(m));
    modalState.isDeleting = true;
    await window.api.invoke<RendererResponseDTO>(Channels.deleteCard, toRaw(card.value));
    modalState.isDeleting = false;
    mustCloseAfterModalAnimation.value = true;
    closeModal();
  }

  function cancel() {
    window.api.send(Channels.closeEditor);
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
    <HomeCard :card="card" ref="card-ref" class="dummy-card" />
    <DeleteCardModal
      v-bind="modalState"
      @close="closeModal"
      @delete="deleteCard"
      @animation-finished="modalAnimationFinished"
    />
    <div class="rte-parent">
      <RichTextEditor
        v-show="showCardFields.front"
        :initial="mediaStore.processRteImages(card.front)"
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
        :initial="mediaStore.processRteImages(card.back)"
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
        :initial="mediaStore.processRteImages(card.extra)"
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
      @create-option="manuallyCreateTag"
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
      <template v-else>
        <button
          type="button"
          class="btn-primary"
          @click="addOrSaveClick"
          :disabled="mustCloseAfterModalAnimation"
        >
          Save
        </button>
        <button
          type="button"
          class="btn-danger"
          @click="openModal"
          :disabled="mustCloseAfterModalAnimation"
        >
          Delete
        </button>
      </template>
      <button
        type="button"
        class="btn-warning"
        @click="cancel"
        :disabled="mustCloseAfterModalAnimation"
      >
        Cancel
      </button>
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
  .dummy-card {
    visibility: hidden;
    position: absolute;
    left: -9999px;
    top: -9999px;
  }
</style>
