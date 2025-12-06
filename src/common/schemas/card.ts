export type MediaFile = {
  name: string;
  type: string; // Mime type.
  path: string;
};

export type ReviewStatus = 'normal' | 'review' | 'suspended';

export type CardStage = 0 | 1 | 2 | 3 | 4 | 5;

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
  status: ReviewStatus;
  stage: CardStage;
  // UI properties stored in the database:
  height: number; // Needed for virtualization.
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
    status: 'normal',
    stage: 5,
    height: 0,
  };
}
