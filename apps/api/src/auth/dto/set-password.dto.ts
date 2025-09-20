import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SetPasswordDto {
  @ApiProperty({
    description: '用户的新密码',
    example: 'new-secure-password',
  })
  @IsString()
  @MinLength(6, { message: '密码长度不能少于6位' })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}
