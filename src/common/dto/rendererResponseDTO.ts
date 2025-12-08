import type { Card } from '@common/schemas/card';
import type { Filters } from '@common/schemas/filters';
import type { Sessions } from '@common/schemas/sessions';
import type { Tags } from '@common/schemas/tags';
import type { Profile, ProfileRegistry } from '@common/schemas/profile';
import { RefreshPlace } from '@common/types/refreshPlace';
import { GraphRecord } from '@common/schemas/graph';

/**
 * A generic DTO to represent application data sent to the renderer.
 */
export type RendererResponseDTO = {
  where: RefreshPlace[];
  profile?: Profile | null;
  profileRegistry?: ProfileRegistry;
  mediaDir?: string;
  card?: Card | null;
  tags?: Tags;
  sessions?: Sessions;
  hasSessions?: boolean;
  filters?: Filters;
  page?: Card[];
  height?: number; // Sum of the height of all filtered cards.
  nFiltered?: number;
  nFilteredSuspended?: number;
  nFilteredReview?: number;
  nSeen?: number;
  graphData?: GraphRecord[];
};
