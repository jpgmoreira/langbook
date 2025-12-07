import { deepFreeze } from '@common/utils/utils';

export type MediaFile = {
  name: string;
  type: string; // Mime type.
  path: string;
};

export const CARD_STATUSES = Object.freeze(['normal', 'review', 'suspended'] as const);
export const CARD_TIERS = Object.freeze([0, 1, 2, 3, 4, 5] as const);
export const YES_OR_NO = Object.freeze(['yes', 'no'] as const);

export type CardStatus = (typeof CARD_STATUSES)[number];
export type CardTier = (typeof CARD_TIERS)[number];
export type YesOrNo = (typeof YES_OR_NO)[number];

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
export const TIER_OPTIONS = deepFreeze(CARD_TIERS.map((s) => ({ text: s.toString(), value: s })));
export const YES_OR_NO_OPTIONS = deepFreeze([
  {
    text: 'Yes',
    value: 'yes',
  },
  {
    text: 'No',
    value: 'no',
  },
] as const);

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
  status: CardStatus;
  tier: CardTier;
  core: boolean;
  // UI properties stored in the database:
  height: number; // Needed for virtualization.
  // UI properties not stored in the database:
  scrollTop?: number;
  index?: number;
  deleted?: boolean;
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
    tier: 0,
    core: false,
    height: 0,
  };
}
