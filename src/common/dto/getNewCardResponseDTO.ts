import { Card } from '@common/schemas/card';

export type GetNewCardResponseDTO = {
  card: Card | null;
  nSeen: number; // I need to return this, because only the back knows this information. Think of repeated cards.
};
