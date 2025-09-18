export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

export function successResponse<T>(data: T, message = 'Success'): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

// 注意：在 NestJS 中，错误响应通常通过抛出异常来处理，
// 所以我们很少会直接调用 errorResponse。但定义出来有备无患。
export function errorResponse(message = 'Error', data: null = null): ApiResponse<null> {
  return {
    success: false,
    data,
    message,
  };
}
