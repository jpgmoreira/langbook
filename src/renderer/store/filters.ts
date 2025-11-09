import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';
import { getEmptyFilters } from '@common/schemas/filters';

EventEmitter.instance.on(Events.loadInitialData, (data: StartupData) => {
  useFiltersStore().initFromStartupData(data);
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
    initFromStartupData(data: StartupData) {
      this.filters = data.filters;
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
  },
});
