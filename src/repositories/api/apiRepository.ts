import { createEmptyJournalSnapshot } from '../../domain/journal';
import { apiClient } from '../../lib/apiClient';
import {
  assertCardId,
  assertDateString,
  assertMonthKey,
  assertWeekKey,
  journalApiPaths,
  type DeleteCardResponse,
  type GetDayResponse,
  type GetMonthResponse,
  type GetWeekResponse,
  type PostCardRequest,
  type PostCardResponse,
  type PutCardRequest,
  type PutCardResponse,
  type PutDayRequest,
  type PutDayResponse,
  type PutDaySummaryRequest,
  type PutDaySummaryResponse,
  type PutMonthSummaryRequest,
  type PutMonthSummaryResponse,
  type PutWeekSummaryRequest,
  type PutWeekSummaryResponse,
} from '../../contracts/journalApi';
import type { JournalRepository } from '../journalRepository';

const createNotImplementedError = (methodName: string) =>
  new Error(`${methodName} is not implemented for apiRepository yet.`);

export const apiRepository: JournalRepository = {
  getState() {
    void apiClient;
    return createEmptyJournalSnapshot();
  },

  getDay(date) {
    assertDateString(date);
    void apiClient.get<GetDayResponse>;
    void journalApiPaths.day(date);
    return null;
  },

  saveDay(day) {
    assertDateString(day.date);
    void apiClient.put<PutDayResponse>;
    void ({ ...day } satisfies PutDayRequest);
    throw createNotImplementedError('saveDay');
  },

  getWeek(weekKey) {
    assertWeekKey(weekKey);
    void apiClient.get<GetWeekResponse>;
    void journalApiPaths.week(weekKey);
    return {
      weekKey,
      days: [],
    };
  },

  saveWeekSummary(weekKey, summary) {
    assertWeekKey(weekKey);
    void apiClient.put<PutWeekSummaryResponse>;
    void ({ summary } satisfies PutWeekSummaryRequest);
    void journalApiPaths.weekSummary(weekKey);
    throw createNotImplementedError('saveWeekSummary');
  },

  getMonth(monthKey) {
    assertMonthKey(monthKey);
    void apiClient.get<GetMonthResponse>;
    void journalApiPaths.month(monthKey);
    return {
      monthKey,
      days: [],
      weeklySummaries: [],
    };
  },

  saveMonthSummary(monthKey, summary) {
    assertMonthKey(monthKey);
    void apiClient.put<PutMonthSummaryResponse>;
    void ({ summary } satisfies PutMonthSummaryRequest);
    void journalApiPaths.monthSummary(monthKey);
    throw createNotImplementedError('saveMonthSummary');
  },

  getYear(yearKey) {
    return {
      yearKey,
      monthlySummaries: [],
    };
  },

  saveYearSummary() {
    throw createNotImplementedError('saveYearSummary');
  },

  createCard(date, card) {
    assertDateString(date);
    void apiClient.post<PostCardResponse>;
    void ({ ...card } satisfies PostCardRequest);
    void journalApiPaths.dayCards(date);
    throw createNotImplementedError('createCard');
  },

  updateCard(date, cardId, card) {
    assertDateString(date);
    assertCardId(cardId);
    void apiClient.put<PutCardResponse>;
    void ({ ...card } satisfies PutCardRequest);
    void journalApiPaths.dayCard(date, cardId);
    throw createNotImplementedError('updateCard');
  },

  deleteCard(date, cardId) {
    assertDateString(date);
    assertCardId(cardId);
    void apiClient.delete<DeleteCardResponse>;
    void journalApiPaths.dayCard(date, cardId);
    throw createNotImplementedError('deleteCard');
  },

  saveDailySummary(date, summary) {
    assertDateString(date);
    void apiClient.put<PutDaySummaryResponse>;
    void ({ dailySummary: summary } satisfies PutDaySummaryRequest);
    void journalApiPaths.daySummary(date);
    throw createNotImplementedError('saveDailySummary');
  },
};
