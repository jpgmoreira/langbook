import { FileProxy } from '../fileProxy';
import path from 'path';
import { DATA_DIR } from '../constants';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@main/events/events';
import { Tags } from '@common/schemas/tags';
import { Card } from '@common/schemas/card';

EventEmitter.instance.on(Events.clearProfileData, () => {
  TagsManager.instance.clear();
});

/**
 * Singleton for managing tags.
 * Access via TagsManager.instance
 */
export class TagsManager {
  static #instance: TagsManager;

  private _proxy: FileProxy<Tags> | null = null;

  private get proxy() {
    return this._proxy!.proxy;
  }

  private constructor() {}

  public static get instance(): TagsManager {
    if (!this.#instance) {
      this.#instance = new TagsManager();
    }
    return this.#instance;
  }

  public loadProfile(profileId: string) {
    const filePath = path.join(DATA_DIR, 'profileData', profileId, 'tags.json');
    this._proxy = new FileProxy(filePath, {});
  }

  public getTags() {
    return structuredClone(this._proxy!.target);
  }

  public cardDeleted(card: Card) {
    for (const tag of card.tags) {
      if (tag in this.proxy) {
        this.proxy[tag]--;
        if (this.proxy[tag] === 0) {
          delete this.proxy[tag];
        }
      }
    }
  }

  public cardCreated(card: Card) {
    for (const tag of card.tags) {
      if (!(tag in this.proxy)) {
        this.proxy[tag] = 0;
      }
      this.proxy[tag]++;
    }
  }

  public clear() {
    this._proxy = null;
  }
}
