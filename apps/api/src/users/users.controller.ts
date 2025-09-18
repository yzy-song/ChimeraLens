import { Controller, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@chimeralens/db';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import { User } from '../auth/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiCommonResponses } from 'src/common/decorators/api-common-responses.decorator';

@ApiTags('用户管理')
@ApiBearerAuth() // 表明需要 Bearer Token 认证
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard) // 整个模块都需要登录和角色验证
@Roles(Role.ADMIN) // 整个模块都只允许管理员访问
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: '获取所有用户信息' })
  @ApiResponse({ status: 200, description: '返回所有用户信息' })
  @ApiCommonResponses()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个用户信息' })
  @ApiResponse({ status: 200, description: '返回用户信息' })
  @ApiCommonResponses()
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
