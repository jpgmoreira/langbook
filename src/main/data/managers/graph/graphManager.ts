import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@main/events/events';
import { GraphDbManager } from './graphDbManager';

EventEmitter.instance.on(Events.clearProfileData, () => {
  GraphManager.instance.clear();
});

/**
 * Singleton for managing the graph.
 * Access via GraphManager.instance
 */
export class GraphManager {
  static #instance: GraphManager;

  private constructor() {}

  public static get instance(): GraphManager {
    if (!this.#instance) {
      this.#instance = new GraphManager();
    }
    return this.#instance;
  }

  public async loadProfile(profileId: string) {
    return GraphDbManager.instance.loadProfile(profileId);
  }

  public clear() {
    GraphDbManager.instance.clear();
  }
}
