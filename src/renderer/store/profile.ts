import { defineStore } from 'pinia';
import { getEmptyProfileRegistry, Profile } from '@common/schemas/profile';
import { StartupData } from '@common/schemas/startup';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';

EventEmitter.instance.on(Events.loadInitialData, (data: StartupData) => {
  useProfileStore().initFromStartupData(data);
});

EventEmitter.instance.on(Events.clearProfileData, () => {
  useProfileStore().clear();
});

export const useProfileStore = defineStore('profile', {
  state: () => ({
    currProfile: null as Profile | null,
    registry: getEmptyProfileRegistry(),
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      this.currProfile = data.currProfile;
      this.registry = data.profileRegistry;
    },

    clear() {
      this.currProfile = null;
      this.registry.currProfileId = null;
    },
  },
});
