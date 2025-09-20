import { Body, Controller, Post, UseGuards, Get, Req, Patch, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user-dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

import { RequestWithUser } from './guest.middleware';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiCommonResponses } from 'src/common/decorators/api-common-responses.decorator';
import { User } from './decorators/user.decorator';
import { User as UserModel } from '@chimeralens/db';
import { FirebaseLoginDto } from './dto/firebase-login.dto';

import { JwtOptionalGuard } from './guards/jwt-optional.guard';

import { UsersService } from 'src/users/users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
@ApiTags('认证与用户管理')
@Controller('auth') // 定义这个 Controller 的路由前缀是 /auth
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '返回当前用户信息' })
  @ApiBearerAuth() // 表明这个接口可以使用 Bearer Token 认证，但不是必须的
  @ApiCommonResponses()
  @UseGuards(JwtOptionalGuard) // <-- 使用我们新的“可选守卫”
  getMe(@User() user: UserModel | null) {
    return this.usersService.getMe(user);
  }

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '用户注册成功' })
  @ApiCommonResponses()
  async register(
    @Body() createUserDto: CreateUserDto,
    @Req() req: RequestWithUser, // 确保能拿到 req
  ) {
    // 注意：由于 AuthService 是请求作用域，它能自动拿到 request，这里传不传都可以
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '用户登录成功' })
  @ApiCommonResponses()
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('profile')
  @ApiOperation({ summary: '获取用户信息' })
  @ApiResponse({ status: 200, description: '用户信息获取成功' })
  @ApiBearerAuth() // 表明需要 Bearer Token 认证
  @ApiCommonResponses()
  @UseGuards(AuthGuard('jwt')) // <-- 使用 JWT 认证守卫
  getProfile(@Req() req) {
    // req.user 是由上面的 JwtStrategy 中的 validate 方法返回的用户对象
    return req.user;
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Forgot password' })
  @ApiResponse({ status: 200, description: 'Forgot password email sent' })
  @ApiCommonResponses()
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiCommonResponses()
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('firebase-login')
  @ApiOperation({ summary: 'Login or register with Firebase' })
  @ApiResponse({ status: 200, description: 'Login or registration successful' })
  @ApiCommonResponses()
  async firebaseLogin(@Body() firebaseLoginDto: FirebaseLoginDto) {
    return this.authService.firebaseLogin(firebaseLoginDto.idToken);
  }

  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user information' })
  @ApiResponse({ status: 200, description: 'User information updated successfully' })
  @ApiCommonResponses()
  @UseGuards(AuthGuard('jwt'))
  updateProfile(@User('id') userId: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Patch('password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set or change user password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiCommonResponses()
  @UseGuards(AuthGuard('jwt'))
  changePassword(@User('id') userId: string, @Body() changePasswordDto: ChangePasswordDto) {
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    return this.authService.changePassword(userId, changePasswordDto);
  }
}
