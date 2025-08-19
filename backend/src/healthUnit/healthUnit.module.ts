import { Module } from '@nestjs/common';
import { HealthUnitService } from './healthUnit.service';
import { HealthUnitController } from './healthUnit.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { HealthUnit } from './entities/healthUnit.entity';
 
@Module({
  imports: [SequelizeModule.forFeature([HealthUnit])],
  controllers: [HealthUnitController],
  providers: [HealthUnitService],
})
export class HealthUnitModule { }
