<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import { EventEmitter } from '@common/events/eventEmitter';
  import { Events } from '@renderer/events/events';
  import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
  import { useMediaStore } from '@renderer/store/media';
  import { Card } from '@common/schemas/card';
  import { Sessions } from '@common/schemas/sessions';
  import { Channels } from '@preload/channels';
  EventEmitter.instance.on(Events.refreshData, (data: RendererResponseDTO) => initData(data));

  const mediaStore = useMediaStore();

  const sessions = ref<Sessions>();
  const nFiltered = ref(0);
  const cardIds = ref<string[]>([]);
  const cards = ref<Record<string, Card>>({}); // maps id to card.
  const index = ref(0);
  const reveal = ref(false);

  const currentCard = computed(() => {
    if (index.value >= cardIds.value.length) {
      return null;
    }
    return cards.value[cardIds.value[index.value]];
  });

  const cantGoPrev = computed(() => {
    return index.value === 0 && !reveal.value;
  });

  function initData(data: RendererResponseDTO) {
    sessions.value = data.sessions!;
    nFiltered.value = data.nFiltered!;
    const card = data.card;
    if (card) {
      cards.value[card.id] = card;
      cardIds.value.push(card.id);
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
</script>

<template>
  <div class="flashcards-page h-[100vh] flex flex-col" style="border: 1px solid orchid">
    <div v-if="currentCard" class="grow flex justify-center" style="border: 1px solid red">
      <div class="card">
        <div v-html="currentCard.front"></div>
        <div v-show="reveal">
          <div v-html="currentCard.back"></div>
          <div v-html="currentCard.extra"></div>
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
      <button type="button" class="btn-primary" @click="goNext" :disabled="!currentCard">
        Next
      </button>
      <button type="button" class="btn-primary">Edit</button>
    </footer>
  </div>
</template>
