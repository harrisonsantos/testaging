import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { MESSAGES } from 'src/common/constants/messages';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { RequestResetDto } from './dto/request-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from './decorators/public.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(ThrottlerGuard, LocalAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60 } })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto.cpf, loginDto.password);
    return { 
      mensagem: MESSAGES.AUTH.LOGIN_SUCCESS, 
      ...result 
    };
  }

  @Post('refresh')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60 } })
  async refresh(@Body() body: { refresh_token: string }) {
    const result = await this.authService.refreshToken(body.refresh_token);
    return { 
      mensagem: 'Token renovado com sucesso', 
      ...result 
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'researcher', 'patient')
  async getProfile(@Req() req: Request) {
    return { 
      mensagem: 'Perfil obtido com sucesso', 
      user: req.user 
    };
  }

  @Post('request-reset')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 300 } })
  async requestReset(@Body() dto: RequestResetDto) {
    const message = await this.authService.requestPasswordReset(dto.cpf);
    return { mensagem: message };
  }

  @Post('reset-password')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 300 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const message = await this.authService.resetPassword(dto.token, dto.newPassword);
    return { mensagem: message };
  }

  @Post('encrypt-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('researcher')
  async encryptPassword(@Body() body: { password: string }) {
    const encryptedPassword = await this.authService.encryptPassword(body.password);
    return { mensagem: 'Password criptografada com sucesso', encryptedPassword };
  }
}
