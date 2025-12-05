<script lang="ts" setup>
  import {
    ref,
    reactive,
    computed,
    useTemplateRef,
    onMounted,
    onBeforeUnmount,
    toRaw,
    watch,
  } from 'vue';
  import type { Card, MediaFile } from '@common/schemas/card';
  import HomeCard from './HomeCard.vue';
  import DeleteCardModal from './UI/DeleteCardModal.vue';
  import { parseTimestamp } from '@common/utils/dateUtils';
  import { Channels } from '@preload/channels';
  import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
  const props = defineProps<{
    page: Card[];
    height: number;
    nFiltered: number;
    onMediaClick: (media: MediaFile) => void;
    openEditor: (card: Card | null) => void;
  }>();
  const bottomPadding = 300; //px.
  const scrollTimer = ref<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scrollTop = ref(0);
  const isRequesting = ref(false);
  const contextMenu = reactive({
    visible: false,
    x: 0,
    y: 0,
    card: null as Card | null,
  });
  const modalState = reactive({
    card: null as Card | null,
    visible: false,
    isDeleting: false,
  });
  const pageStyle = reactive({
    transform: `translateY(${props.page.length ? props.page[0].scrollTop! : 0}px)`,
  });
  const contextStyle = computed(() => ({
    left: `${contextMenu.x}px`,
    top: `${contextMenu.y}px`,
  }));
  const ghostStyle = computed(() => ({
    height: `${props.height + props.nFiltered * 40 + bottomPadding}px`,
  }));
  const rootRef = useTemplateRef('root');
  const scrollContainerRef = useTemplateRef('scroll-container');
  let observer: ResizeObserver | null = null;
  watch(
    () => props.page,
    () => {
      pageStyle.transform = `translateY(${props.page.length ? props.page[0].scrollTop! : 0}px)`;
    }
  );
  function showContextMenu(e: MouseEvent, card: Card) {
    const distanceToRight = window.innerWidth - e.clientX;
    const MENU_WIDTH = 100;
    if (distanceToRight < MENU_WIDTH) {
      contextMenu.x = window.innerWidth - distanceToRight - MENU_WIDTH;
    } else {
      contextMenu.x = e.clientX;
    }
    contextMenu.y = e.clientY;
    contextMenu.card = card;
    contextMenu.visible = true;
  }
  function hideContextMenu() {
    contextMenu.visible = false;
  }
  function handleScroll() {
    hideContextMenu();
    clearTimeout(scrollTimer.value);
    scrollTimer.value = setTimeout(async () => {
      if (!scrollContainerRef.value) return;
      if (isRequesting.value) return;
      scrollTop.value = scrollContainerRef.value.scrollTop;
      isRequesting.value = true;
      await window.api.invoke(Channels.getPage, scrollTop.value);
      isRequesting.value = false;
    }, 30);
  }
  function closeModal() {
    modalState.card = null;
    modalState.visible = false;
  }
  function openModal(card: Card | null) {
    if (!card) return;
    modalState.card = card;
    modalState.visible = true;
  }
  async function deleteCard() {
    const card = contextMenu.card;
    if (!card) return;
    card.media = card.media.map((m) => toRaw(m));
    modalState.isDeleting = true;
    await window.api.invoke<RendererResponseDTO>(Channels.deleteCard, toRaw(card));
    modalState.isDeleting = false;
    closeModal();
  }
  onMounted(() => {
    observer = new ResizeObserver(hideContextMenu);
    if (rootRef.value) observer.observe(rootRef.value);
  });
  onBeforeUnmount(() => {
    observer?.disconnect();
  });
</script>

<template>
  <div class="cards-view h-full relative" @click="hideContextMenu" ref="root">
    <DeleteCardModal v-bind="modalState" @close="closeModal" @delete="deleteCard" />
    <div v-if="!props.page.length" class="text-xl opacity-70 absolute-center whitespace-nowrap">
      No cards to show
    </div>
    <div v-else class="overflow-auto relative h-full" @scroll="handleScroll" ref="scroll-container">
      <div class="context-menu fixed" v-if="contextMenu.visible" :style="contextStyle">
        <div class="option px-2 py-0.5" @click="openEditor(contextMenu.card)">Edit</div>
        <div class="option text-danger px-2 py-0.5" @click="openModal(contextMenu.card)">
          Delete
        </div>
      </div>
      <div class="absolute" :style="ghostStyle" style="border: 2px solid orchid"></div>
      <div class="absolute top-0 left-0 bottom-0 w-full flex flex-col" :style="pageStyle">
        <div v-for="card in props.page" class="w-fit min-w-full">
          <div class="card-number flex justify-between whitespace-nowrap">
            <span>{{ card.index! + 1 }}</span>
            <span class="text-sm">Created: {{ parseTimestamp(card.createdAt) }}</span>
          </div>
          <HomeCard
            :card="card"
            :on-media-click="onMediaClick"
            @mousedown.right="showContextMenu($event, card)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
