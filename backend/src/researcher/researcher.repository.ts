import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Researcher } from './entities/researcher.entity';
import { BaseRepository } from '../common/repository/base.repository';

@Injectable()
export class ResearcherRepository extends BaseRepository<Researcher> {
  constructor(
    @InjectModel(Researcher)
    private readonly researcherModel: typeof Researcher,
  ) {
    super(researcherModel);
  }
}