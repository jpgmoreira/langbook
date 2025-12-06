/**
 * Places where the refresh operation can be performed in the renderer.
 * Notice that not all information is sent on every update to the renderer,
 *   so besides checking the "where" field to perform an operation in the right place,
 *   you should also check the properties of the data sent when doing the update.
 */

export enum RefreshPlace {
  EDITOR_PAGE,
  HOME_PAGE,
  FLASHCARDS_PAGE,
  FILTERS_STORE,
  PROFILE_STORE,
}
