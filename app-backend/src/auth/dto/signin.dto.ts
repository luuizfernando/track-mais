import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class SignInDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6, { message: "A senha deve ter pelo menos 6 dígitos" })
  @IsNotEmpty()
  password: string;
}
