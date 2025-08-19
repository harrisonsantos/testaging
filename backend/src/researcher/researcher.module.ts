import { Module } from '@nestjs/common';
import { ResearcherService } from './researcher.service';
import { ResearcherController } from './researcher.controller';
import { ResearcherRepository } from './researcher.repository';
import { SequelizeModule } from '@nestjs/sequelize';
import { Researcher } from './entities/researcher.entity';

@Module({
  imports: [SequelizeModule.forFeature([Researcher])],
  controllers: [ResearcherController],
  providers: [ResearcherService, ResearcherRepository],
  exports: [SequelizeModule, ResearcherService, ResearcherRepository]
})
export class ResearcherModule {}
