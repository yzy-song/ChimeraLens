import { Controller, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestWithUser } from './guest.middleware'; // 从我们之前创建的中间件导入类型

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  getProfile(@Req() req: RequestWithUser) {
    // 直接返回中间件附加的 user 对象
    // 如果 req.user 不存在 (例如前端没发送 x-guest-id)，则返回 null
    return { user: req.user || null };
  }
}
