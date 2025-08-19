import { PartialType } from '@nestjs/mapped-types';
import { CreateHealthUnitDto } from './create-healthUnit.dto';
 
export class UpdateHealthUnitDto extends PartialType(CreateHealthUnitDto) {}
