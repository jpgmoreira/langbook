<script lang="ts" setup>
  import { reactive, computed, useTemplateRef, onMounted, onBeforeUnmount } from 'vue';
  import type { Card, MediaFile } from '@common/schemas/card';
  import HomeCard from './HomeCard.vue';
  import { parseTimestamp } from '@common/utils/dateUtils';
  const props = defineProps<{
    page: Card[];
    anchor: number;
    height: number;
    onMediaClick: (media: MediaFile) => void;
  }>();
  const contextMenu = reactive({
    visible: false,
    x: 0,
    y: 0,
    card: null as Card | null,
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
    <div v-if="!props.page.length" class="text-xl opacity-70 absolute-center">No cards to show</div>
    <div v-else class="overflow-auto relative h-full" @scroll="hideContextMenu">
      <div class="context-menu fixed" v-if="contextMenu.visible" :style="contextStyle">
        <div class="option px-2 py-0.5">Edit</div>
        <div class="option text-danger px-2 py-0.5">Delete</div>
      </div>
      <div
        class="absolute top-0 left-0 bottom-0 w-full flex flex-col"
        :style="{ height: '3000px' }"
      >
        <div v-for="(card, index) in props.page" class="w-fit min-w-full">
          <div class="card-number flex justify-between whitespace-nowrap mx-1">
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
