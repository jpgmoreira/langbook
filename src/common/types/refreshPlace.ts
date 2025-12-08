/**
 * Places where the refresh operation can be performed in the renderer.
 */

export enum RefreshPlace {
  // Pages:
  EDITOR_PAGE,
  HOME_PAGE,
  HOME_PAGE_HAS_SESSIONS,
  HOME_PAGE_NEW_PAGE,
  FLASHCARDS_PAGE_INIT,
  FLASHCARDS_PAGE_UPDATE,
  FLASHCARDS_PAGE_CARD_DELETED,
  // Stores:
  FILTERS_STORE,
  PROFILE_STORE,
  MEDIA_STORE,
  PROFILE_STORE_REGISTRY,
  GRAPH_STORE,
}
