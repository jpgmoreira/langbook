// "date" is a number in the format YYYYMMDD. It is calculated based on the user's local time.
export type GraphRecord = {
  date: number;
  minutesStudied: number;
};

export function getEmptyGraphRecord(date: number): GraphRecord {
  return {
    date,
    minutesStudied: 0,
  };
}
