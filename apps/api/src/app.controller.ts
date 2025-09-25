import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { RequestWithUser } from './auth/guest.middleware'; // <-- 导入

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Req() req: RequestWithUser): any {
    // 如果中间件成功运行，这里应该能看到 user 对象
    return req.user || { message: 'No user found, guestId header may be missing.' };
  }

  @Get('health')
  healthCheck() {
    return { status: 'ok' };
  }
}
