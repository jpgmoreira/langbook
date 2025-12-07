import { CardStage, ReviewStatus } from './card';

export type TagsMode = 'all' | 'any';

export type Filters = {
  text: string;
  tags: string[];
  tagsMode: TagsMode;
  status: ReviewStatus[];
  stages: CardStage[];
};

export function getEmptyFilters(): Filters {
  return {
    text: '',
    tags: [],
    tagsMode: 'all',
    status: [],
    stages: [],
  };
}
