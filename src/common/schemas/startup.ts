import { RendererRequestDTO } from '@common/dto/rendererRequestDTO';
import { Profile, ProfileRegistry } from './profile';

export type StartupData = RendererRequestDTO & {
  currProfile: Profile | null;
  profileRegistry: ProfileRegistry;
};
