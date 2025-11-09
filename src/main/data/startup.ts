import { StartupData } from '@common/schemas/startup';
import { ProfileManager } from './managers/profileManager';
import { Tags } from '@common/schemas/tags';
import { TagsManager } from './managers/tagsManager';

export async function loadStartupData(): Promise<StartupData> {
  const currProfile = ProfileManager.instance.getCurrProfile();
  const profileRegistry = ProfileManager.instance.getProfileRegistry();
  let tags: Tags = {};
  if (currProfile) {
    TagsManager.instance.loadProfile(currProfile.id);
    tags = TagsManager.instance.getTags();
  }
  const result: StartupData = {
    currProfile,
    profileRegistry,
    tags,
  };
  return result;
}
