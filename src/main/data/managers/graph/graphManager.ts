import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@main/events/events';
import { GraphDbManager } from './graphDbManager';
import { WindowManager } from '../windowManager';

EventEmitter.instance.on(Events.clearProfileData, () => {
  GraphManager.instance.clear();
});

/**
 * Singleton for managing the graph.
 * Access via GraphManager.instance
 */
export class GraphManager {
  static #instance: GraphManager;

  private timer: ReturnType<typeof setInterval> | undefined = undefined;

  private constructor() {}

  public static get instance(): GraphManager {
    if (!this.#instance) {
      this.#instance = new GraphManager();
    }
    return this.#instance;
  }

  public async loadProfile(profileId: string) {
    this.timer = setInterval(async () => {
      const record = await GraphDbManager.instance.incrementTodayRecord();
      WindowManager.instance.graphRecordIncremented(record);
    }, 3000);
    return GraphDbManager.instance.loadProfile(profileId);
  }

  public clear() {
    clearInterval(this.timer);
    GraphDbManager.instance.clear();
  }
}
