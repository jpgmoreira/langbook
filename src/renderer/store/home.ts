import { defineStore } from 'pinia';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@renderer/events/events';
import { RefreshPlace } from '@common/types/refreshPlace';
import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
import { Card, MediaFile } from '@common/schemas/card';
import { Tags } from '@common/schemas/tags';

/**
 * I need this Pinia store because all the data from the HomePage element is thrown
 * away when we navigate to another page.
 */

EventEmitter.instance.on(Events.refreshData, (data: RendererResponseDTO) => {
  const store = useHomePageStore();
  if (data.where.includes(RefreshPlace.HOME_PAGE_HAS_SESSIONS)) {
    store.setHasSessions(data.hasSessions!);
  }
  if (data.where.includes(RefreshPlace.HOME_PAGE)) {
    store.refreshData(data);
  }
  if (data.where.includes(RefreshPlace.HOME_PAGE_NEW_PAGE)) {
    store.refreshNewPage(data);
  }
});

EventEmitter.instance.on(Events.clearProfileData, () => {
  useHomePageStore().clear();
});

export const useHomePageStore = defineStore('home', {
  state: () => ({
    // ---- DATA ----
    hasSessions: false,
    page: [] as Card[],
    height: 0,
    nFiltered: 0,
    selectedMedia: undefined as MediaFile | undefined,
    allTags: {} as Tags,
    // ---- UI LAYOUT ----
    treeAreaWidth: 300,
    contestsAreaWidth: window.innerWidth - 300,
    hideFilters: false,
  }),

  actions: {
    refreshData(data: RendererResponseDTO) {
      this.refreshNewPage(data);
      this.allTags = data.tags as Tags;
      this.hasSessions = data.hasSessions as boolean;
    },
    refreshNewPage(data: RendererResponseDTO) {
      this.page = data.page as Card[];
      this.height = data.height as number;
      this.nFiltered = data.nFiltered as number;
    },
    setHasSessions(value: boolean) {
      this.hasSessions = value;
    },
    setTreeAreaWidth(px: number) {
      this.treeAreaWidth = px;
      this.contestsAreaWidth = window.innerWidth - px;
    },
    toggleHideFilters() {
      this.hideFilters = !this.hideFilters;
    },
    clear() {
      this.hasSessions = false;
      this.page = [];
      this.height = 0;
      this.nFiltered = 0;
      this.selectedMedia = undefined;
      this.allTags = {};
      this.hideFilters = false;
    },
  },
});
