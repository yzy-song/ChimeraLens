// apps/api/src/auth/guards/jwt-optional.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtOptionalGuard extends AuthGuard('jwt') {
  // 我们重写 canActivate 方法，而不是 handleRequest
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    // 如果请求头里根本没有 Authorization，说明肯定是游客，直接放行
    // GuestMiddleware 已经处理了游客信息
    if (!request.headers.authorization) {
      return true;
    }

    // 如果有 Authorization 头，我们尝试像正常的 AuthGuard 一样去激活
    // 但我们会把它包在一个 Promise 里，并且自己处理错误
    return this.activate(context);
  }

  private async activate(context: ExecutionContext): Promise<boolean> {
    try {
      // 尝试调用父类的 canActivate，它会在成功时返回 true 并附加 user 到 request
      // 如果 token 无效，它会抛出 UnauthorizedException
      return (await super.canActivate(context)) as boolean;
    } catch (error) {
      // 如果父类的 canActivate 抛出错误（例如 token 过期或无效）
      // 我们在这里捕获这个错误，然后什么都不做，直接返回 true 放行。
      // 这样，请求会继续处理，而 req.user 依然是 GuestMiddleware 设置的那个游客对象。
      return true;
    }
  }
}
