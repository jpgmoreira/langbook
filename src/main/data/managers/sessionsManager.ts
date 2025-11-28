import { FileProxy } from '../fileProxy';
import path from 'path';
import { DATA_DIR } from '../constants';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@main/events/events';
import { getEmptySession, Session, Sessions } from '@common/schemas/sessions';
import { randomId } from '@common/utils/utils';
import { ProfileManager } from './profileManager';
import { Card } from '@common/schemas/card';

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

  public createSession(name: string): Session {
    const now = Date.now();
    const id = randomId();
    const newSession = getEmptySession(id, name, now);
    this.proxy[id] = newSession;
    ProfileManager.instance.addSessions(1);
    return newSession;
  }

  public renameSession(sessionId: string, newName: string) {
    const session = this.proxy[sessionId];
    if (!session) return;
    session.name = newName;
  }

  public deleteSession(sessionId: string) {
    if (!(sessionId in this.proxy)) return;
    delete this.proxy[sessionId];
    ProfileManager.instance.addSessions(-1);
  }

  public cardDeleted(card: Card) {
    for (const session of card.sessions) {
      this.proxy[session].count--;
    }
  }

  public cardCreated(card: Card) {
    for (const session of card.sessions) {
      this.proxy[session].count++;
    }
  }

  public clear() {
    this._proxy = null;
  }
}
