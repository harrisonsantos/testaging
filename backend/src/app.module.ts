/* eslint-disable prettier/prettier */
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { SequelizeModule } from '@nestjs/sequelize';
import { PersonModule } from './person/person.module';
import { PatientModule } from './patient/patient.module';
import { HealthProfessionalModule } from './healthProfessional/healthProfessional.module';
import { HealthUnitModule } from './healthUnit/healthUnit.module';
import { ResearcherModule } from './researcher/researcher.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { SensorDataModule } from './sensorData/sensorData.module';
import { HomeModule } from './home/home.module';
import { CsrfMiddleware } from './middlewares/csrf.middleware';
import { AdvancedRateLimitMiddleware } from './middlewares/advanced-rate-limit.middleware';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { winstonConfig } from './common/logger/winston.config';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    winstonConfig, // Adicione o módulo de log do Winston aqui

    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_TTL ?? 60),
        limit: Number(process.env.RATE_LIMIT_LIMIT ?? 20),
      },
    ]),

    // Configuração temporária para SQLite para teste da autenticação
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USERNAME,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      autoLoadModels: true,
      synchronize: true, // Apenas para desenvolvimento
      logging: false,
      pool: {
        max: 10, // Número máximo de conexões no pool
        min: 0,  // Número mínimo de conexões no pool
        acquire: 30000, // Tempo máximo, em ms, que o pool tentará obter uma conexão antes de lançar um erro
        idle: 10000, // Tempo máximo, em ms, que uma conexão pode ficar ociosa no pool antes de ser liberada
      },
    }),

    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      ttl: Number(process.env.CACHE_TTL ?? 300), // Tempo de vida do cache em segundos
      isGlobal: true,
    }),
    
    AuthModule,
    PersonModule,
    PatientModule,
    HealthProfessionalModule,
    HealthUnitModule,
    ResearcherModule,
    EvaluationModule,
    SensorDataModule,
    HomeModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AdvancedRateLimitMiddleware, CsrfMiddleware).forRoutes('*');
  }
}
