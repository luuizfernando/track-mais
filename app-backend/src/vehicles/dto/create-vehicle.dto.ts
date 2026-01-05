import { IsNotEmpty, IsNumber, IsPhoneNumber, IsString } from "class-validator";

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsNumber()
  @IsNotEmpty()
  maximumLoad: number;

  @IsString()
  description: string;
}
