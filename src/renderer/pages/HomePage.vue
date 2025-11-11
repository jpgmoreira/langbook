<script lang="ts" setup>
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
  import { useTagsStore } from '@renderer/store/tags';
  import { useFiltersStore } from '@renderer/store/filters';
  import Header from '@renderer/components/Header.vue';
  import TreeView from '@renderer/components/UI/TreeView/TreeView.vue';
  import Multiselect from '@renderer/components/UI/Multiselect.vue';
  import NumericSelector from '@renderer/components/UI/NumericSelector.vue';
  const tagsStore = useTagsStore();
  const filtersStore = useFiltersStore();
  const isResizing = ref(false);
  const treeAreaWidth = ref(300);
  const contestsAreaWidth = ref(window.innerWidth - 300);
  const hideFilters = ref(false);
  const tagsOptions = computed(() =>
    Object.keys(tagsStore.tags).map((t) => ({
      text: t,
      value: t,
    }))
  );
  const filterButtonClass = computed(() => {
    if (filtersStore.dirty) return 'btn-warning';
    return 'btn-primary';
  });
  function filter() {
    filtersStore.dirty = false;
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
        <div class="grow" style="border: 0px solid lightgreen"></div>
        <div v-if="!hideFilters" class="filters-container px-2 py-1.5 whitespace-nowrap">
          <div>Filters:</div>
          <Multiselect
            :options="tagsOptions"
            :selected="filtersStore.filters.tags"
            :tagsMode="filtersStore.filters.tagsMode"
            placeholder="Tags"
            direction="up"
            close
            @select-option="filtersStore.selectTag"
            @deselect-option="filtersStore.deselectTag"
            @change-tags-mode="filtersStore.changeTagsMode"
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
            <NumericSelector
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
          <button type="button" :class="filterButtonClass" @click="filter">Filter</button>
          <button type="button" class="btn-primary" @click="filtersStore.clearFilters">
            Clear
          </button>
          <button type="button" class="btn-primary whitespace-nowrap">Add card</button>
          <button type="button" class="btn-primary">Flashcards</button>
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
