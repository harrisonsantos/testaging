import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'CPF do usuário', example: '123.456.789-00' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    { message: 'CPF deve estar no formato 123.456.789-00' })
  cpf: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'senhaSegura123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}


