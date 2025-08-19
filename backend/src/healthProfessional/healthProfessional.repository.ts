import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { HealthProfessional } from './entities/healthProfessional.entity';
import { BaseRepository } from '../common/repository/base.repository';

@Injectable()
export class HealthProfessionalRepository extends BaseRepository<HealthProfessional> {
  constructor(
    @InjectModel(HealthProfessional)
    private readonly healthProfessionalModel: typeof HealthProfessional,
  ) {
    super(healthProfessionalModel);
  }
}