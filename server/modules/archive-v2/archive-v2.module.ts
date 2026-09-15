import { Module } from '@nestjs/common';
import { ArchiveV2Controller } from './archive-v2.controller';
import { ArchiveV2Service } from './archive-v2.service';

@Module({
  controllers: [ArchiveV2Controller],
  providers: [ArchiveV2Service],
})
export class ArchiveV2Module {}