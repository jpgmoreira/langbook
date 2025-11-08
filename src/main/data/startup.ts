import { StartupData } from '@common/schemas/startup';
import { ProfileManager } from './managers/profileManager';

export async function loadStartupData(): Promise<StartupData> {
  const currProfile = ProfileManager.instance.getCurrProfile();
  const profileRegistry = ProfileManager.instance.getProfileRegistry();
  const result: StartupData = {
    currProfile,
    profileRegistry,
  };
  return result;
}
