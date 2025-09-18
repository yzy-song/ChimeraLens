import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateGenerationDto {
  @IsUrl() // 校验这个字段必须是一个合法的 URL 地址
  @IsNotEmpty() // 校验这个字段不能为空
  templateImageUrl: string;

  @IsString() // 校验这个字段必须是字符串
  @IsNotEmpty()
  modelKey: string;
}
