import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { urlencoded } from 'express';
import { json } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { securityMiddleware } from './middlewares/security.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global input validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // Global error handling
  app.useGlobalFilters(new HttpExceptionFilter());

  // Security headers and basic input sanitization
  app.use(securityMiddleware);

  // Request/response logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger documentation configuration
  const config = new DocumentBuilder()
    .setTitle('Tecno Aging API')
    .setDescription('API para sistema de avaliação geriátrica com sensores IoT')
    .setVersion('2.0.0')
    .addTag('auth', 'Autenticação e autorização')
    .addTag('patients', 'Gestão de pacientes')
    .addTag('evaluations', 'Avaliações e dados de sensores')
    .addTag('health-professionals', 'Profissionais de saúde')
    .addTag('researchers', 'Pesquisadores')
    .addTag('health-units', 'Unidades de saúde')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Tecno Aging API Documentation',
  });

  // Body parser configuration
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation available at: http://localhost:${port}/api`);
}

bootstrap();
