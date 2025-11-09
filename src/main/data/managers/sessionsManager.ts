import { FileProxy } from '../fileProxy';
import path from 'path';
import { DATA_DIR } from '../constants';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@main/events/events';
import { Sessions } from '@common/schemas/sessions';

EventEmitter.instance.on(Events.clearProfileData, () => {
  SessionsManager.instance.clear();
});

/**
 * Singleton for managing sessions.
 * Access via SessionsManager.instance
 */
export class SessionsManager {
  static #instance: SessionsManager;

  private _proxy: FileProxy<Sessions> | null = null;

  private get proxy() {
    return this._proxy!.proxy;
  }

  private constructor() {}

  public static get instance(): SessionsManager {
    if (!this.#instance) {
      this.#instance = new SessionsManager();
    }
    return this.#instance;
  }

  public loadProfile(profileId: string) {
    const filePath = path.join(DATA_DIR, 'profileData', profileId, 'sessions.json');
    this._proxy = new FileProxy(filePath, {});
  }

  public getSessions() {
    return structuredClone(this._proxy!.target);
  }

  public clear() {
    this._proxy = null;
  }
}
