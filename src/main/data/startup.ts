import { RendererResponseDTO } from '@common/dto/rendererResponseDTO';
import { ProfileManager } from './managers/profileManager';
import { TagsManager } from './managers/tagsManager';
import { getEmptyFilters } from '@common/schemas/filters';
import { FiltersManager } from './managers/filtersManager';
import { SessionsManager } from './managers/sessionsManager';
import { TreeManager } from './managers/treeManager';
import { DbManager } from './managers/dbManager';
import { CardsManager } from './managers/cardsManager';

export async function loadStartupData(): Promise<RendererResponseDTO> {
  const profile = ProfileManager.instance.getCurrProfile();
  const profileRegistry = ProfileManager.instance.getProfileRegistry();
  const data: RendererResponseDTO = {
    profile,
    profileRegistry,
    tags: {},
    filters: getEmptyFilters(),
    sessions: {},
    page: [],
    height: 0,
  };
  if (profile) {
    // The order of initialization below is extremely important.
    TagsManager.instance.loadProfile(profile.id);
    FiltersManager.instance.loadProfile(profile.id);
    SessionsManager.instance.loadProfile(profile.id);
    TreeManager.instance.loadTree(profile.id);
    await DbManager.instance.loadProfile(profile.id);
    await CardsManager.instance.loadFromDb();
    const { page, height } = CardsManager.instance.getPage(0);
    data.page = page;
    data.height = height;
    data.tags = TagsManager.instance.getTags();
    data.filters = FiltersManager.instance.getFilters();
    data.sessions = SessionsManager.instance.getSessions();
  }
  return data;
}
