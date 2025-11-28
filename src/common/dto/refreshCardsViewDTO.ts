import { Card } from '@common/schemas/card';

export type RefreshCardsViewDTO = {
  page: Card[];
  anchor: number;
  height: number;
};
