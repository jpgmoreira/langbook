import { Card } from '@common/schemas/card';

export type GetNewCardResponseDTO = {
  card: Card | null;
  nSeen: number;
};
