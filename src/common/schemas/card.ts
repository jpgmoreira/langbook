import { deepFreeze } from '@common/utils/utils';

export type MediaFile = {
  name: string;
  type: string; // Mime type.
  path: string;
};

export const REVIEW_STATUS = Object.freeze(['normal', 'review', 'suspended'] as const);

export type ReviewStatus = (typeof REVIEW_STATUS)[number];

export const CARD_STAGES = Object.freeze([0, 1, 2, 3, 4, 5] as const);

export type CardStage = (typeof CARD_STAGES)[number];

export const STATUS_OPTIONS = deepFreeze([
  {
    text: 'Normal',
    value: 'normal',
  },
  {
    text: 'Review',
    value: 'review',
  },
  {
    text: 'Suspended',
    value: 'suspended',
  },
] as const);

export const STAGE_OPTIONS = deepFreeze(CARD_STAGES.map((s) => ({ text: s.toString(), value: s })));

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
    stage: 0,
    height: 0,
  };
}
