import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
export class UpdateProfileDto {
  @ApiProperty({
    description: '用户的新名称',
    required: false,
    example: 'New Name',
  })
  @IsString()
  @IsOptional() // name 是可选的，因为用户可能只想修改其他信息（如果我们未来增加的话）
  name?: string;

  // 未来可以增加其他可修改字段，比如头像URL等
  // @ApiProperty({ description: '新的头像URL', required: false })
  // @IsString()
  // @IsOptional()
  // avatarUrl?: string;
}
