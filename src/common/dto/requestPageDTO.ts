import { Card } from '@common/schemas/card';

export type RequestPageDTO = {
  page: Card[];
  anchor: number;
  height: number;
};

export function getEmptyRequestPageDTO(): RequestPageDTO {
  return {
    page: [],
    anchor: 0,
    height: 0,
  };
}
