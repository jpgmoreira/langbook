import { Profile, ProfileRegistry } from './profile';
import { Tags } from './tags';

export type StartupData = {
  currProfile: Profile | null;
  profileRegistry: ProfileRegistry;
  tags: Tags;
};
