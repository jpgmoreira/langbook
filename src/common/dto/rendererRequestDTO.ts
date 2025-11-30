import type { Card } from '@common/schemas/card';
import type { Filters } from '@common/schemas/filters';
import type { Sessions } from '@common/schemas/sessions';
import type { Tags } from '@common/schemas/tags';
import type { Profile, ProfileRegistry } from '@common/schemas/profile';

/**
 * A generic DTO to represent application data sent to the renderer.
 */
export type RendererRequestDTO = {
  profile?: Profile;
  profileRegistry?: ProfileRegistry;
  card?: Card;
  tags?: Tags;
  sessions?: Sessions;
  filters?: Filters;
  page?: Card[];
  anchor?: number;
  height?: number;
};

export function getEmptyRendererRequestDTO(): RendererRequestDTO {
  return {};
}
