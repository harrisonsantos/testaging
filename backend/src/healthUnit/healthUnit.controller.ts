import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { HealthUnitService } from './healthUnit.service';
import { CreateHealthUnitDto } from './dto/create-healthUnit.dto';
import { UpdateHealthUnitDto } from './dto/update-healthUnit.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/middlewares/auth.guard';
 
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('healthUnit')
export class HealthUnitController {
  constructor(private readonly healthUnitService: HealthUnitService) {}
 
  @Post()
  create(@Body() createHealthUnitDto: CreateHealthUnitDto) {
    return this.healthUnitService.create(createHealthUnitDto);
  }
 
  @Get()
  findAll() {
    return this.healthUnitService.findAll();
  }
 
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.healthUnitService.findOne(+id);
  }
 
  @Patch(':id')
  update(@Param('id') id: number, @Body() updateHealthUnitDto: UpdateHealthUnitDto) {
    return this.healthUnitService.updateById(id, updateHealthUnitDto);
  }
 
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.healthUnitService.removeById(id);
  }
}
