import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { Person } from './entities/person.entity';
import { Sequelize, Transaction } from 'sequelize';
import { InjectConnection } from '@nestjs/sequelize';
import { AuthService } from 'src/auth/auth.service';
import { Researcher } from 'src/researcher/entities/researcher.entity';
import { Patient } from 'src/patient/entities/patient.entity';
import { CreatePatientDto } from 'src/patient/dto/create-patient.dto';
import { HealthProfessional } from 'src/healthProfessional/entities/healthProfessional.entity';
import { HealthProfessionalService } from 'src/healthProfessional/healthProfessional.service';
import { ResearcherService } from 'src/researcher/researcher.service';
import { PatientService } from 'src/patient/patient.service';
import { CreateHealthProfessionalDto } from 'src/healthProfessional/dto/create-healthProfessional.dto';
import { CreateResearcherDto } from 'src/researcher/dto/create-researcher.dto';
import { PersonRepository } from './person.repository';

@Injectable()
export class PersonService {
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly authService: AuthService,
    private readonly healthProfessionalService: HealthProfessionalService,
    private readonly researcherService: ResearcherService,
    private readonly patientService: PatientService,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  async create(createPersonDto: any): Promise<Person> {
    if (!createPersonDto.password) {
      throw new BadRequestException('Password is required');
    }

    if (!createPersonDto.cpf || !createPersonDto.profile) {
      throw new BadRequestException('CPF and profile are required');
    }

    const profile = createPersonDto.profile;

    // Validação por perfil
    switch (profile) {
      case 'healthProfessional':
        if (!createPersonDto.email || !createPersonDto.expertise) {
          throw new BadRequestException('Dados de healthProfessional são obrigatórios');
        }
        break;

      case 'researcher':
        if (
          !createPersonDto.email ||
          !createPersonDto.institution ||
          !createPersonDto.fieldOfStudy ||
          !createPersonDto.expertise
        ) {
          throw new BadRequestException('Dados de researcher são obrigatórios');
        }
        break;

      case 'patient':
        if (
          !createPersonDto.dateOfBirth ||
          !createPersonDto.educationLevel ||
          !createPersonDto.socioeconomicStatus ||
          !createPersonDto.weight ||
          !createPersonDto.height
        ) {
          throw new BadRequestException('Dados de patient são obrigatórios');
        }
        break;

      default:
        throw new BadRequestException('Perfil inválido');
    }

    createPersonDto.password = await this.authService.encryptPassword(createPersonDto.password);

    const transaction = await this.sequelize.transaction();

    try {
      const person = await this.personRepository.create(createPersonDto, { transaction });

      switch (profile) {
        case 'healthProfessional': {
          const dto = {
            email: createPersonDto.email,
            expertise: createPersonDto.expertise,
            cpf: person.cpf,
          };
          await this.healthProfessionalService.create(dto, person.cpf, transaction);
          break;
        }

        case 'researcher': {
          const dto = {
            email: createPersonDto.email,
            institution: createPersonDto.institution,
            fieldOfStudy: createPersonDto.fieldOfStudy,
            expertise: createPersonDto.expertise,
            cpf: person.cpf,
          };
          await this.researcherService.create(dto, person.cpf, transaction);
          break;
        }

        case 'patient': {
          const dto = {
            dateOfBirth: createPersonDto.dateOfBirth,
            educationLevel: createPersonDto.educationLevel,
            socioeconomicStatus: createPersonDto.socioeconomicStatus,
            weight: createPersonDto.weight,
            height: createPersonDto.height,
            cep: createPersonDto.cep,
            street: createPersonDto.street,
            number: createPersonDto.number,
            neighborhood: createPersonDto.neighborhood,
            city: createPersonDto.city,
            state: createPersonDto.state,
            cpf: person.cpf,
            age: createPersonDto.age,
            downFall: createPersonDto.downFall,
          };
          await this.patientService.create(dto, person.cpf, transaction);
          break;
        }
      }

      await transaction.commit();
      return person;
    } catch (err) {
      await transaction.rollback();
      console.error('Erro ao criar pessoa e perfil:', err);
      throw new BadRequestException('Erro ao criar pessoa e perfil: ' + err.message);
    }
  }

  async findAll(): Promise<Person[]> {
    return await this.personRepository.findAll();
  }

  async findOne(cpf: string): Promise<Person> {
    const person = await this.personRepository.findOne({ where: { cpf } });
    if (!person) {
      throw new NotFoundException(`Person with cpf ${cpf} not found`);
    }
    return person;
  }

  async updateByCpf(cpf: string, updatePersonDto: UpdatePersonDto): Promise<Person> {
    const person = await this.personRepository.findOne({ where: { cpf } });
    if (!person) {
      throw new NotFoundException(`Person with cpf ${cpf} not found`);
    }
    if (updatePersonDto.password) {
      updatePersonDto.password = await this.authService.encryptPassword(updatePersonDto.password);
    }

    if (updatePersonDto.profile === 'healthProfessional') {
      if (!updatePersonDto.email || !updatePersonDto.expertise) {
        throw new BadRequestException('Datas of health professional are required for this profile: email e especialidade');
      }
    }
    if (updatePersonDto.profile === 'researcher') {
      if (!updatePersonDto.email || !updatePersonDto.institution || !updatePersonDto.fieldOfStudy || !updatePersonDto.expertise) {
        throw new BadRequestException('Datas of researcher are required for this profile: email, instituicao, area e especialidade');
      }
    }
    if (updatePersonDto.profile === 'patient') {
      if (!updatePersonDto.dateOfBirth || !updatePersonDto.educationLevel || !updatePersonDto.socioeconomicStatus || !updatePersonDto.weight || !updatePersonDto.height) {
        throw new BadRequestException('Datas of patient are required for this profile: dateOfBirth, educationStatus, socioeconomicStatus, weight e height');
      }
    }

    if (updatePersonDto.profile === 'healthProfessional') {
      await this.healthProfessionalService.updateByCpf(cpf, updatePersonDto as CreateHealthProfessionalDto);
    }
    if (updatePersonDto.profile === 'researcher') {
      await this.researcherService.updateByCpf(cpf, updatePersonDto as CreateResearcherDto);
    }
    if (updatePersonDto.profile === 'patient') {
      await this.patientService.updateByCpf(cpf, updatePersonDto as CreatePatientDto);
    }

    await this.personRepository.update(updatePersonDto, { where: { cpf } });
    return person;
  }

  async removeByCpf(cpf: string): Promise<Person> {
    const person = await this.personRepository.findOne({ where: { cpf } });
    if (!person) {
      throw new NotFoundException(`Person with cpf ${cpf} not found`);
    }

    await this.personRepository.destroy({ where: { cpf } });
    return person;
  }
}
