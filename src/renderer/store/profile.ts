import { defineStore } from 'pinia';
import { getEmptyProfileRegistry, Profile } from '@common/schemas/profile';
import { StartupData } from '@common/schemas/startup';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';
import { Channels } from '@preload/channels';
import { CreateProfileResponseDTO } from '@common/dto/createProfileResponseDTO';
import { GenericResponseDTO } from '@common/dto/genericResponseDTO';

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
    async createProfile(name: string): Promise<CreateProfileResponseDTO> {
      const result = await window.api.invoke<CreateProfileResponseDTO>(
        Channels.createProfile,
        name
      );
      if (result.status === 'success') {
        EventEmitter.instance.emit(Events.loadInitialData, result.data);
      }
      return result;
    },
    clear() {
      this.currProfile = null;
      this.registry.currProfileId = null;
    },
    async renameProfile(profileId: string, newName: string): Promise<GenericResponseDTO> {
      newName = newName.trim();
      const result = await window.api.invoke<GenericResponseDTO>(
        Channels.renameProfile,
        profileId,
        newName
      );
      if (result.status === 'success') {
        const record = this.registry.profileRecords.find((p) => p.id === profileId)!;
        record.name = newName;
      }
      return result;
    },
    async deleteProfile(profileId: string): Promise<GenericResponseDTO> {
      const result = await window.api.invoke<GenericResponseDTO>(Channels.deleteProfile, profileId);
      if (result.status === 'success') {
        this.registry.profileRecords = this.registry.profileRecords.filter(
          (p) => p.id !== profileId
        );
      }
      return result;
    },
  },
});
