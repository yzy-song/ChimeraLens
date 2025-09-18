import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// 定义我们期望的API响应结构
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: any; // 为分页数据添加 meta 字段
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // 👇 --- 智能逻辑判断 --- 👇
        // 如果 data 是一个分页对象 (我们通过检查它是否有 meta 和 data 属性来判断)
        if (data && data.meta && Array.isArray(data.data)) {
          return {
            success: true,
            message: 'Success',
            data: data.data, // 只取分页对象中的 data 数组
            meta: data.meta, // 将分页 meta 信息提升到顶层
          };
        }

        // 否则，当它是一个普通对象时，按常规方式包装
        return {
          success: true,
          message: 'Success',
          data: data,
        };
      }),
    );
  }
}
