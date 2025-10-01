import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { UpdateProfileDto } from '../auth/dto/update-profile.dto';

import { User as UserModel } from '@chimeralens/db';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    this.logger.log(`更新用户信息: userId=${userId}`);
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    this.logger.log(`Updating avatar for user: ${userId}`);

    // 上传到 Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImageFromBuffer(file.buffer, 'chimeralens/avatars');
    const avatarUrl = this.cloudinaryService.optimizeCloudinaryUrl(uploadResult.secure_url);

    // 更新数据库
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async findAll() {
    const users = await this.prisma.user.findMany();
    // 使用 map 创建一个不含密码的新用户数组
    return users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`ID为 ${id} 的用户未找到`);
    }

    // 从返回的用户信息中删除密码
    const { password, ...userWithoutPassword } = user;

    // 此处返回的用户对象，会被 Passport 附加到 Request 对象上 (req.user)
    return userWithoutPassword;
  }

  async getMe(user: UserModel | null) {
    if (!user) return { user: null };
    // 这里查数据库，确保能拿到 password 字段
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    return {
      user: {
        ...user,
        hasPassword: !!dbUser?.password,
      },
    };
  }
}
