import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiCommonResponses() {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description: 'Bad request or invalid parameters.',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized or invalid token.' }),
    ApiResponse({
      status: 403,
      description: 'Forbidden: insufficient permissions.',
    }),
    ApiResponse({ status: 500, description: 'Internal server error.' }),
  );
}
