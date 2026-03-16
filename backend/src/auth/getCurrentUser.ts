import { unauthorizedError } from '../libs/errors';
import type { ApiGatewayHttpEvent } from '../functions/api/types';

export const getCurrentUser = (event: ApiGatewayHttpEvent) => {
  const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
  if (!userId) {
    throw unauthorizedError('Missing JWT subject claim');
  }

  return {
    userId,
  };
};
