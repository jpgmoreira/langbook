import {
  getEmptyProfile,
  getEmptyProfileRegistry,
  Profile,
  ProfileRegistry,
} from '@common/schemas/profile';
import { FileProxy } from '../fileProxy';
import path from 'path';
import { DATA_DIR } from '../constants';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@main/events/events';
import { GenericResponseDTO } from '@common/dto/genericResponseDTO';
import { buildId, sleep } from '@common/utils/utils';
import { ensureDirExists } from '../utils';

EventEmitter.instance.on(Events.clearProfileData, () => {
  ProfileManager.instance.clear();
});

/**
 * Singleton for managing profiles.
 * Access via ProfileManager.instance
 */
export class ProfileManager {
  static #instance: ProfileManager;

  private _currProfileProxy: FileProxy<Profile> | null = null;
  private _registryProxy: FileProxy<ProfileRegistry>;

  private get registry() {
    return this._registryProxy.proxy;
  }
  private get profile() {
    return this._currProfileProxy?.proxy || null;
  }

  private constructor() {
    const registryPath = path.join(DATA_DIR, 'profiles.json');
    this._registryProxy = new FileProxy(registryPath, getEmptyProfileRegistry());
    const profileId = this._registryProxy.proxy.currProfileId;
    if (profileId) this.loadProfile(profileId);
  }

  public static get instance(): ProfileManager {
    if (!this.#instance) {
      this.#instance = new ProfileManager();
    }
    return this.#instance;
  }

  private validateProfileName(name: string) {
    if (!name) {
      return {
        status: 'error',
        errorMsg: 'Profile name cannot be empty!',
      } as const;
    }
    if (this.registry.profileRecords.some((p) => p.name === name)) {
      return {
        status: 'error',
        errorMsg: 'Profile name already in use!',
      } as const;
    }
    return { status: 'success ' } as const;
  }

  public getCurrProfile() {
    return structuredClone(this._currProfileProxy?.target || null);
  }

  public getProfileRegistry() {
    return structuredClone(this._registryProxy.target || null);
  }

  public createProfile(name: string): GenericResponseDTO {
    name = name.trim();
    const validationResult = this.validateProfileName(name);
    if (validationResult.status === 'error') {
      return validationResult;
    }
    const now = Date.now();
    const id = buildId(name, now);
    this.registry.profileRecords.push({
      id,
      name,
      createdAt: now,
      lastAccess: now,
      cards: 0,
      sessions: 0,
    });
    this.loadProfile(id);
    return { status: 'success' };
  }

  public login(profileId: string) {
    this.loadProfile(profileId);
  }

  public renameProfile(profileId: string, name: string): GenericResponseDTO {
    name = name.trim();
    const validationResult = this.validateProfileName(name);
    if (validationResult.status === 'error') {
      return validationResult;
    }
    const record = this.registry.profileRecords.find((p) => p.id === profileId)!;
    record.name = name;
    // TODO: Rename profile in their folder.
    return { status: 'success' };
  }

  public async deleteProfile(profileId: string): Promise<GenericResponseDTO> {
    await sleep(5000);
    try {
      // TODO: Perform entire profile deletion.
      this.registry.profileRecords = this.registry.profileRecords.filter((p) => p.id !== profileId);
    } catch (err) {
      console.log('Error while deleting profile:', err);
      return {
        status: 'error',
        errorMsg: 'Error while deleting profile.',
      };
    }
    return { status: 'success' };
  }

  private loadProfile(profileId: string) {
    const record = this.registry.profileRecords.find((p) => p.id === profileId)!;
    const filePath = path.join(DATA_DIR, 'profileData', profileId, 'profile.json');
    this._currProfileProxy = new FileProxy(filePath, getEmptyProfile(profileId, record.name));
    this.registry.currProfileId = profileId;
    const mediaDir = path.join(DATA_DIR, 'profileData', profileId, 'media');
    ensureDirExists(mediaDir);
  }

  public addSessions(n: 1 | -1) {
    const profileId = this.profile?.id;
    if (!profileId) return;
    const record = this.registry.profileRecords.find((p) => p.id === profileId)!;
    record.sessions += n;
  }

  public addCards(n: 1 | -1) {
    const profileId = this.profile?.id;
    if (!profileId) return;
    const record = this.registry.profileRecords.find((p) => p.id === profileId)!;
    record.cards += n;
  }

  public logout() {
    EventEmitter.instance.emit(Events.clearProfileData);
  }

  public clear() {
    this._currProfileProxy = null;
    this.registry.currProfileId = null;
  }
}
