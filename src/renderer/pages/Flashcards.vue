<script lang="ts" setup>
  import { ref, reactive, computed, onMounted, onBeforeUnmount, toRaw } from 'vue';
  import { EventEmitter } from '@common/events/eventEmitter';
  import { Events } from '@renderer/events/events';
  import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
  import { useMediaStore } from '@renderer/store/media';
  import { Card, MediaFile } from '@common/schemas/card';
  import { Sessions } from '@common/schemas/sessions';
  import { Channels } from '@preload/channels';
  import { useUIStore } from '@renderer/store/ui';
  import MediaModal from '@renderer/components/UI/MediaModal.vue';
  import Frequencymeter from '@renderer/components/UI/Frequencymeter.vue';
  import { RefreshPlace } from '@common/types/refreshPlace';
  EventEmitter.instance.on(Events.refreshData, (data: RendererResponseDTO) => {
    if (data.where.includes(RefreshPlace.FLASHCARDS_PAGE_INIT)) {
      initData(data);
    } else if (data.where.includes(RefreshPlace.FLASHCARDS_PAGE_UPDATE)) {
      updateData(data);
    }
  });

  const INITIAL_SCALE = 1;
  const INITIAL_PADDING_TOP = 40;

  const mediaStore = useMediaStore();
  const uiStore = useUIStore();

  const sessions = ref<Sessions>();
  const nFiltered = ref(0);
  const cardIds = ref<string[]>([]);
  const cards = ref<Record<string, Card>>({}); // maps id to card.
  const flipped = ref<boolean[]>([]);
  const index = ref(0);
  const reveal = ref(false);
  const selectedMedia = ref<MediaFile | undefined>(undefined);
  const isMoving = ref(false);

  const cardPosition = reactive({
    top: INITIAL_PADDING_TOP,
    left: 0,
    scale: INITIAL_SCALE,
  });

  const cardStyle = computed(() => {
    const { top, left, scale } = cardPosition;
    return {
      transform: `translate(${left}px, ${top}px) scale(${scale})`,
    };
  });

  const currentCard = computed(() => {
    if (index.value >= cardIds.value.length) {
      return null;
    }
    return cards.value[cardIds.value[index.value]];
  });

  const cantGoPrev = computed(() => {
    return index.value === 0 && !reveal.value;
  });

  const cantGoNext = computed(() => {
    if (currentCard.value) return false;
    return true;
  });

  const flip = computed(() => {
    if (index.value >= flipped.value.length) return false;
    return flipped.value[index.value];
  });

  const front = computed(() => {
    if (!currentCard.value) return '';
    let content = currentCard.value.front;
    if (flip.value) content = currentCard.value.back;
    return mediaStore.processRteImages(content);
  });

  const back = computed(() => {
    if (!currentCard.value) return '';
    let content = currentCard.value.back;
    if (flip.value) content = currentCard.value.front;
    return mediaStore.processRteImages(content);
  });

  const extra = computed(() => {
    if (!currentCard.value) return '';
    return mediaStore.processRteImages(currentCard.value.extra);
  });

  const media = computed(() => {
    if (!currentCard.value) return [];
    return currentCard.value.media;
  });

  function initData(data: RendererResponseDTO) {
    sessions.value = data.sessions!;
    nFiltered.value = data.nFiltered!;
    cardIds.value = [];
    cards.value = {};
    flipped.value = [];
    index.value = 0;
    reveal.value = false;
    const card = data.card;
    if (card) {
      cards.value[card.id] = card;
      cardIds.value.push(card.id);
      flipped.value.push(Boolean(card.allowReversed && Math.random() < 0.5));
    }
    resetPosition();
  }

  function updateData(data: RendererResponseDTO) {
    cards.value[data.card!.id] = data.card!;
    nFiltered.value = data.nFiltered!;
  }

  function randomCardId() {
    const keys = Object.keys(cards.value);
    return keys[Math.floor(Math.random() * keys.length)];
  }

  async function getNewCard() {
    const card = await window.api.invoke<Card | null>(Channels.getNewCard);
    if (!card) return;
    if (!(card.id in cards.value)) {
      cards.value[card.id] = card;
    }
    flipped.value.push(Boolean(card.allowReversed && Math.random() < 0.5));
    if (Object.keys(cards.value).length > 1 && card.id === currentCard.value?.id) {
      // Do not show the same card twice in a row.
      let newId = randomCardId();
      while (newId === currentCard.value.id) {
        newId = randomCardId();
      }
      cardIds.value.push(newId);
    } else {
      cardIds.value.push(card.id);
    }
  }

  async function goNext() {
    if (!reveal.value) {
      reveal.value = true;
      return;
    }
    reveal.value = false;
    if (index.value === cardIds.value.length - 1) {
      await getNewCard();
    }
    index.value = Math.min(index.value + 1, cardIds.value.length);
  }

  function goPrev() {
    if (!reveal.value) {
      reveal.value = true;
      index.value = Math.max(0, index.value - 1);
      return;
    }
    reveal.value = false;
  }

  async function mediaClick(media: MediaFile) {
    if (media.type.startsWith('audio')) {
      const mediaPath = mediaStore.resolveMediaPath(media.path);
      const audio = new Audio(mediaPath);
      audio.play();
    } else if (media.type.startsWith('image')) {
      uiStore.backdropVisible = true;
      selectedMedia.value = media;
    }
  }

  function mediaModalClick() {
    selectedMedia.value = undefined;
    uiStore.backdropVisible = false;
  }

  function mediaButtonClass(mime: string) {
    if (mime.startsWith('image')) return 'image';
    if (mime.startsWith('audio')) return 'audio';
    return undefined;
  }

  function resetPosition() {
    cardPosition.top = INITIAL_PADDING_TOP;
    cardPosition.left = 0;
    cardPosition.scale = INITIAL_SCALE;
  }
  function cardWheel(e: WheelEvent) {
    e.preventDefault();
    const minScale = 0.1;
    const maxScale = 1000;
    // finer control when CTRL is pressed
    const factor = e.ctrlKey ? 2500 : 1000;
    // use a relative scale change (so zoom speed is proportional to current scale)
    const delta = -e.deltaY / factor;
    const newScale = Math.max(minScale, Math.min(maxScale, cardPosition.scale * (1 + delta)));
    if (newScale === cardPosition.scale) return;
    const mx = e.clientX;
    const my = e.clientY;
    const oldScale = cardPosition.scale;
    // convert mouse screen coords to element-local coords (assuming transform origin at 0,0)
    const localX = (mx - cardPosition.left) / oldScale;
    const localY = (my - cardPosition.top) / oldScale;
    // keep the same local point under the mouse after scaling
    cardPosition.left = mx - localX * newScale;
    cardPosition.top = my - localY * newScale;
    cardPosition.scale = newScale;
  }

  async function toggleFrequency(value: number) {
    const card = toRaw(currentCard.value);
    if (!card) return;
    if (card.frequency === value) return;
    card.frequency = value;
    card.media = card.media.map((m) => toRaw(m));
    await window.api.invoke(Channels.upsertCard, card);
  }

  function windowKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      mediaModalClick();
      resetPosition();
    }
  }
  function windowMouseDown(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target) return;
    const parent = target.closest('.card-parent');
    if (!parent) return;
    isMoving.value = true;
  }
  function windowMouseUp() {
    isMoving.value = false;
  }

  function windowMouseMove(e: MouseEvent) {
    if (!isMoving.value) return;
    cardPosition.left += e.movementX;
    cardPosition.top += e.movementY;
  }

  onMounted(() => {
    window.addEventListener('keydown', windowKeyDown);
    window.addEventListener('mousedown', windowMouseDown);
    window.addEventListener('mouseup', windowMouseUp);
    window.addEventListener('mousemove', windowMouseMove);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', windowKeyDown);
    window.removeEventListener('mousedown', windowMouseDown);
    window.removeEventListener('mouseup', windowMouseUp);
    window.removeEventListener('mousemove', windowMouseMove);
  });
