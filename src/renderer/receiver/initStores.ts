import { RefreshPlace } from '@common/types/refreshPlace';
import { useFiltersStore } from '@renderer/store/filters';
import { useGraphStore } from '@renderer/store/graph';
import { useMediaStore } from '@renderer/store/media';
import { useProfileStore } from '@renderer/store/profile';

/**
 * Initializes stores that react to events.
 */
export function initStores(where: RefreshPlace[]) {
  if (where.includes(RefreshPlace.FILTERS_STORE)) {
    useFiltersStore();
  }
  if (
    where.includes(RefreshPlace.PROFILE_STORE) ||
    where.includes(RefreshPlace.PROFILE_STORE_REGISTRY)
  ) {
    useProfileStore();
  }
  if (where.includes(RefreshPlace.GRAPH_STORE)) {
    useGraphStore();
  }
  if (where.includes(RefreshPlace.MEDIA_STORE)) {
    useMediaStore();
  }
}
