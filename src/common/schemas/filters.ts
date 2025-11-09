export type Filters = {
  text: string;
  tags: string[];
  frequencies: number[];
};

export function getEmptyFilters(): Filters {
  return {
    text: '',
    tags: [],
    frequencies: [],
  };
}
