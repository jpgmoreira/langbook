import { defineStore } from 'pinia';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';
import { getEmptyFilters, TagsMode } from '@common/schemas/filters';
import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
import { RefreshPlace } from '@common/types/refreshPlace';
import { CardTier, CardStatus, YesOrNo } from '@common/schemas/card';

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
      this.dirty = true;
    },
    toggleListSelector<T>(value: T, list: T[]) {
      if (list.includes(value)) {
        list = list.filter((v) => v !== value);
      } else {
        list.push(value);
      }
      this.dirty = true;
      return list;
    },
    toggleTier(value: CardTier) {
      this.filters.tiers = this.toggleListSelector(value, this.filters.tiers);
    },
    toggleStatus(value: CardStatus) {
      this.filters.statuses = this.toggleListSelector(value, this.filters.statuses);
    },
    toggleCore(value: YesOrNo) {
      this.filters.core = this.toggleListSelector(value, this.filters.core);
    },
    clearFilters() {
      if (
        this.filters.tags.length ||
        this.filters.text.trim() ||
        this.filters.tiers.length ||
        this.filters.statuses.length ||
        this.filters.core.length
      ) {
        this.dirty = true;
      }
      this.filters.tags = [];
      this.filters.text = '';
      this.filters.tiers = [];
      this.filters.statuses = [];
      this.filters.core = [];
    },
  },
});
