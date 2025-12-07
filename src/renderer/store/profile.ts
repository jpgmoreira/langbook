import { defineStore } from 'pinia';
import { getEmptyProfileRegistry, Profile } from '@common/schemas/profile';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';
import { Channels } from '@preload/channels';
import { CreateProfileResponseDTO } from '@common/dto/createProfileResponseDTO';
import { GenericResponseDTO } from '@common/dto/genericResponseDTO';
import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
import { RefreshPlace } from '@common/types/refreshPlace';

EventEmitter.instance.on(Events.refreshData, (data: RendererResponseDTO) => {
  if (data.where.includes(RefreshPlace.PROFILE_STORE_REGISTRY)) {
    useProfileStore().refreshRegistry(data);
  }
  if (data.where.includes(RefreshPlace.PROFILE_STORE)) {
    useProfileStore().refreshData(data);
  }
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
    refreshData(data: RendererResponseDTO) {
      this.currProfile = data.profile!;
      this.registry = data.profileRegistry!;
    },
    refreshRegistry(data: RendererResponseDTO) {
      this.registry = data.profileRegistry!;
    },
    async createProfile(name: string): Promise<CreateProfileResponseDTO> {
      const result = await window.api.invoke<CreateProfileResponseDTO>(
        Channels.createProfile,
        name
      );
      if (result.status === 'success') {
        EventEmitter.instance.emit(Events.refreshData, result.data);
      }
      return result;
    },
    async login(profileId: string) {
      const data = await window.api.invoke<RendererResponseDTO>(Channels.login, profileId);
      EventEmitter.instance.emit(Events.refreshData, data);
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
