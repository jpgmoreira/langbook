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

export const useFiltersStore = defineStore('tags', {
  state: () => ({
    filters: getEmptyFilters(),
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      this.filters = data.filters;
    },
    clear() {
      this.filters = getEmptyFilters();
    },
  },
});
