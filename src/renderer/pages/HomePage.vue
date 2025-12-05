<script lang="ts" setup>
  import { ref, onMounted, onBeforeUnmount, computed, toRaw } from 'vue';
  import { useFiltersStore } from '@renderer/store/filters';
  import { useUIStore } from '@renderer/store/ui';
  import Header from '@renderer/components/Header.vue';
  import TreeView from '@renderer/components/UI/TreeView/TreeView.vue';
  import Multiselect, { MultiselectOption } from '@renderer/components/UI/Multiselect.vue';
  import Frequencymeter from '@renderer/components/UI/Frequencymeter.vue';
  import CardsView from '@renderer/components/CardsView.vue';
  import MediaModal from '@renderer/components/UI/MediaModal.vue';
  import { Channels } from '@preload/channels';
  import { EventEmitter } from '@common/events/eventEmitter';
  import { Events } from '@renderer/events/events';
  import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
  import { Card, MediaFile } from '@common/schemas/card';
  import { Tags } from '@common/schemas/tags';
  import { RefreshPlace } from '@common/types/refreshPlace';
  import { useProfileStore } from '@renderer/store/profile';
  EventEmitter.instance.on(Events.refreshData, refreshData);
  const filtersStore = useFiltersStore();
  const uiStore = useUIStore();
  const profileStore = useProfileStore();
  const isResizing = ref(false);
  const treeAreaWidth = ref(300);
  const contestsAreaWidth = ref(window.innerWidth - 300);
  const hideFilters = ref(false);
  const page = ref<Card[]>([]);
  const height = ref(0);
  const nFiltered = ref(0);
  const selectedMedia = ref<MediaFile | undefined>(undefined);
  const hasSessions = ref(false);
  const allTags = ref<Tags>({});
  const tagsOptions = computed(() => {
    const entries = Object.entries(allTags.value);
    const result: MultiselectOption[] = [];
    for (const [tag, count] of entries) {
      const option: MultiselectOption = {
        text: `${tag} (${count})`,
        value: tag,
      };
      if (tag === 'audio') {
        option.class = 'audio';
      }
      result.push(option);
    }
    return result;
  });
  const filterButtonClass = computed(() => {
    if (filtersStore.dirty && hasSessions.value) return 'btn-warning';
    return 'btn-primary';
  });
  const addCardsTooltip = computed(() => {
    if (hasSessions.value) return undefined;
    return 'Can only create cards if there are sessions!';
  });
  const filterTooltip = computed(() => {
    if (hasSessions.value) return undefined;
    return 'Can only filter cards if there are sessions!';
  });
  const clearTooltip = computed(() => {
    if (hasSessions.value) return undefined;
    return 'Can only clear filters when filtering is enabled!';
  });
  const flashcardsTooltip = computed(() => {
    if (page.value.length) return undefined;
    return 'Can only use flashcards if there are cards!';
  });
  async function filter() {
    filtersStore.dirty = false;
    const result = await window.api.invoke<RendererResponseDTO>(
      Channels.filter,
      toRaw(filtersStore.filters)
    );
    refreshData(result);
  }
  function openEditor(card: Card | null) {
    uiStore.backdropVisible = true;
    window.api.invoke(Channels.openEditor, toRaw(card));
  }
  function refreshData(data: RendererResponseDTO) {
    if (!data.where.includes(RefreshPlace.HOME_PAGE)) return;
    if ('page' in data) page.value = data.page as Card[];
    if ('height' in data) height.value = data.height as number;
    if ('nFiltered' in data) nFiltered.value = data.nFiltered as number;
    if ('tags' in data) allTags.value = data.tags as Tags;
    if ('hasSessions' in data) hasSessions.value = data.hasSessions as boolean;
  }
  async function mediaClick(media: MediaFile) {
    if (media.type.startsWith('audio')) {
      const mediaPath = profileStore.resolveMediaPath(media);
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
  function windowMouseUp() {
    isResizing.value = false;
  }
  function windowMouseMove(e: MouseEvent) {
    if (!isResizing.value) return;
    treeAreaWidth.value = e.clientX;
    contestsAreaWidth.value = window.innerWidth - e.clientX;
    window.getSelection()?.removeAllRanges();
  }
  onMounted(() => {
    window.addEventListener('mouseup', windowMouseUp);
    window.addEventListener('mousemove', windowMouseMove);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('mouseup', windowMouseUp);
    window.removeEventListener('mousemove', windowMouseMove);
  });
</script>

<template>
  <div class="home-page h-screen flex flex-col overflow-hidden" :class="{ resizing: isResizing }">
    <Header />
    <MediaModal :media="selectedMedia" @click="mediaModalClick" />
    <div class="flex grow">
      <div :style="{ width: `${treeAreaWidth}px` }">
        <TreeView class="select-none" files-hint file-icon checkbox />
      </div>
      <div
        class="separator shrink-0"
        :class="{ resizing: isResizing }"
        @mousedown="isResizing = true"
      ></div>
      <div class="flex flex-col grow" :style="{ width: `${contestsAreaWidth}px` }">
        <div class="grow overflow-hidden">
          <CardsView
            :page="page"
            :height="height"
            :n-filtered="nFiltered"
            :onMediaClick="mediaClick"
            :openEditor="openEditor"
          />
        </div>
        <div v-if="!hideFilters" class="filters-container px-2 py-1.5 whitespace-nowrap">
          <div>Filters:</div>
          <Multiselect
            :options="tagsOptions"
            :selected="filtersStore.filters.tags"
            placeholder="Tags"
            direction="up"
            close
            :mode="filtersStore.filters.tagsMode"
            @select-option="filtersStore.selectTag"
            @deselect-option="filtersStore.deselectTag"
            @change-mode="filtersStore.changeTagsMode"
          />
          <input
            class="my-1"
            type="text"
            placeholder="Text"
            v-model.trim="filtersStore.filters.text"
            @input="filtersStore.dirty = true"
          />
          <div class="flex items-center">
            <span class="mr-1">Frequency:</span>
            <Frequencymeter
              :selected="filtersStore.filters.frequencies"
              @toggle="filtersStore.toggleFrequency"
            />
          </div>
        </div>
        <footer class="flex items-center justify-evenly py-1">
          <button
            type="button"
            class="caret-button"
            :class="{ rotated: hideFilters }"
            @click="hideFilters = !hideFilters"
          ></button>
          <button
            type="button"
            :class="filterButtonClass"
            @click="filter"
            :disabled="!hasSessions"
            v-tooltip="filterTooltip"
          >
            Filter
          </button>
          <button
            type="button"
            class="btn-primary"
            @click="filtersStore.clearFilters"
            :disabled="!hasSessions"
            v-tooltip="clearTooltip"
          >
            Clear
          </button>
          <button
            type="button"
            class="btn-primary whitespace-nowrap"
            @click="openEditor(null)"
            :disabled="!hasSessions"
            v-tooltip="addCardsTooltip"
          >
            Add card
          </button>
          <button
            type="button"
            class="btn-primary"
            :disabled="!page.length"
            v-tooltip="flashcardsTooltip"
          >
            Flashcards
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .home-page.resizing {
    cursor: ew-resize;
  }
  .separator {
    width: 5px;
    background: gray;
  }
  .separator:hover,
  .separator.resizing {
    background: #0087e7;
    cursor: ew-resize;
  }

  .caret-button {
    transition: transform 0.2s ease;
  }
  .caret-button.rotated {
    transform: rotate(180deg);
  }
</style>
