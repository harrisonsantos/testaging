import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Evaluation } from './entities/evaluation.entity';
import { BaseRepository } from '../common/repository/base.repository';

@Injectable()
export class EvaluationRepository extends BaseRepository<Evaluation> {
  constructor(
    @InjectModel(Evaluation)
    private readonly evaluationModel: typeof Evaluation,
  ) {
    super(evaluationModel);
  }
}