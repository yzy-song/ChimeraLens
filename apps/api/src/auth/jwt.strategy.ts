import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // 1. 先从 ConfigService 获取密钥
    const secret = configService.get<string>('JWT_SECRET');

    // 2. 检查密钥是否存在，如果不存在则抛出错误，使应用启动失败
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in the environment variables');
    }

    // 3. 确认密钥存在后，再将其传入 super()
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret, // <-- 此处 secret 的类型被 TypeScript 推断为明确的 string
    });
  }

  // 4. Passport 在验证 Token 签名有效后，会调用这个方法
  //    payload 是 Token 解码后的 JSON 对象
  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('无效的令牌');
    }

    // 1. Determine if the user has a password.
    const hasPassword = !!user.password;
    // 2. Remove the password from the object for security.
    const { password, ...userWithoutPassword } = user;

    // 3. Return the user object WITH the correct `hasPassword` field.
    // This object is what gets attached to the request as `req.user`.
    return { ...userWithoutPassword, hasPassword };
  }
}
