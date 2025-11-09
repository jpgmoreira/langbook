export type Session = {
  name: string;
  count: number;
  createdAt: number;
};

export type Sessions = Record<string, Session>;
