import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Person } from './entities/person.entity';
import { BaseRepository } from '../common/repository/base.repository';

@Injectable()
export class PersonRepository extends BaseRepository<Person> {
  constructor(
    @InjectModel(Person)
    private readonly personModel: typeof Person,
  ) {
    super(personModel);
  }
}