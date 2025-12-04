<script lang="ts" setup>
  import { reactive, computed, useTemplateRef, onMounted, onBeforeUnmount, toRaw } from 'vue';
  import type { Card, MediaFile } from '@common/schemas/card';
  import HomeCard from './HomeCard.vue';
  import { parseTimestamp } from '@common/utils/dateUtils';
  import Modal from './UI/Modal.vue';
  import { Channels } from '@preload/channels';
  import { EventEmitter } from '@common/events/eventEmitter';
  import { Events } from '@renderer/events/events';
  import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
  const props = defineProps<{
    page: Card[];
    anchor: number;
    height: number;
    onMediaClick: (media: MediaFile) => void;
    openEditor: (card: Card | null) => void;
  }>();
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
  const contextStyle = computed(() => ({
    left: `${contextMenu.x}px`,
    top: `${contextMenu.y}px`,
  }));
  const rootRef = useTemplateRef('root');
  let observer: ResizeObserver | null = null;
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
  function closeModal() {
    modalState.card = null;
    modalState.visible = false;
  }
  function openModal(card: Card | null) {
    if (!card) return;
    modalState.card = card;
    modalState.visible = true;
  }
  async function deleteCard(card: Card | null) {
    if (!card) return;
    card.media = card.media.map((m) => toRaw(m));
    modalState.isDeleting = true;
    const data = await window.api.invoke<RendererResponseDTO>(Channels.deleteCard, toRaw(card));
    modalState.isDeleting = false;
    closeModal();
    EventEmitter.instance.emit(Events.refreshData, data);
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
    <Modal :visible="modalState.visible" :frozen="modalState.isDeleting" @close="closeModal">
      <template #header>Delete card</template>
      <template #body>
        <div class="flex flex-col text-center">
          <span>Are you sure you want to delete this card?</span>
          <span class="text-danger my-2">This action cannot be undone!</span>
          <div v-if="modalState.isDeleting" class="text-danger flex items-center">
            <span class="loader mr-2"></span>
            Deleting...
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-between">
          <button
            type="button"
            class="btn-secondary"
            :disabled="modalState.isDeleting"
            @click="closeModal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn-danger"
            :disabled="modalState.isDeleting"
            @click="deleteCard(contextMenu.card)"
          >
            Delete
          </button>
        </div>
      </template>
    </Modal>
    <div v-if="!props.page.length" class="text-xl opacity-70 absolute-center whitespace-nowrap">
      No cards to show
    </div>
    <div v-else class="overflow-auto relative h-full" @scroll="hideContextMenu">
      <div class="context-menu fixed" v-if="contextMenu.visible" :style="contextStyle">
        <div class="option px-2 py-0.5" @click="openEditor(contextMenu.card)">Edit</div>
        <div class="option text-danger px-2 py-0.5" @click="openModal(contextMenu.card)">
          Delete
        </div>
      </div>
      <div
        class="absolute top-0 left-0 bottom-0 w-full flex flex-col"
        :style="{ height: '3000px' }"
      >
        <div v-for="(card, index) in props.page" class="w-fit min-w-full">
          <div class="card-number flex justify-between whitespace-nowrap">
            <span>{{ index + anchor + 1 }}</span>
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
