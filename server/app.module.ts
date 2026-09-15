import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ViewModule } from './modules/view/view.module';
import { PopulationModule } from './modules/population/population.module';
import { CivilAffairsModule } from './modules/civil-affairs/civil-affairs.module';
import { HumanResourcesModule } from './modules/human-resources/human-resources.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TodoModule } from './modules/todo/todo.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ArchiveV2Module } from './modules/archive-v2/archive-v2.module';

@Module({
  imports: [
    PlatformModule.forRoot(),
    DashboardModule,
    PopulationModule,
    CivilAffairsModule,
    HumanResourcesModule,
    TodoModule,
    SettingsModule,
    ArchiveV2Module,
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
