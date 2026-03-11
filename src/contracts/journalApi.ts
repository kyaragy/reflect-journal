import type {
  Card,
  CreateCardInput,
  Day,
  MonthRecord,
  WeeklySummary,
} from '../domain/journal';

export type ApiValidationErrorCode = 'INVALID_DATE' | 'INVALID_WEEK_KEY' | 'INVALID_MONTH_KEY' | 'INVALID_CARD_ID';

export type ApiErrorResponse = {
  error: {
    code: ApiValidationErrorCode | 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR';
    message: string;
    details?: Record<string, string>;
  };
};

export type ApiSuccessResponse<T> = {
  data: T;
  meta?: {
    requestId?: string;
  };
};

export type GetDayResponse = ApiSuccessResponse<Day | null>;
export type PutDayRequest = Day;
export type PutDayResponse = ApiSuccessResponse<Day>;
export type PutDaySummaryRequest = { dailySummary: string };
export type PutDaySummaryResponse = ApiSuccessResponse<Day>;

export type PostCardRequest = CreateCardInput;
export type PostCardResponse = ApiSuccessResponse<Card>;
export type PutCardRequest = Partial<CreateCardInput>;
export type PutCardResponse = ApiSuccessResponse<Card>;
export type DeleteCardResponse = ApiSuccessResponse<{ deleted: true }>;

export type GetWeekResponse = ApiSuccessResponse<{
  weekKey: string;
  summary?: WeeklySummary;
  days: Day[];
}>;
export type PutWeekSummaryRequest = { summary: string };
export type PutWeekSummaryResponse = GetWeekResponse;

export type GetMonthResponse = ApiSuccessResponse<MonthRecord>;
export type PutMonthSummaryRequest = { summary: string };
export type PutMonthSummaryResponse = GetMonthResponse;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

const isValidDate = (value: string) => DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

export const assertDateString = (date: string) => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date: expected YYYY-MM-DD');
  }
};

export const assertWeekKey = (weekKey: string) => {
  if (!isValidDate(weekKey)) {
    throw new Error('Invalid weekKey: expected YYYY-MM-DD');
  }
};

export const assertMonthKey = (monthKey: string) => {
  if (!MONTH_PATTERN.test(monthKey)) {
    throw new Error('Invalid monthKey: expected YYYY-MM');
  }
};

export const assertCardId = (cardId: string) => {
  if (!cardId.trim()) {
    throw new Error('Invalid cardId: expected non-empty string');
  }
};

export const journalApiPaths = {
  day: (date: string) => `/days/${date}`,
  daySummary: (date: string) => `/days/${date}/summary`,
  dayCards: (date: string) => `/days/${date}/cards`,
  dayCard: (date: string, cardId: string) => `/days/${date}/cards/${cardId}`,
  week: (weekKey: string) => `/weeks/${weekKey}`,
  weekSummary: (weekKey: string) => `/weeks/${weekKey}/summary`,
  month: (monthKey: string) => `/months/${monthKey}`,
  monthSummary: (monthKey: string) => `/months/${monthKey}/summary`,
} as const;
