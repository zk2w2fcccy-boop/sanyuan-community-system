import { Module } from '@nestjs/common';
import { CivilAffairsController } from './civil-affairs.controller';
import { CivilAffairsService } from './civil-affairs.service';

@Module({
  controllers: [CivilAffairsController],
  providers: [CivilAffairsService],
})
export class CivilAffairsModule {}