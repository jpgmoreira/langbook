import { Card } from '@common/schemas/card';
import { Filters } from '@common/schemas/filters';
import { Sessions } from '@common/schemas/sessions';
import { Tags } from '@common/schemas/tags';

/**
 * A generic DTO to represent application data sent to the renderer.
 */
export type RendererRequestDTO = {
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
