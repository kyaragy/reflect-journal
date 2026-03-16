import { createDataApiClientFromEnv } from '../../db/dataApiClient';
import { DataApiJournalRepository } from '../../repositories/journalRepository';
import { routeRequest } from '../../routes';
import { errorResponse } from '../../libs/response';
import { JournalService } from '../../services/journalService';
import type { ApiGatewayHttpEvent, ApiGatewayHttpResponse } from './types';

const createJournalService = () => {
  const repository = new DataApiJournalRepository(createDataApiClientFromEnv());
  return new JournalService(repository);
};

let sharedJournalService: JournalService | null = null;

const getJournalService = () => {
  if (!sharedJournalService) {
    sharedJournalService = createJournalService();
  }

  return sharedJournalService;
};

export const createHandler = (journalService: JournalService) => {
  return async (event: ApiGatewayHttpEvent): Promise<ApiGatewayHttpResponse> => {
    try {
      return await routeRequest(event, { journalService });
    } catch (error) {
      return errorResponse(error, event.requestContext.requestId);
    }
  };
};

export const handler = async (event: ApiGatewayHttpEvent): Promise<ApiGatewayHttpResponse> =>
  createHandler(getJournalService())(event);
