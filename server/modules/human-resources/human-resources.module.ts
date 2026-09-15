import { Module } from '@nestjs/common';
import { HumanResourcesController } from './human-resources.controller';
import { HumanResourcesService } from './human-resources.service';

@Module({
  controllers: [HumanResourcesController],
  providers: [HumanResourcesService],
})
export class HumanResourcesModule {}