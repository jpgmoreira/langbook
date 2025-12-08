import { GraphRecord } from '@common/schemas/graph';
import { defineStore } from 'pinia';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';
import { RefreshPlace } from '@common/types/refreshPlace';
import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';

/**
 * I need to use this pinia store for the graph because the graph page is not initialized
 * when the application starts, so it cannot react to events.
 */

EventEmitter.instance.on(Events.refreshData, (data: RendererResponseDTO) => {
  if (data.where.includes(RefreshPlace.GRAPH_STORE)) {
    useGraphStore().init(data.graphData!);
  }
});

EventEmitter.instance.on(Events.clearProfileData, () => {
  useGraphStore().clear();
});

export const useGraphStore = defineStore('graph', {
  state: () => ({
    records: [] as GraphRecord[],
  }),
  actions: {
    init(records: GraphRecord[]) {
      this.records = records;
    },
    clear() {
      this.records = [];
    },
  },
});
