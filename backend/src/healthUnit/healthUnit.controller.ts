import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { healthUnitService } from './healthUnit.service';
import { CreatehealthUnitDto } from './dto/create-healthUnit.dto';
import { UpdatehealthUnitDto } from './dto/update-healthUnit.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/middlewares/auth.guard';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('healthUnit')
export class healthUnitController {
  constructor(private readonly healthUnitService: healthUnitService) {}

  @Post()
  create(@Body() createhealthUnitDto: CreatehealthUnitDto) {
    return this.healthUnitService.create(createhealthUnitDto);
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
  update(@Param('id') id: number, @Body() updatehealthUnitDto: UpdatehealthUnitDto) {
    return this.healthUnitService.updateById(id, updatehealthUnitDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.healthUnitService.removeById(id);
  }
}
