import { Controller, Get, Query } from '@nestjs/common';
import { SettingsService } from './settings.service';
import type { ListResponse, CivilAffairsStandard } from '@shared/api.interface';
import type { OperationLog } from './settings.service';

@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('standards')
  async getStandards(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
  ): Promise<ListResponse<CivilAffairsStandard>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;
    return this.settingsService.getStandards(pageNum, pageSizeNum, type, isActiveBool);
  }

  @Get('operation-logs')
  async getOperationLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('moduleName') moduleName?: string,
  ): Promise<ListResponse<OperationLog>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.settingsService.getOperationLogs(pageNum, pageSizeNum, moduleName);
  }
}
