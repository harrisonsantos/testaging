import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Person } from 'src/person/entities/person.entity';
import { MESSAGES } from 'src/common/constants/messages';

export interface JwtPayload {
  cpf: string;
  profile: string;
  sub: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: Person;
}

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    @InjectModel(Person)
    private personsRepository: typeof Person,
    private jwtService: JwtService
  ) {}

  async encryptPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return bcrypt.hash(password, salt);
  }

  async validateUser(cpf: string, password: string): Promise<Person | null> {
    const user = await this.personsRepository.findOne({ where: { cpf } });

    if (!user) {
      return null;
    }

    const correctPassword = await bcrypt.compare(password, user.password);
    if (!correctPassword) {
      return null;
    }

    return user;
  }

  async login(cpf: string, password: string): Promise<TokenResponse> {
    const user = await this.validateUser(cpf, password);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.generateTokens(user);
    
    return {
      ...tokens,
      user,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      });

      const user = await this.personsRepository.findOne({ 
        where: { cpf: payload.cpf } 
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      const tokens = await this.generateTokens(user);
      
      return {
        ...tokens,
        user,
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  private async generateTokens(user: Person): Promise<Omit<TokenResponse, 'user'>> {
    const payload: JwtPayload = {
      cpf: user.cpf,
      profile: user.profile,
      sub: user.id.toString(),
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      }),
    ]);

    return {
      access_token,
      refresh_token,
      expires_in: 15 * 60, // 15 minutos em segundos
    };
  }

  async requestPasswordReset(cpf: string): Promise<string> {
    const user = await this.personsRepository.findOne({ where: { cpf } });
    if (!user) {
      // Não revelar se existe ou não
      return 'Se o CPF existir, enviaremos instruções de redefinição.';
    }

    // No futuro: gerar token, enviar e-mail/SMS. Por ora: mock seguro.
    return 'Se o CPF existir, enviaremos instruções de redefinição.';
  }

  async resetPassword(token: string, newPassword: string): Promise<string> {
    // No futuro: validar token; por ora retorna mensagem de placeholder
    if (!newPassword) {
      throw new UnauthorizedException('Senha inválida');
    }
    return 'Se o token for válido, a senha será atualizada.';
  }
}
