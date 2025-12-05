import { defineStore } from 'pinia';
import { getEmptyProfileRegistry, Profile } from '@common/schemas/profile';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';
import { Channels } from '@preload/channels';
import { CreateProfileResponseDTO } from '@common/dto/createProfileResponseDTO';
import { GenericResponseDTO } from '@common/dto/genericResponseDTO';
import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
import { RefreshPlace } from '@common/types/refreshPlace';
import { MediaFile } from '@common/schemas/card';

EventEmitter.instance.on(Events.refreshData, (data: RendererResponseDTO) => {
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
    mediaDir: '',
  }),
  actions: {
    refreshData(data: RendererResponseDTO) {
      if ('profile' in data) this.currProfile = data.profile || null;
      if ('profileRegistry' in data) {
        this.registry = data.profileRegistry || getEmptyProfileRegistry();
      }
      if ('mediaDir' in data) this.mediaDir = data.mediaDir || '';
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
      this.mediaDir = '';
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
    resolveMediaPath(media: MediaFile) {
      return `safe-file://${this.mediaDir}/${media.path}`;
    },
  },
});
