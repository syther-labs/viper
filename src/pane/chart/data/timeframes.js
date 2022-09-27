export const MILLISECOND = 1;
export const MILLISECOND100 = MILLISECOND * 100;
export const SECOND = MILLISECOND * 1000;
export const MINUTE = SECOND * 60;
export const MINUTE5 = MINUTE * 5;
export const MINUTE15 = MINUTE * 15;
export const HOUR = MINUTE * 60;
export const HOUR4 = HOUR * 4;
export const HOUR12 = HOUR * 12;
export const DAY = HOUR * 24;
export const WEEK = DAY * 7;
export const MONTH = WEEK * 4;
export const YEAR = DAY * 365;

export const TIMESCALES = [
  YEAR * 10,
  YEAR * 5,
  YEAR * 3,
  YEAR * 2,
  YEAR,
  MONTH * 6,
  MONTH * 4,
  MONTH * 3,
  MONTH * 2,
  MONTH,
  DAY * 15,
  DAY * 10,
  DAY * 7,
  DAY * 5,
  DAY * 3,
  DAY * 2,
  DAY,
  HOUR * 12,
  HOUR * 6,
  HOUR * 4,
  HOUR * 2,
  HOUR,
  MINUTE * 30,
  MINUTE * 15,
  MINUTE * 10,
  MINUTE * 5,
  MINUTE * 2,
  MINUTE,
  SECOND * 30,
  SECOND * 15,
  SECOND * 10,
  SECOND * 5,
  SECOND * 2,
  SECOND,
  MILLISECOND * 500,
  MILLISECOND * 250,
  MILLISECOND * 100,
  MILLISECOND * 50,
  MILLISECOND,
];

export const TIMEFRAMES = {
  ms: MILLISECOND,
  s: SECOND,
  m: MINUTE,
  h: HOUR,
  d: DAY,
  w: WEEK,
  mo: MONTH,
  y: YEAR,
};

export const MONTHS = [
  {
    short: "Jan",
    long: "January",
  },
  {
    short: "Feb",
    long: "February",
  },
  {
    short: "Mar",
    long: "March",
  },
  {
    short: "Apr",
    long: "April",
  },
  {
    short: "May",
    long: "May",
  },
  {
    short: "Jun",
    long: "June",
  },
  {
    short: "Jul",
    long: "July",
  },
  {
    short: "Aug",
    long: "August",
  },
  {
    short: "Sep",
    long: "September",
  },
  {
    short: "Oct",
    long: "October",
  },
  {
    short: "Nov",
    long: "November",
  },
  {
    short: "Dec",
    long: "December",
  },
];

export function getTimeframeText(timeframe) {
  const keys = Object.keys(TIMEFRAMES);
  for (let i = 0; i < keys.length; i++) {
    if (timeframe / TIMEFRAMES[keys[i]] < 1) {
      const key = keys[i - 1];
      return `${timeframe / TIMEFRAMES[key]}${key}`;
    }
  }
}
