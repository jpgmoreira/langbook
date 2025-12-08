<script lang="ts" setup>
  import { ref, onMounted, onBeforeUnmount, computed, toRaw, nextTick } from 'vue';
  import { useFiltersStore } from '@renderer/store/filters';
  import { useUIStore } from '@renderer/store/ui';
  import Header from '@renderer/components/Header.vue';
  import TreeView from '@renderer/components/UI/TreeView/TreeView.vue';
  import Multiselect, { MultiselectOption } from '@renderer/components/UI/Multiselect.vue';
  import SelectionList from '@renderer/components/UI/SelectionList.vue';
  import CardsView from '@renderer/components/CardsView.vue';
  import MediaModal from '@renderer/components/UI/MediaModal.vue';
  import { Channels } from '@preload/channels';
  import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
  import {
    Card,
    CardTier,
    MediaFile,
    CardStatus,
    TIER_OPTIONS,
    STATUS_OPTIONS,
    YES_OR_NO_OPTIONS,
    YesOrNo,
  } from '@common/schemas/card';
  import { useMediaStore } from '@renderer/store/media';
  import { useHomePageStore } from '@renderer/store/home';
  const filtersStore = useFiltersStore();
  const uiStore = useUIStore();
  const mediaStore = useMediaStore();
  const isResizing = ref(false);
  const homeStore = useHomePageStore();
  const tagsOptions = computed(() => {
    const entries = Object.entries(homeStore.allTags);
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
    if (filtersStore.dirty && homeStore.hasSessions) return 'btn-warning';
    return 'btn-primary';
  });
  const addCardsTooltip = computed(() => {
    if (homeStore.hasSessions) return undefined;
    return 'Can only create cards if there are sessions!';
  });
  const filterTooltip = computed(() => {
    if (homeStore.hasSessions) return undefined;
    return 'Can only filter cards if there are sessions!';
  });
  const clearTooltip = computed(() => {
    if (homeStore.hasSessions) return undefined;
    return 'Can only clear filters when filtering is enabled!';
  });
  const flashcardsTooltip = computed(() => {
    if (homeStore.page.length) return undefined;
    return 'Can only use flashcards if there are cards!';
  });
  async function filter() {
    filtersStore.dirty = false;
    const result = await window.api.invoke<RendererResponseDTO>(
      Channels.filter,
      toRaw(filtersStore.filters)
    );
    homeStore.refreshNewPage(result);
  }
  async function applyFilter() {
    await nextTick();
    filter();
  }
  function openEditor(card: Card | null) {
    uiStore.backdropVisible = true;
    window.api.invoke(Channels.openEditor, toRaw(card));
  }
  function openFlashcards() {
    uiStore.backdropVisible = true;
    window.api.invoke(Channels.openFlashcards);
  }
  async function mediaClick(media: MediaFile) {
    if (media.type.startsWith('audio')) {
      const mediaPath = mediaStore.resolveMediaPath(media.path);
      const audio = new Audio(mediaPath);
      audio.play();
    } else if (media.type.startsWith('image')) {
      uiStore.backdropVisible = true;
      homeStore.selectedMedia = media;
    }
  }
  function mediaModalClick() {
    homeStore.selectedMedia = undefined;
    uiStore.backdropVisible = false;
  }
  function setTier(value: CardTier) {
    filtersStore.toggleTier(value);
  }
  function setStatus(value: CardStatus) {
    filtersStore.toggleStatus(value);
  }
  function setCore(value: YesOrNo) {
    filtersStore.toggleCore(value);
  }
  function windowMouseUp() {
    isResizing.value = false;
  }
  function windowMouseMove(e: MouseEvent) {
    if (!isResizing.value) return;
    homeStore.setTreeAreaWidth(e.clientX);
    window.getSelection()?.removeAllRanges();
  }
  function windowKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      mediaModalClick();
    }
  }
  onMounted(() => {
    window.addEventListener('mouseup', windowMouseUp);
    window.addEventListener('mousemove', windowMouseMove);
    window.addEventListener('keydown', windowKeyDown);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('mouseup', windowMouseUp);
    window.removeEventListener('mousemove', windowMouseMove);
    window.removeEventListener('keydown', windowKeyDown);
  });
</script>

<template>
  <div class="home-page h-screen flex flex-col overflow-hidden" :class="{ resizing: isResizing }">
    <Header />
    <MediaModal :media="homeStore.selectedMedia" @click="mediaModalClick" />
    <div class="flex grow">
      <div :style="{ width: `${homeStore.treeAreaWidth}px` }">
        <TreeView class="select-none" files-hint file-icon checkbox />
      </div>
      <div
        class="separator shrink-0"
        :class="{ resizing: isResizing }"
        @mousedown="isResizing = true"
      ></div>
      <div class="flex flex-col grow" :style="{ width: `${homeStore.contestsAreaWidth}px` }">
        <div class="grow overflow-hidden">
          <CardsView
            :page="homeStore.page"
            :height="homeStore.height"
            :n-filtered="homeStore.nFiltered"
            :onMediaClick="mediaClick"
            :openEditor="openEditor"
          />
        </div>
        <div v-if="!homeStore.hideFilters" class="filters-container px-2 py-1.5 whitespace-nowrap">
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
            @keydown.enter="applyFilter"
          />
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1">
              <span>Tier:</span>
              <SelectionList
                :options="[...TIER_OPTIONS]"
                :selected="filtersStore.filters.tiers"
                @toggle="setTier"
              />
            </div>
            <div class="flex items-center gap-1">
              <span>Status:</span>
              <SelectionList
                :options="[...STATUS_OPTIONS]"
                :selected="filtersStore.filters.statuses"
                @toggle="setStatus"
              />
            </div>
            <div class="flex items-center gap-1">
              <span>Core:</span>
              <SelectionList
                :options="[...YES_OR_NO_OPTIONS]"
                :selected="filtersStore.filters.core"
                @toggle="setCore"
              />
            </div>
          </div>
        </div>
        <footer class="flex items-center justify-evenly py-1">
          <button
            type="button"
            class="caret-button"
            :class="{ rotated: homeStore.hideFilters }"
            @click="homeStore.toggleHideFilters"
          ></button>
          <button
            type="button"
            :class="filterButtonClass"
            @click="filter"
            :disabled="!homeStore.hasSessions"
            v-tooltip="filterTooltip"
          >
            Filter
          </button>
          <button
            type="button"
            class="btn-primary"
            @click="filtersStore.clearFilters"
            :disabled="!homeStore.hasSessions"
            v-tooltip="clearTooltip"
          >
            Clear
          </button>
          <button
            type="button"
            class="btn-primary whitespace-nowrap"
            @click="openEditor(null)"
            :disabled="!homeStore.hasSessions"
            v-tooltip="addCardsTooltip"
          >
            Add card
          </button>
          <button
            type="button"
            class="btn-primary"
            :disabled="!homeStore.page.length"
            @click="openFlashcards"
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
    background: rgb(66, 66, 66);
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
