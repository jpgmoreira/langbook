import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
import { ProfileManager } from './managers/profileManager';
import { TagsManager } from './managers/tagsManager';
import { getEmptyFilters } from '@common/schemas/filters';
import { FiltersManager } from './managers/filtersManager';
import { SessionsManager } from './managers/sessionsManager';
import { TreeManager } from './managers/treeManager';
import { CardsManager } from './managers/cards/cardsManager';
import { RefreshPlace } from '@common/types/refreshPlace';
import { DATA_DIR } from './constants';
import path from 'node:path';
import { GraphManager } from './managers/graph/graphManager';

export async function loadStartupData(): Promise<RendererResponseDTO> {
  const profile = ProfileManager.instance.getCurrProfile();
  const profileRegistry = ProfileManager.instance.getProfileRegistry();
  const data: RendererResponseDTO = {
    where: [
      RefreshPlace.HOME_PAGE,
      RefreshPlace.FILTERS_STORE,
      RefreshPlace.PROFILE_STORE,
      RefreshPlace.MEDIA_STORE,
      RefreshPlace.GRAPH_STORE,
    ],
    profile,
    profileRegistry,
    tags: {},
    sessions: {},
    hasSessions: false,
    filters: getEmptyFilters(),
    page: [],
    height: 0,
    nFiltered: 0,
    graphData: [],
  };
  if (profile) {
    // The order of initialization below is extremely important.
    TagsManager.instance.loadProfile(profile.id);
    FiltersManager.instance.loadProfile(profile.id);
    SessionsManager.instance.loadProfile(profile.id);
    TreeManager.instance.loadTree(profile.id);
    await CardsManager.instance.loadProfile(profile.id);
    const graphData = await GraphManager.instance.loadProfile(profile.id);
    const { page, height, nFiltered } = CardsManager.instance.getPage(0);
    const hasSessions = TreeManager.instance.getNFiles() > 0;
    data.mediaDir = path.join(DATA_DIR, 'profileData', profile.id, 'media');
    data.tags = TagsManager.instance.getTags();
    data.sessions = SessionsManager.instance.getSessions();
    data.hasSessions = hasSessions;
    data.filters = FiltersManager.instance.getFilters();
    data.page = page;
    data.height = height;
    data.nFiltered = nFiltered;
    data.graphData = graphData;
  }
  return data;
}