</script>

<template>
  <div class="flashcards-page h-[100vh] flex flex-col overflow-hidden">
    <MediaModal :media="selectedMedia" @click="mediaModalClick" />
    <div
      v-if="currentCard"
      class="grow relative card-parent"
      :class="isMoving ? 'cursor-grabbing' : 'cursor-grab'"
      @wheel="cardWheel"
      @dragstart.prevent
      @selectstart.prevent
    >
      <div class="card sep-parent absolute w-full" :style="cardStyle">
        <div class="card-field flex justify-center items-center relative">
          <div v-if="reveal" class="absolute left-1 field-hint">
            {{ flip ? 'Back:' : 'Front:' }}
          </div>
          <div v-html="front"></div>
        </div>
        <div v-if="reveal" class="sep-parent">
          <div v-if="back" class="card-field flex justify-center items-center relative">
            <div v-if="reveal" class="absolute left-1 field-hint">
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
              @click="mediaClick(m)"
              v-tooltip="m.name"
            ></button>
          </div>
          <div class="flex flex-col items-center gap-5 p-5">
            <div v-if="currentCard.tags.length" class="flex gap-1 justify-center flex-wrap">
              <div class="tag badge" v-for="tag in currentCard.tags" :key="tag">{{ tag }}</div>
            </div>
            <div class="flex gap-1 justify-center flex-wrap">
              <div class="session badge" v-for="session in currentCard.sessions" :key="session">
                {{ sessions![session].name }}
              </div>
            </div>
            <Frequencymeter :selected="[currentCard.frequency]" @toggle="toggleFrequency" />
          </div>
        </div>
      </div>
      <div class="absolute right-0 bottom-0">Total cards: {{ nFiltered }}</div>
    </div>
    <div v-else class="grow flex items-center justify-center whitespace-nowrap opacity-70 text-lg">
      No cards to show!
    </div>
    <footer class="flex justify-center gap-10 select-none">
      <button type="button" class="btn-primary" @click="goPrev" :disabled="cantGoPrev">
        Previous
      </button>
      <button type="button" class="btn-primary" @click="goNext" :disabled="cantGoNext">Next</button>
      <button type="button" class="btn-primary" :disabled="!currentCard">Edit</button>
    </footer>
  </div>
</template>

<style scoped>
  .card {
    transform-origin: 0 0;
  }
  :deep(.card img) {
    display: inline-block;
  }
  :deep(.card span) {
    color: inherit;
  }
</style>
