import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token de redefinição' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'Nova senha', example: 'SenhaSegura@2025' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}


