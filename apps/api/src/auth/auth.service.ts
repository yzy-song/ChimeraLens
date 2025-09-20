import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  Inject,
  Scope,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmailService } from 'src/email/email.service';
@Injectable({ scope: Scope.REQUEST })
export class AuthService {
  private readonly logger = new Logger(AuthService.name); // 新增

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private firebaseAdmin: FirebaseAdminService,
    private emailService: EmailService,
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

    // If the user has no password set (e.g., signed up with Google), they can't log in with a password.
    if (!user.password) {
      this.logger.warn(`Login failed: Password not set for email=${email}. Suggesting social login.`);
      throw new UnauthorizedException(
        'This account was created via Google. Please sign in with Google or set a password in your account settings.',
      );
    }
    if (!(await bcrypt.compare(password, user.password))) {
      this.logger.warn(`Login failed: Incorrect password for email=${email}`);
      throw new UnauthorizedException('Email or password is incorrect');
    }

    this.logger.log(`登录成功: userId=${user.id}, email=${email}`);
    return this._createToken(user);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    this.logger.log(`Forgot password request for email: ${email}`);
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      this.logger.warn(`Forgot password: User not found for email=${email}. Sending generic response.`);
      // Return a generic message to prevent email enumeration attacks.
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Do not allow password reset for users who signed up via social and haven't set a password.
    if (!user.password) {
      this.logger.warn(`Forgot password: Attempt to reset password for social-only account with email=${email}.`);
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    const resetToken = randomBytes(32).toString('hex');
    const passwordResetToken = createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = addMinutes(new Date(), 15);

    await this.prisma.user.update({
      where: { email },
      data: { passwordResetToken, passwordResetExpires },
    });

    // Send the email with the unhashed token
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    this.logger.log(`Password reset email initiated for ${email}`);
    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, password } = resetPasswordDto;
    this.logger.log(`Reset password attempt with token.`);

    const hashedToken = createHash('sha256').update(token).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gte: new Date() },
      },
    });

    if (!user) {
      this.logger.warn('Reset password failed: token is invalid or has expired.');
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

    this.logger.log(`Password reset successful for userId: ${user.id}`);
    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    this.logger.log(`Change password attempt for userId: ${userId}`);
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If the user has an existing password, verify the current one.
    if (user.password) {
      if (!currentPassword) {
        throw new BadRequestException('Current password is required.');
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        this.logger.warn(`Change password failed for userId ${userId}: Incorrect current password.`);
        throw new UnauthorizedException('Incorrect current password.');
      }
    }
    // If user.password is null (first time setting), we skip the check.

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    this.logger.log(`Password successfully updated for userId: ${userId}`);
    return { message: 'Password updated successfully.' };
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
