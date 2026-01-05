import {
  IsString,
  IsEmail,
  IsOptional,
  Matches,
  IsNotEmpty,
  IsNumberString,
} from "class-validator";

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsNumberString()
  code: string;

  @IsNotEmpty()
  @IsString()
  fantasy_name: string;

  @IsNotEmpty()
  @IsString()
  legal_name: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, { message: "CNPJ/CPF deve conter apenas números" })
  cnpj_cpf: string;

  @IsNotEmpty()
  @IsString()
  state_subscrition: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Matches(/^\d+$/, { message: "Telefone deve conter apenas números" })
  phone: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  neighborhood: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  cep: string;

  @IsNotEmpty()
  @IsString()
  corporate_network: string;

  @IsNotEmpty()
  @IsString()
  payment_method: string;
}
