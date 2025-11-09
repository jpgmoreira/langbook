import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';
import { Sessions } from '@common/schemas/sessions';

EventEmitter.instance.on(Events.loadInitialData, (data: StartupData) => {
  useSessionsStore().initFromStartupData(data);
});

EventEmitter.instance.on(Events.clearProfileData, () => {
  useSessionsStore().clear();
});

export const useSessionsStore = defineStore('sessions', {
  state: () => ({
    sessions: {} as Sessions,
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      this.sessions = data.sessions;
    },
    clear() {
      this.sessions = {};
    },
  },
});
