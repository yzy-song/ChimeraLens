import { ConflictException, Injectable, UnauthorizedException, Inject, Scope } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user-dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { FirebaseAdminService } from 'src/common/firebase/firebase-admin.service';
import { addMinutes } from 'date-fns';
import { User as UserModel } from '@chimeralens/db';
@Injectable({ scope: Scope.REQUEST })
export class AuthService {
  private readonly logger = new Logger(AuthService.name); // 新增

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private firebaseAdmin: FirebaseAdminService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { email, password, name } = createUserDto;
    this.logger.log(`注册请求: email=${email}`);

    const existingRegisteredUser = await this.prisma.user.findFirst({
      where: { email, isGuest: false },
    });
    if (existingRegisteredUser) {
      throw new ConflictException('Email is already registered');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const guestId = this.request.headers['x-guest-id'] as string;
    const userToUpgrade = guestId ? await this.prisma.user.findUnique({ where: { guestId } }) : null;

    let finalUser: UserModel;
    if (userToUpgrade) {
      this.logger.log(`升级游客账户: guestId=${guestId}, newEmail=${email}`);
      finalUser = await this.prisma.user.update({
        where: { id: userToUpgrade.id },
        data: {
          email,
          password: hashedPassword,
          name: name || userToUpgrade.name,
          isGuest: false,
          guestId: null,
        },
      });
    } else {
      this.logger.log(`创建全新注册用户: email=${email}`);
      finalUser = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          isGuest: false,
          credits: 10,
        },
      });
    }

    this.logger.log(`注册/升级成功: userId=${finalUser.id}, email=${email}`);
    return this._createToken(finalUser);
  }

  async login(loginUserDto: any) {
    const { email, password } = loginUserDto;
    this.logger.log(`登录请求: email=${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      this.logger.warn(`登录失败: email=${email}`);
      throw new UnauthorizedException('Email or password is incorrect');
    }

    this.logger.log(`登录成功: userId=${user.id}, email=${email}`);
    return this._createToken(user);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    this.logger.log(`忘记密码请求: email=${email}`);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(`忘记密码，用户不存在: email=${email}`);
      return { message: 'You will receive a reset email if the email address is valid.' };
    }

    const resetToken = randomBytes(32).toString('hex');
    const passwordResetToken = createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = addMinutes(new Date(), 15);

    await this.prisma.user.update({
      where: { email },
      data: { passwordResetToken, passwordResetExpires },
    });

    return { message: 'You will receive a reset email if the email address is valid.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, password } = resetPasswordDto;
    this.logger.log(`重置密码请求`);

    const hashedToken = createHash('sha256').update(token).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      this.logger.warn('重置密码失败，token无效或已过期');
      throw new UnauthorizedException('Password reset token is invalid or has expired');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    this.logger.log(`密码重置成功: userId=${user.id}`);
    return { message: 'Password reset successfully' };
  }

  async firebaseLogin(idToken: string) {
    this.logger.log('Firebase 登录请求');
    try {
      const decodedToken = await this.firebaseAdmin.auth.verifyIdToken(idToken);
      const { email, name } = decodedToken;

      if (!email) {
        throw new UnauthorizedException('Firebase token is missing email.');
      }
      this.logger.log(`Firebase token 验证成功: email=${email}`);

      // 1. 优先查找是否已存在该 email 的正式用户
      let user = await this.prisma.user.findUnique({ where: { email } });

      if (user) {
        // 如果用户已存在且是正式用户，直接登录
        if (!user.isGuest) {
          this.logger.log(`Firebase 登录成功: 已存在的正式用户, email=${email}`);
          return this._createToken(user);
        }
      }

      // 2. 如果不存在正式用户，再检查是否有可升级的游客
      const guestId = this.request.headers['x-guest-id'] as string;
      const guestUser = guestId ? await this.prisma.user.findUnique({ where: { guestId } }) : null;

      if (guestUser) {
        // 升级游客账户
        this.logger.log(`升级游客账户: guestId=${guestId}, with firebaseEmail=${email}`);
        user = await this.prisma.user.update({
          where: { id: guestUser.id },
          data: { email, name: name || guestUser.name, isGuest: false, guestId: null },
        });
        return this._createToken(user);
      }

      // 3. 如果以上情况都不是，创建一个全新的用户
      this.logger.log(`创建全新 Firebase 用户: email=${email}`);
      const randomPassword = randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = await this.prisma.user.create({
        data: {
          email,
          name: name || 'Firebase User',
          password: hashedPassword,
          isGuest: false,
          credits: 10,
        },
      });

      return this._createToken(user);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Firebase 登录失败', error.stack ?? error.message);
      } else {
        this.logger.error('Firebase 登录失败', String(error));
      }
      if (error instanceof UnauthorizedException || error instanceof ConflictException) throw error;
      throw new UnauthorizedException('Invalid Firebase token or login failed.');
    }
  }

  private async _createToken(user: UserModel) {
    this.logger.log(`生成 JWT token: userId=${user.id}, email=${user.email}`);
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      access_token: accessToken,
    };
  }
}
