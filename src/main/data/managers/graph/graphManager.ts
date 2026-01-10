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
  private isUpdating = false;

  private constructor() {}

  public static get instance(): GraphManager {
    if (!this.#instance) {
      this.#instance = new GraphManager();
    }
    return this.#instance;
  }

  public async loadProfile(profileId: string) {
    const records = await GraphDbManager.instance.loadProfile(profileId);
    const oneMinute = 60_000;
    let lastUpdated = Date.now();
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(async () => {
      if (this.isUpdating) return;
      const now = Date.now();
      const minutesPassed = Math.floor((now - lastUpdated) / oneMinute);
      if (minutesPassed <= 0) return;
      lastUpdated = now;
      this.isUpdating = true;
      try {
        const record = await GraphDbManager.instance.incrementTodayRecord(minutesPassed);
        WindowManager.instance.graphRecordUpdated(record);
      } finally {
        this.isUpdating = false;
      }
    }, oneMinute);
    return records;
  }

  public clear() {
    clearInterval(this.timer);
    GraphDbManager.instance.clear();
  }
}
