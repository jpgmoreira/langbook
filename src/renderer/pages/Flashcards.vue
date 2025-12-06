<script lang="ts" setup>
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import { EventEmitter } from '@common/events/eventEmitter';
  import { Events } from '@renderer/events/events';
  import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
  import { useMediaStore } from '@renderer/store/media';
  import { Card, MediaFile } from '@common/schemas/card';
  import { Sessions } from '@common/schemas/sessions';
  import { Channels } from '@preload/channels';
  import { useUIStore } from '@renderer/store/ui';
  import MediaModal from '@renderer/components/UI/MediaModal.vue';
  EventEmitter.instance.on(Events.refreshData, (data: RendererResponseDTO) => initData(data));

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
    if (flip.value) return currentCard.value.back;
    return currentCard.value.front;
  });

  const back = computed(() => {
    if (!currentCard.value) return '';
    if (flip.value) return currentCard.value.front;
    return currentCard.value.back;
  });

  const extra = computed(() => {
    if (!currentCard.value) return '';
    return currentCard.value.extra;
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
  }

  async function getNewCard() {
    console.log('- get new card');
    const card = await window.api.invoke<Card | null>(Channels.getNewCard);
    if (!card) return;
    if (!(card.id in cards.value)) {
      cards.value[card.id] = card;
    }
    cardIds.value.push(card.id);
    flipped.value.push(Boolean(card.allowReversed && Math.random() < 0.5));
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

  function windowKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      mediaModalClick();
    }
  }
  onMounted(() => {
    window.addEventListener('keydown', windowKeyDown);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', windowKeyDown);
  });
</script>

<template>
  <div class="flashcards-page h-[100vh] flex flex-col" style="border: 1px solid orchid">
    <MediaModal :media="selectedMedia" @click="mediaModalClick" />
    <div v-if="currentCard" class="grow" style="border: 1px solid red">
      <div class="card sep-parent text-center">
        <div v-html="front"></div>
        <div v-if="reveal" class="sep-parent">
          <div v-if="back" v-html="back"></div>
          <div v-else>No back</div>
          <div v-if="extra" v-html="extra"></div>
          <div v-else>No extra</div>
          <div v-if="media.length" class="flex justify-center">
            <button
              type="button"
              v-for="m in media"
              class="media-button m-1"
              :class="mediaButtonClass(m.type)"
              @click="mediaClick(m)"
              v-tooltip="m.name"
            ></button>
          </div>
          <div v-else>No media</div>
        </div>
      </div>
    </div>
    <div v-else class="grow flex items-center justify-center whitespace-nowrap opacity-70 text-lg">
      No cards to show!
    </div>
    <footer class="flex justify-center gap-10" style="border: 1px solid cyan">
      <button type="button" class="btn-primary" @click="goPrev" :disabled="cantGoPrev">
        Previous
      </button>
      <button type="button" class="btn-primary" @click="goNext" :disabled="cantGoNext">Next</button>
      <button type="button" class="btn-primary" :disabled="!currentCard">Edit</button>
    </footer>
  </div>
</template>
