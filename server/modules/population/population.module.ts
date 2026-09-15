import { Module } from '@nestjs/common';
import { PopulationController } from './population.controller';
import { PopulationService } from './population.service';

@Module({
  controllers: [PopulationController],
  providers: [PopulationService],
})
export class PopulationModule {}