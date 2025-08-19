import { Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Evaluation } from './entities/evaluation.entity';
import { BiomechanicalCalculationsService } from './biomechanical-calculations.service';

@Module({
  imports: [SequelizeModule.forFeature([Evaluation])],
  controllers: [EvaluationController],
  providers: [EvaluationService, BiomechanicalCalculationsService],
})
export class EvaluationModule {}
