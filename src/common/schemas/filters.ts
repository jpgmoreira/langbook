export type TagsMode = 'all' | 'any';

export type Filters = {
  text: string;
  tags: string[];
  tagsMode: TagsMode;
  frequencies: number[];
};

export function getEmptyFilters(): Filters {
  return {
    text: '',
    tags: [],
    tagsMode: 'all',
    frequencies: [],
  };
}
