import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User as UserModel } from '@chimeralens/db';

export const User = createParamDecorator((data: keyof UserModel, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  return data ? user?.[data] : user;
});
