import { StartupData } from '@common/schemas/startup';
import { ProfileManager } from './managers/profileManager';
import { Tags } from '@common/schemas/tags';
import { TagsManager } from './managers/tagsManager';
import { Filters, getEmptyFilters } from '@common/schemas/filters';
import { FiltersManager } from './managers/filtersManager';

export async function loadStartupData(): Promise<StartupData> {
  const currProfile = ProfileManager.instance.getCurrProfile();
  const profileRegistry = ProfileManager.instance.getProfileRegistry();
  let tags: Tags = {};
  let filters: Filters = getEmptyFilters();
  if (currProfile) {
    TagsManager.instance.loadProfile(currProfile.id);
    FiltersManager.instance.loadProfile(currProfile.id);
    tags = TagsManager.instance.getTags();
    filters = FiltersManager.instance.getFilters();
  }
  const result: StartupData = {
    currProfile,
    profileRegistry,
    tags,
    filters,
  };
  return result;
}
