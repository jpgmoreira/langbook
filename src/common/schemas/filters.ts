import { CardTier, CardStatus, YesOrNo } from './card';

export type TagsMode = 'all' | 'any';

export type Filters = {
  text: string;
  tags: string[];
  tagsMode: TagsMode;
  statuses: CardStatus[];
  tiers: CardTier[];
  core: YesOrNo[];
};

export function getEmptyFilters(): Filters {
  return {
    text: '',
    tags: [],
    tagsMode: 'all',
    statuses: [],
    tiers: [],
    core: [],
  };
}
