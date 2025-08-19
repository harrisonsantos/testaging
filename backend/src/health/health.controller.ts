import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck, SequelizeHealthIndicator } from '@nestjs/terminus';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: SequelizeHealthIndicator,
    @InjectConnection() private sequelize: Sequelize,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
      () => this.db.pingCheck('database', this.sequelize),
    ]);
  }
}