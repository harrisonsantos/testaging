import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHealthUnitDto } from './dto/create-healthUnit.dto';
import { UpdateHealthUnitDto } from './dto/update-healthUnit.dto';
import { HealthUnit } from './entities/healthUnit.entity';
import { InjectModel } from '@nestjs/sequelize';
 
@Injectable()
export class HealthUnitService {
  constructor(
    @InjectModel(HealthUnit)
    private readonly healthUnitModel: typeof HealthUnit
  ) { }
 
  async create(createHealthUnitDto: Partial<CreateHealthUnitDto>): Promise<HealthUnit> {
    return this.healthUnitModel.create(createHealthUnitDto);
  }
 
  async findAll(): Promise<HealthUnit[]> {
    return this.healthUnitModel.findAll();
  }
 
  async findOne(id: number): Promise<HealthUnit> {
    const healthUnit = await this.healthUnitModel.findByPk(id);
    if (!healthUnit) {
      throw new NotFoundException(`HealthUnit with id ${id} not found`);
    }
    return healthUnit;
  }
 
  async updateById(id: number, updateHealthUnitDto: UpdateHealthUnitDto): Promise<HealthUnit> {
    const healthUnit = await this.healthUnitModel.findOne({ where: { id } });
    if (!healthUnit) {
      throw new NotFoundException(`HealthUnit with id ${id} not found`);
    }
 
    await healthUnit.update(updateHealthUnitDto);
    return healthUnit;
  }
 
  async removeById(id: number): Promise<HealthUnit> {
    const healthUnit = await this.healthUnitModel.findOne({ where: { id } });
    if (!healthUnit) {
      throw new NotFoundException(`HealthUnit with id ${id} not found`);
    }
 
    await healthUnit.destroy();
    return healthUnit;
  }
}
