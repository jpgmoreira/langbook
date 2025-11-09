import { StartupData } from '@common/schemas/startup';
import { ProfileManager } from './managers/profileManager';
import { Tags } from '@common/schemas/tags';
import { TagsManager } from './managers/tagsManager';
import { Filters, getEmptyFilters } from '@common/schemas/filters';
import { FiltersManager } from './managers/filtersManager';
import { Sessions } from '@common/schemas/sessions';
import { SessionsManager } from './managers/sessionsManager';
import { TreeManager } from './managers/treeManager';

export async function loadStartupData(): Promise<StartupData> {
  const currProfile = ProfileManager.instance.getCurrProfile();
  const profileRegistry = ProfileManager.instance.getProfileRegistry();
  let tags: Tags = {};
  let filters: Filters = getEmptyFilters();
  let sessions: Sessions = {};
  if (currProfile) {
    TagsManager.instance.loadProfile(currProfile.id);
    FiltersManager.instance.loadProfile(currProfile.id);
    SessionsManager.instance.loadProfile(currProfile.id);
    TreeManager.instance.loadTree(currProfile.id);
    tags = TagsManager.instance.getTags();
    filters = FiltersManager.instance.getFilters();
    sessions = SessionsManager.instance.getSessions();
  }
  const result: StartupData = {
    currProfile,
    profileRegistry,
    tags,
    filters,
    sessions,
  };
  return result;
}
