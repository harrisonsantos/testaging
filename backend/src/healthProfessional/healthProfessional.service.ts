import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateHealthProfessionalDto } from './dto/create-healthProfessional.dto';
import { InjectModel } from '@nestjs/sequelize';
import { HealthProfessional} from './entities/healthProfessional.entity';
import { Person } from 'src/person/entities/person.entity';
import { UpdateHealthProfessionalDto } from './dto/update-healthProfessional.dto';
import { Transaction } from 'sequelize';
import { ReturnHealthProfessionalDto } from './dto/return-healthProfessional.dto';
import { HealthProfessionalRepository } from './healthProfessional.repository';
 
@Injectable()
export class HealthProfessionalService {
  constructor(
    private readonly healthProfessionalRepository: HealthProfessionalRepository,
  ) { }
  
   async create(createhealthProfessionalDto: CreateHealthProfessionalDto, cpf: string, transaction?: Transaction): Promise<HealthProfessional> {
     
     if (!createhealthProfessionalDto.email || !createhealthProfessionalDto.expertise) {
       throw new BadRequestException("Email e especialidade são obrigatórios para o perfil healthProfessional.");
     }
      
     const healthProfessional = await this.healthProfessionalRepository.create({
       ...createhealthProfessionalDto,
       cpf: cpf, }, {
       transaction,
       });
 
     return healthProfessional;
   }
 
 
   async findAll (): Promise<ReturnHealthProfessionalDto[]> {
     const healthProfessional = await this.healthProfessionalRepository.findAll({
       include: [{ model: Person, attributes: ['name'] }],
     });
 
     return healthProfessional.map(healthProfessional => ({
       name: healthProfessional.person?.name,
       cpf: healthProfessional.cpf,
       email: healthProfessional.email,
       expertise: healthProfessional.expertise,
     }));
   }
 
   async findAllDetailed(): Promise<HealthProfessional[]> {
     return await this.healthProfessionalRepository.findAll({
         include: [
             {
                 model: Person,
                 required: true,
             },
         ],
     });
 }
 
   async findOne(cpf: string): Promise<ReturnHealthProfessionalDto> {
     const healthProfessional = await this.healthProfessionalRepository.findOne({ where: { cpf },
       include: [{ model: Person, attributes: ['name'] }] });
     if (!healthProfessional) {
       throw new BadRequestException("healthProfessional não encontrado.");
     }
     return{
       name: healthProfessional.person?.name,
       cpf: healthProfessional.cpf,
       email: healthProfessional.email,
       expertise: healthProfessional.expertise,
     };
   }
 
   async updateByCpf(cpf: string, updateHealthProfessionalDto: UpdateHealthProfessionalDto): Promise<HealthProfessional> {
    const healthProfessional = await this.healthProfessionalRepository.findOne({ where: { cpf } });
    if (!healthProfessional) {
      throw new BadRequestException('healthProfessional not found.');
    }

    await this.healthProfessionalRepository.update(updateHealthProfessionalDto, { where: { cpf } });
    return healthProfessional;
  }

  async removeByCpf(cpf: string): Promise<HealthProfessional> {
    const healthProfessional = await this.healthProfessionalRepository.findOne({ where: { cpf } });
    if (!healthProfessional) {
      throw new BadRequestException('healthProfessional not found.');
    }

    await this.healthProfessionalRepository.destroy({ where: { cpf } });
    return healthProfessional;
  }
}
