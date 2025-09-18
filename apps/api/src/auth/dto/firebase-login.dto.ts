import { IsNotEmpty, IsString } from 'class-validator';
export class FirebaseLoginDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
