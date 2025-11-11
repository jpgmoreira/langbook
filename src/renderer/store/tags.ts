import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';
import { Tags } from '@common/schemas/tags';

EventEmitter.instance.on(Events.loadInitialData, (data: StartupData) => {
  useTagsStore().initFromStartupData(data);
});

EventEmitter.instance.on(Events.clearProfileData, () => {
  useTagsStore().clear();
});

export const useTagsStore = defineStore('tags', {
  state: () => ({
    tags: {} as Tags,
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      this.tags = data.tags;
    },
    clear() {
      this.tags = {};
    },
    getTagWithCount(tag: string) {
      if (!(tag in this.tags)) return '';
      return `${tag} (${this.tags[tag]})`;
    },
  },
});
