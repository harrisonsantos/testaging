import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [TerminusModule, SequelizeModule],
  controllers: [HealthController],
})
export class HealthModule {}