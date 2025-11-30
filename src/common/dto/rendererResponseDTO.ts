import type { Card } from '@common/schemas/card';
import type { Filters } from '@common/schemas/filters';
import type { Sessions } from '@common/schemas/sessions';
import type { Tags } from '@common/schemas/tags';
import type { Profile, ProfileRegistry } from '@common/schemas/profile';

/**
 * A generic DTO to represent application data sent to the renderer.
 */
export type RendererResponseDTO = Partial<{
  profile: Profile | null;
  profileRegistry: ProfileRegistry;
  card: Card | null;
  tags: Tags;
  sessions: Sessions;
  hasSessions: boolean;
  filters: Filters;
  page: Card[];
  anchor: number;
  height: number;
}>;
