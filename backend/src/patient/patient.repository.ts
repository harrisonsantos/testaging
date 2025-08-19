import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Patient } from './entities/patient.entity';
import { BaseRepository } from '../common/repository/base.repository';

@Injectable()
export class PatientRepository extends BaseRepository<Patient> {
  constructor(
    @InjectModel(Patient)
    private readonly patientModel: typeof Patient,
  ) {
    super(patientModel);
  }
}