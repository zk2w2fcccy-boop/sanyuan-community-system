import { Controller, Get, Query } from '@nestjs/common';
import type { DashboardStats, BirthdayPerson } from '@shared/api.interface';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(): Promise<DashboardStats> {
    return this.dashboardService.getStats();
  }

  @Get('birthday-list')
  async getBirthdayList(
    @Query('age') age: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('pensionType') pensionType?: string,
  ): Promise<BirthdayPerson[]> {
    const ageNum = Number(age);
    return this.dashboardService.getBirthdayList(
      ageNum,
      year ? Number(year) : undefined,
      month ? Number(month) : undefined,
      pensionType,
    );
  }
}