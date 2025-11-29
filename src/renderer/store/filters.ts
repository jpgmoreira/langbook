import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';
import { getEmptyFilters, TagsMode } from '@common/schemas/filters';

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
    changeTagsMode(mode: TagsMode) {
      this.filters.tagsMode = mode;
    },
    toggleFrequency(value: number) {
      const frequencies = this.filters.frequencies;
      if (frequencies.includes(value)) {
        this.filters.frequencies = frequencies.filter((v) => v !== value);
      } else {
        frequencies.push(value);
      }
      this.dirty = true;
    },
    clearFilters() {
      if (this.filters.tags.length || this.filters.text.trim() || this.filters.frequencies.length) {
        this.dirty = true;
      }
      this.filters.tags = [];
      this.filters.text = '';
      this.filters.frequencies = [];
    },
  },
});
