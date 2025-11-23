import { Card } from '@common/schemas/card';
import { Sessions } from '@common/schemas/sessions';
import { Tags } from '@common/schemas/tags';

export type EditorPageDTO = {
  card: Card | null;
  tags: Tags;
  sessions: Sessions;
};

export function getEmptyEditorPageDTO(): EditorPageDTO {
  return {
    card: null,
    tags: {},
    sessions: {},
  };
}
