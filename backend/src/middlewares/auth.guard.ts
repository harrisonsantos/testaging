import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    
    // Verificar se o usuário já foi autenticado pelo JwtAuthGuard
    if (request.user) {
      return true;
    }

    // Fallback para compatibilidade com código existente
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const token = authHeader.split(' ')[1]; // "Bearer token_aqui"
    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    // Para compatibilidade, ainda aceita tokens antigos
    // Mas recomenda-se usar o JwtAuthGuard para novas implementações
    return true;
  }
}
