import { FileProxy } from '../fileProxy';
import path from 'path';
import { DATA_DIR } from '../constants';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@main/events/events';
import { Filters, getEmptyFilters } from '@common/schemas/filters';
import { Card } from '@common/schemas/card';
import { arrayContainsAll, arrayContainsAny, isSubstring } from '@common/utils/utils';
import { TreeManager } from './treeManager';

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

  // private get proxy() {
  //   return this._proxy!.proxy;
  // }

  private get target() {
    return this._proxy!.target;
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
    return structuredClone(this.target);
  }

  public satisfyCurrentFilters(card: Card): boolean {
    // - Frequency matching:
    if (this.target.frequencies.length && !this.target.frequencies.includes(card.frequency)) {
      return false;
    }
    // - Text matching:
    if (
      this.target.text.trim() &&
      !(
        isSubstring(card.front, this.target.text) ||
        isSubstring(card.back, this.target.text) ||
        isSubstring(card.extra, this.target.text)
      )
    ) {
      return false;
    }
    // - Tags matching:
    if (this.target.tags.length) {
      if (this.target.tagsMode === 'all') {
        if (!arrayContainsAll(card.tags, this.target.tags)) {
          return false;
        }
      } else if (this.target.tagsMode === 'any') {
        if (!arrayContainsAny(card.tags, this.target.tags)) {
          return false;
        }
      }
    }
    // - Sessions matching:
    const selectedSessions = TreeManager.instance.getSelectedSessions();
    if (!arrayContainsAny(selectedSessions, card.sessions)) {
      return false;
    }
    return true;
  }

  public clear() {
    this._proxy = null;
  }
}
