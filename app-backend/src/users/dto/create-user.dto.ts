import { role } from "@prisma/client";
import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
} from "class-validator";

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+$/, {
    message:
      "O nome de usuário só pode conter letras e pontos. Ex: Victor.Leal",
  })
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  password: string;

  @IsNotEmpty()
  @IsEnum(role, { message: "Cargo inválido" })
  role: role;
}
