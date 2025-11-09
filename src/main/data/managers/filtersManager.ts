import { FileProxy } from '../fileProxy';
import path from 'path';
import { DATA_DIR } from '../constants';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@main/events/events';
import { Filters, getEmptyFilters } from '@common/schemas/filters';

EventEmitter.instance.on(Events.clearProfileData, () => {
  FiltersManager.instance.clear();
});

/**
 * Singleton for managing filters.
 * Access via FiltersManager.instance
 */
export class FiltersManager {
  static #instance: FiltersManager;

  private _proxy: FileProxy<Filters> | null = null;

  private get proxy() {
    return this._proxy!.proxy;
  }

  private constructor() {}

  public static get instance(): FiltersManager {
    if (!this.#instance) {
      this.#instance = new FiltersManager();
    }
    return this.#instance;
  }

  public loadProfile(profileId: string) {
    const filePath = path.join(DATA_DIR, 'profileData', profileId, 'filters.json');
    this._proxy = new FileProxy(filePath, getEmptyFilters());
  }

  public getFilters() {
    return structuredClone(this._proxy!.target);
  }

  public clear() {
    this._proxy = null;
  }
}
