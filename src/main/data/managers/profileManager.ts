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
import fs from 'fs';

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

  public loadProfile(profileId: string) {}

  public logout() {
    EventEmitter.instance.emit(Events.clearProfileData);
  }

  public clear() {
    this._currProfileProxy = null;
    this.registry.currProfileId = null;
  }
}
