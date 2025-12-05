export type MediaFile = {
  name: string;
  type: string; // Mime type.
  path: string;
};

export type Card = {
  id: string;
  front: string;
  back: string;
  extra: string;
  media: MediaFile[];
  allowReversed: boolean;
  createdAt: number;
  sessions: string[];
  tags: string[];
  frequency: number;
  // UI properties stored in the database:
  height: number;
  // UI properties not stored in the database:
  scrollTop?: number;
  index?: number;
};

export type DBCard = Omit<Card, 'tags' | 'sessions' | 'media'> & {
  tags: string;
  sessions: string;
  media: string;
};

export function getEmptyCard(id: string, timestamp: number): Card {
  return {
    id,
    front: '',
    back: '',
    extra: '',
    media: [],
    allowReversed: false,
    createdAt: timestamp,
    sessions: [],
    tags: [],
    frequency: 5,
    height: 0,
  };
}
