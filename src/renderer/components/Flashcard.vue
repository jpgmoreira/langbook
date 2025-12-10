<script setup lang="ts">
  import { computed, StyleValue } from 'vue';
  import {
    Card,
    CardStatus,
    CardTier,
    MediaFile,
    STATUS_OPTIONS,
    TIER_OPTIONS,
  } from '@common/schemas/card';
  import { useMediaStore } from '@renderer/store/media';
  import { Sessions } from '@common/schemas/sessions';
  import SelectionList from './UI/SelectionList.vue';
  export type FlashcardProps = {
    reveal: boolean;
    card: Card;
    flip: boolean;
    style?: StyleValue;
    sessions: Sessions;
  };
  const emit = defineEmits<{
    (e: 'mediaClick', media: MediaFile): void;
    (e: 'toggleTier', value: CardTier): void;
    (e: 'toggleStatus', value: CardStatus): void;
    (e: 'toggleCore', value: boolean): void;
  }>();
  const mediaStore = useMediaStore();
  const props = defineProps<FlashcardProps>();

  const front = computed(() => {
    if (!props.card) return '';
    let content = props.card.front;
    if (props.flip) content = props.card.back;
    return mediaStore.processRteImages(content);
  });

  const back = computed(() => {
    if (!props.card) return '';
    let content = props.card.back;
    if (props.flip) content = props.card.front;
    return mediaStore.processRteImages(content);
  });

  const extra = computed(() => {
    if (!props.card) return '';
    return mediaStore.processRteImages(props.card.extra);
  });

  const media = computed(() => {
    if (!props.card) return [];
    return props.card.media;
  });

  function mediaButtonClass(mime: string) {
    if (mime.startsWith('image')) return 'image';
    if (mime.startsWith('audio')) return 'audio';
    return undefined;
  }

  function onToggleCore(e: Event) {
    const target = e.target as HTMLInputElement;
    emit('toggleCore', target.checked);
  }
</script>

<template>
  <div
    class="flashcard sep-parent absolute w-full p-2"
    :style="props.style"
    :class="props.card.status"
  >
    <div class="card-field flex justify-center items-center relative">
      <div v-if="props.reveal" class="absolute left-1 field-hint">
        {{ flip ? 'Back:' : 'Front:' }}
      </div>
      <div v-html="front"></div>
    </div>
    <div v-if="props.reveal" class="sep-parent">
      <div v-if="back" class="card-field flex justify-center items-center relative">
        <div v-if="props.reveal" class="absolute left-1 field-hint">
          {{ flip ? 'Front:' : 'Back:' }}
        </div>
        <div v-html="back"></div>
      </div>
      <div v-if="extra" class="card-field flex justify-center items-center relative">
        <div class="absolute left-1 field-hint">Extra:</div>
        <div v-html="extra"></div>
      </div>
      <div v-if="media.length" class="flex justify-center card-field">
        <button
          type="button"
          v-for="m in media"
          class="media-button m-1"
          :class="mediaButtonClass(m.type)"
          @click="emit('mediaClick', m)"
          v-tooltip="m.name"
        ></button>
      </div>
      <div class="flex flex-col items-center gap-5 p-5">
        <div v-if="props.card.tags.length" class="flex gap-1 justify-center flex-wrap">
          <div class="tag badge" v-for="tag in props.card.tags" :key="tag">{{ tag }}</div>
        </div>
        <div class="flex gap-1 justify-center flex-wrap">
          <div class="session badge" v-for="session in props.card.sessions" :key="session">
            {{ props.sessions[session].name }}
          </div>
        </div>
        <div class="flex w-full items-center justify-evenly">
          <div class="flex items-center gap-1">
            <span>Tier:</span>
            <SelectionList
              :options="[...TIER_OPTIONS]"
              :selected="[props.card.tier]"
              @toggle="emit('toggleTier', $event)"
            />
          </div>
          <div class="flex items-center gap-1">
            <span>Status:</span>
            <SelectionList
              :options="[...STATUS_OPTIONS]"
              :selected="[props.card.status]"
              @toggle="emit('toggleStatus', $event)"
            />
          </div>
          <div class="flex items-center select-none gap-1">
            <label for="core-checkbox" class="cursor-pointer">Core:</label>
            <input
              type="checkbox"
              id="core-checkbox"
              name="core-checkbox"
              :checked="props.card.core"
              @change="onToggleCore"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
