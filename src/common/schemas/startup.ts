import { Filters } from './filters';
import { Profile, ProfileRegistry } from './profile';
import { Sessions } from './sessions';
import { Tags } from './tags';

export type StartupData = {
  currProfile: Profile | null;
  profileRegistry: ProfileRegistry;
  tags: Tags;
  filters: Filters;
  sessions: Sessions;
};
