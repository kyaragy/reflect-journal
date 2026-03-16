import type { ApiErrorResponse, ApiSuccessResponse } from '../../../src/contracts/journalApi';
import { toAppError } from './errors';
import type { ApiGatewayHttpResponse } from '../functions/api/types';

const corsHeaders = () => ({
  'access-control-allow-origin': process.env.CORS_ALLOW_ORIGIN ?? '*',
  'access-control-allow-methods': 'GET,PUT,POST,DELETE,OPTIONS',
  'access-control-allow-headers': 'Content-Type, Authorization',
});

export const success = <T>(data: T, requestId?: string): ApiGatewayHttpResponse => {
  const body: ApiSuccessResponse<T> = {
    data,
    meta: requestId ? { requestId } : undefined,
  };

  return {
    statusCode: 200,
    headers: {
      ...corsHeaders(),
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  };
};

export const noContent = (): ApiGatewayHttpResponse => ({
  statusCode: 204,
  headers: corsHeaders(),
  body: '',
});

export const errorResponse = (error: unknown, requestId?: string): ApiGatewayHttpResponse => {
  const appError = toAppError(error);
  const body: ApiErrorResponse = {
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details,
    },
  };

  return {
    statusCode: appError.statusCode,
    headers: {
      ...corsHeaders(),
      'content-type': 'application/json; charset=utf-8',
      ...(requestId ? { 'x-request-id': requestId } : {}),
    },
    body: JSON.stringify(body),
  };
};
