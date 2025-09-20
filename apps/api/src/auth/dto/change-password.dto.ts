import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description:
      "The user's current password. Not required if setting password for the first time (e.g., after social login).",
    example: 'current-secure-password',
    required: false,
  })
  @IsString()
  @IsOptional()
  currentPassword?: string;

  @ApiProperty({
    description: "The user's new password",
    example: 'new-secure-password',
  })
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'New password cannot be empty' })
  newPassword: string;
}
