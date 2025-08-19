import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateResearcherDto } from './dto/create-researcher.dto';
import { UpdateResearcherDto } from './dto/update-researcher.dto';
import { Researcher } from './entities/researcher.entity';
import { Transaction } from 'sequelize';
import { Person } from 'src/person/entities/person.entity';
import { ReturnResearcherDto } from './dto/return-researcher.dto';
import { ResearcherRepository } from './researcher.repository';
 
@Injectable()
export class ResearcherService {
  constructor(
    private readonly researcherRepository: ResearcherRepository,
  ) { }
 
   async create(createresearcherDto: CreateResearcherDto, cpf: string, transaction?: Transaction): Promise<Researcher> {
     if (!createresearcherDto.email ||
       !createresearcherDto.institution ||
       !createresearcherDto.fieldOfStudy ||
       !createresearcherDto.expertise) {
       throw new BadRequestException('Email, instituition, field of suty and expertise are required for researcher profile.');
     }
     
     const researcher = await this.researcherRepository.create({
       ...createresearcherDto,
       cpf:cpf,
      }, {
           transaction,
         });
     
     return researcher;
   }
 
   async findAll(): Promise<ReturnResearcherDto[]> {
     const researcher = await this.researcherRepository.findAll({
       include: [{ model: Person, attributes: ['name'] }],
     });
 
     return researcher.map(researcher => ({
       name: researcher.person?.name,
       cpf: researcher.cpf,
       email: researcher.email,
       institution: researcher.institution,
       fieldOfStudy: researcher.fieldOfStudy,
       expertise: researcher.expertise,
     }));
   }
 
   async findOne(cpf: string): Promise<ReturnResearcherDto> {
     const researcher = await this.researcherRepository.findOne({ where: { cpf }, include: [{ model: Person, attributes: ['name'] }] });
     if (!researcher) {
       throw new BadRequestException('researcher not found.');
     }
     return {
       name: researcher.person?.name,
       cpf: researcher.cpf,
       email: researcher.email,
       institution: researcher.institution,
       fieldOfStudy: researcher.fieldOfStudy,
       expertise: researcher.expertise
     };
   }
 
   async updateByCpf(cpf: string, updateResearcherDto: UpdateResearcherDto) {
     const researcher = await this.researcherRepository.findOne({ where: { cpf } });
     if (!researcher) {
       throw new BadRequestException('researcher not found.');
     }
 
     await this.researcherRepository.update(updateResearcherDto, { where: { cpf } });
     return researcher;
   }
 
   async removeByCpf(cpf: string) {
     const researcher = await this.researcherRepository.findOne({ where: { cpf } });
     if (!researcher) {
       throw new BadRequestException('researcher not found.');
     }
 
     await this.researcherRepository.destroy({ where: { cpf } });
     return researcher;
   }
}
