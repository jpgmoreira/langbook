<script lang="ts" setup>
  import {
    ref,
    reactive,
    onMounted,
    onBeforeUnmount,
    useTemplateRef,
    nextTick,
    computed,
    watch,
  } from 'vue';
  import { useEditorStore } from '@renderer/store/editor';
  import { useUIStore } from '@renderer/store/ui';
  import { getEmptyCard, MediaFile, type Card } from '@common/schemas/card';
  import RichTextEditor from '@renderer/components/UI/RichTextEditor/RichTextEditor.vue';
  import MediaInput from '@renderer/components/UI/MediaInput.vue';
  import Multiselect from '@renderer/components/UI/Multiselect.vue';
  import { arrayRemove, randomId } from '@common/utils/utils';
  import { Channels } from '@preload/channels';

  type RTEField = 'front' | 'back' | 'extra';

  const uiStore = useUIStore();
  const editorStore = useEditorStore();

  watch(
    () => editorStore.data,
    (newData, oldData) => {
      console.log('Editor data mudou!', newData, oldData);
    },
    { deep: true }
  );

  // --- Dynamic data: ---

  const now = Date.now();

  const lastScroll = ref(0);
  const isNewCard = ref(!editorStore.data.card);

  let card: Card;
  if (isNewCard) {
    const newCardId = randomId();
    card = reactive(getEmptyCard(newCardId, now));
  } else {
    card = reactive(editorStore.data.card as Card);
  }

  const disableAllowReversed = ref(!Boolean(card.back));

  const tags = reactive(editorStore.data.tags);
  const sessions = reactive(editorStore.data.sessions);

  const tagsOptions = computed(() =>
    Object.entries(tags).map(([key, value]) => ({
      text: `${key} (${value})`,
      value: key,
    }))
  );

  const sessionsOptions = computed(() =>
    Object.values(sessions).map((value) => ({
      text: `${value.name} (${value.count})`,
      value: value.id,
    }))
  );

  const showCardFields = reactive({
    front: Boolean(card.front),
    back: Boolean(card.back),
    extra: Boolean(card.extra),
  });

  // --- Static data: ---

  const refs = {
    front: useTemplateRef('front-ref'),
    back: useTemplateRef('back-ref'),
    extra: useTemplateRef('extra-ref'),
    media: useTemplateRef('media-input'),
  };

  // --- Editor events: ---

  function rteClick(field: RTEField) {
    showCardFields[field] = true;
    nextTick(() => {
      refs[field].value?.focus();
    });
  }

  function rteBlur(field: RTEField) {
    const hasContent = Boolean(refs[field].value?.getContent());
    showCardFields[field] = hasContent;
    if (field === 'back') {
      disableAllowReversed.value = !hasContent;
      if (!hasContent) card.allowReversed = false;
    }
  }

  // --- Media: ---

  function addMedia(items: MediaFile[]) {
    for (const file of items) {
      if (!file.type.includes('audio') && !file.type.includes('image')) {
        uiStore.showToast('Only images and audio can be added as media!', 'info');
        continue;
      }
      if (card.media.some((f) => f.name.trim() === file.name.trim())) {
        uiStore.showToast('Cannot have two media files with the same name!', 'info');
        continue;
      }
      card.media.push(file);
    }
  }

  function removeMedia(item: MediaFile) {
    card.media = card.media.filter((i) => i !== item);
  }

  // --- Manage sessions: ---

  function selectSession(sessionId: string) {
    card.sessions.push(sessionId);
  }

  function deselectSession(sessionId: string) {
    arrayRemove(card.sessions, sessionId);
  }

  // --- Manage tags: ---

  function selectTag(tag: string) {
    card.tags.push(tag);
  }

  function deselectTag(tag: string) {
    arrayRemove(card.tags, tag);
    if (tags[tag] === 0) {
      delete tags[tag];
    }
  }

  function createTag(name: string) {
    tags[name] = 0;
    card.tags.push(name);
  }

  // --- Actions: ---

  function addCardClick() {
    const front = refs.front.value?.getContent();
    if (!front) {
      uiStore.showToast('A card must at least have a front field!', 'info');
      return;
    }
    card.front = front;
    card.back = refs.back.value?.getContent() || '';
    card.extra = refs.extra.value?.getContent() || '';
    console.log(card);
  }

  function cancel() {
    window.api.send(Channels.cancelCardEdit);
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
  <div class="editor-page p-1 flex flex-col gap-1 grow">
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
      >
        <span>EXTRA</span>
      </div>
    </div>
    <div class="media-parent relative">
      <MediaInput
        ref="media-input"
        class="grow"
        :items="card.media"
        @add="addMedia"
        @remove="removeMedia"
      />
      <span
        v-if="!card.media.length"
        class="absolute-center cursor-default font-bold opacity-70 text-center"
        @click="refs.media.value?.triggerInput()"
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
    <footer class="flex justify-around mt-auto">
      <div class="flex items-center tooltip-base">
        <div class="tooltip" v-if="disableAllowReversed">
          Allow reversed is only available
          <br />
          when the "back" field has content
        </div>
        <label class="whitespace-nowrap mr-1" for="allow-reversed">Allow reversed</label>
        <input
          type="checkbox"
          id="allow-reversed"
          name="allow-reversed"
          :disabled="disableAllowReversed"
          v-model="card.allowReversed"
        />
      </div>
      <button v-if="isNewCard" type="button" class="btn-primary" @click="addCardClick">Add</button>
      <button v-else type="button" class="btn-primary">Save</button>
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
