export interface ApiErrorOptions {
  statusCode: number;
  code: string;
}

export function codedError(message: string, opts: ApiErrorOptions): Error & ApiErrorOptions {
  return Object.assign(new Error(message), opts);
}

export function isCodedError(error: unknown): error is Error & ApiErrorOptions {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { statusCode?: unknown }).statusCode === 'number' &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

export const Errors = {
  notFound: (msg = 'Not found', code = 'NOT_FOUND') => codedError(msg, { statusCode: 404, code }),
  gymNotFound: () => codedError('Gym not found', { statusCode: 404, code: 'GYM_NOT_FOUND' }),
  forbidden: (msg = 'Forbidden') => codedError(msg, { statusCode: 403, code: 'FORBIDDEN' }),
  unauthorized: (msg = 'Authentication required') => codedError(msg, { statusCode: 401, code: 'UNAUTHORIZED' }),
  conflict: (msg: string, code = 'CONFLICT') => codedError(msg, { statusCode: 409, code }),
  validation: (msg: string) => codedError(msg, { statusCode: 400, code: 'VALIDATION_ERROR' }),
  badRequest: (msg: string, code = 'BAD_REQUEST') => codedError(msg, { statusCode: 400, code }),
};
