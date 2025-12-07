import { defineStore } from 'pinia';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';
import { getEmptyFilters, TagsMode } from '@common/schemas/filters';
import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
import { RefreshPlace } from '@common/types/refreshPlace';
import { CardTier, CardStatus } from '@common/schemas/card';

EventEmitter.instance.on(Events.refreshData, (data: RendererResponseDTO) => {
  if (data.where.includes(RefreshPlace.FILTERS_STORE)) {
    useFiltersStore().refreshData(data);
  }
});

EventEmitter.instance.on(Events.clearProfileData, () => {
  useFiltersStore().clear();
});

export const useFiltersStore = defineStore('filters', {
  state: () => ({
    dirty: false,
    filters: getEmptyFilters(),
  }),
  actions: {
    refreshData(data: RendererResponseDTO) {
      this.filters = data.filters!;
    },
    clear() {
      this.dirty = false;
      this.filters = getEmptyFilters();
    },
    selectTag(tag: string) {
      const tags = this.filters.tags;
      if (!tags.includes(tag)) {
        tags.push(tag);
        this.dirty = true;
      }
    },
    deselectTag(tag: string) {
      const tags = this.filters.tags;
      if (tags.includes(tag)) {
        this.filters.tags = tags.filter((t) => t !== tag);
        this.dirty = true;
      }
    },
    changeTagsMode(mode: TagsMode) {
      this.filters.tagsMode = mode;
    },
    toggleStage(value: CardTier) {
      const stages = this.filters.stages;
      if (stages.includes(value)) {
        this.filters.stages = stages.filter((v) => v !== value);
      } else {
        stages.push(value);
      }
      this.dirty = true;
    },
    toggleStatus(value: CardStatus) {
      const status = this.filters.status;
      if (status.includes(value)) {
        this.filters.status = status.filter((v) => v !== value);
      } else {
        status.push(value);
      }
      this.dirty = true;
    },
    clearFilters() {
      if (this.filters.tags.length || this.filters.text.trim() || this.filters.stages.length) {
        this.dirty = true;
      }
      this.filters.tags = [];
      this.filters.text = '';
      this.filters.stages = [];
    },
  },
});
