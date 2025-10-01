import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@chimeralens/db';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import { User } from '../auth/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiCommonResponses } from 'src/common/decorators/api-common-responses.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('用户管理')
@ApiBearerAuth() // 表明需要 Bearer Token 认证
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard) // 整个模块都需要登录和角色验证
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '获取所有用户信息' })
  @ApiResponse({ status: 200, description: '返回所有用户信息' })
  @ApiCommonResponses()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '获取单个用户信息' })
  @ApiResponse({ status: 200, description: '返回用户信息' })
  @ApiCommonResponses()
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
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

  @Patch('avatar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user avatar' })
  @ApiResponse({ status: 200, description: 'Avatar updated successfully' })
  @ApiCommonResponses()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('avatar'))
  updateAvatar(
    @User('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
          new FileTypeValidator({ fileType: 'image' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.usersService.updateAvatar(userId, file);
  }
}
