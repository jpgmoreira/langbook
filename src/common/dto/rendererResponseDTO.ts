import type { Card } from '@common/schemas/card';
import type { Filters } from '@common/schemas/filters';
import type { Sessions } from '@common/schemas/sessions';
import type { Tags } from '@common/schemas/tags';
import type { Profile, ProfileRegistry } from '@common/schemas/profile';
import { RefreshPlace } from '@common/types/refreshPlace';

/**
 * A generic DTO to represent application data sent to the renderer.
 * Notice that not all fields will always be sent to a specific update
 *  target in the renderer process, so the renderer must check if the
 *  field is contained in the payload before using it for an update.
 */
export type RendererResponseDTO = {
  where: RefreshPlace[];
  profile?: Profile | null;
  profileRegistry?: ProfileRegistry;
  card?: Card | null;
  tags?: Tags;
  sessions?: Sessions;
  hasSessions?: boolean;
  filters?: Filters;
  page?: Card[];
  anchor?: number;
  height?: number;
};
