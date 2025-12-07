<script lang="ts" setup>
  import { ref, reactive, computed, onMounted, onBeforeUnmount, toRaw } from 'vue';
  import { EventEmitter } from '@common/events/eventEmitter';
  import { Events } from '@renderer/events/events';
  import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
  import { useMediaStore } from '@renderer/store/media';
  import { Card, CardTier, MediaFile, CardStatus } from '@common/schemas/card';
  import { Sessions } from '@common/schemas/sessions';
  import { Channels } from '@preload/channels';
  import { useUIStore } from '@renderer/store/ui';
  import MediaModal from '@renderer/components/UI/MediaModal.vue';
  import { RefreshPlace } from '@common/types/refreshPlace';
  import { GetNewCardResponseDTO } from '@common/dto/getNewCardResponseDTO';
  import FlashCard from '@renderer/components/Flashcard.vue';

  EventEmitter.instance.on(Events.refreshData, (data: RendererResponseDTO) => {
    if (data.where.includes(RefreshPlace.FLASHCARDS_PAGE_INIT)) {
      initData(data);
    } else if (data.where.includes(RefreshPlace.FLASHCARDS_PAGE_UPDATE)) {
      updateData(data);
    } else if (data.where.includes(RefreshPlace.FLASHCARDS_PAGE_CARD_DELETED)) {
      cardDeleted(data);
    }
  });

  const INITIAL_SCALE = 1;
  const INITIAL_PADDING_TOP = 40;

  const mediaStore = useMediaStore();
  const uiStore = useUIStore();

  const sessions = ref<Sessions>({});
  const nFiltered = ref(0);
  const nFilteredReview = ref(0);
  const nFilteredSuspended = ref(0);
  const cardIds = ref<string[]>([]);
  const cards = ref<Record<string, Card>>({}); // maps id to card.
  const flipped = ref<boolean[]>([]);
  const index = ref(0);
  const reveal = ref(false);
  const selectedMedia = ref<MediaFile | undefined>(undefined);
  const isMoving = ref(false);
  const nSeen = ref(0);

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

  const editTooltip = computed(() => {
    const card = currentCard.value;
    if (!card) return undefined;
    if (!card.deleted) return undefined;
    return 'Cannot edit a card that was already deleted.';
  });

  function initData(data: RendererResponseDTO) {
    sessions.value = data.sessions!;
    nFiltered.value = data.nFiltered!;
    nFilteredReview.value = data.nFilteredReview!;
    nFilteredSuspended.value = data.nFilteredSuspended!;
    cardIds.value = [];
    cards.value = {};
    flipped.value = [];
    index.value = 0;
    reveal.value = false;
    nSeen.value = data.card ? 1 : 0;
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
    nFilteredReview.value = data.nFilteredReview!;
    nFilteredSuspended.value = data.nFilteredSuspended!;
    nSeen.value = data.nSeen!;
  }

  function cardDeleted(data: RendererResponseDTO) {
    nFiltered.value = data.nFiltered!;
    nFilteredReview.value = data.nFilteredReview!;
    nFilteredSuspended.value = data.nFilteredSuspended!;
    nSeen.value = data.nSeen!;
    cards.value[data.card!.id].deleted = true;
  }

  async function getNewCard() {
    const { card, nSeen: n } = await window.api.invoke<GetNewCardResponseDTO>(Channels.getNewCard);
    nSeen.value = n;
    if (!card) return;
    if (!(card.id in cards.value)) {
      cards.value[card.id] = card;
    }
    flipped.value.push(Boolean(card.allowReversed && Math.random() < 0.5));
    cardIds.value.push(card.id);
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

  async function toggleStatus(value: CardStatus) {
    const card = toRaw(currentCard.value);
    if (!card) return;
    if (card.status === value) return;
    card.status = value;
    card.media = card.media.map((m) => toRaw(m));
    await window.api.invoke(Channels.upsertCard, card);
  }

  async function toggleTier(value: CardTier) {
    const card = toRaw(currentCard.value);
    if (!card) return;
    if (card.tier === value) return;
    card.tier = value;
    card.media = card.media.map((m) => toRaw(m));
    await window.api.invoke(Channels.upsertCard, card);
  }

  async function toggleCore(value: boolean) {
    const card = toRaw(currentCard.value);
    if (!card) return;
    if (card.core === value) return;
    card.core = value;
    card.media = card.media.map((m) => toRaw(m));
    await window.api.invoke(Channels.upsertCard, card);
  }

  function openEditor() {
    uiStore.backdropVisible = true;
    window.api.invoke(Channels.openEditor, toRaw(currentCard.value));
  }

  function windowKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      mediaModalClick();
      resetPosition();
    }
  }
  function windowMouseDown(e: MouseEvent) {
    if (e.button === 2) {
      resetPosition();
      return;
    }
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
      <FlashCard
        :card="currentCard"
        :flip="flip"
        :reveal="reveal"
        :sessions="sessions"
        :style="cardStyle"
        @toggle-core="toggleCore"
        @toggle-status="toggleStatus"
        @toggle-tier="toggleTier"
        @media-click="mediaClick"
      />
      <div class="stats-bar">
        <span class="stat stat-seen">Seen: {{ nSeen }}</span>
        <span class="stat stat-active">Active: {{ nFiltered - nFilteredSuspended }}</span>
        <span class="stat stat-review">Review: {{ nFilteredReview }}</span>
        <span class="stat stat-suspended">Suspended: {{ nFilteredSuspended }}</span>
        <span class="stat stat-total">Total: {{ nFiltered }}</span>
      </div>
    </div>
    <div v-else class="grow flex items-center justify-center whitespace-nowrap opacity-70 text-lg">
      No cards to show!
    </div>
    <footer class="flex justify-center gap-10 select-none">
      <button type="button" class="btn-primary" @click="goPrev" :disabled="cantGoPrev">
        Previous
      </button>
      <button type="button" class="btn-primary" @click="goNext" :disabled="cantGoNext">Next</button>
      <button
        type="button"
        class="btn-primary"
        :disabled="!currentCard || currentCard.deleted"
        @click="openEditor"
        v-tooltip="editTooltip"
      >
        Edit
      </button>
    </footer>
  </div>
</template>

<style scoped>
  :deep(.flashcard) {
    transform-origin: 0 0;
  }
  :deep(.flashcard img) {
    display: inline-block;
  }
  :deep(.flashcard span) {
    color: inherit;
  }
</style>
