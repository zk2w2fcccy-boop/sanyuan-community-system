import { Controller, Get, Query, Patch, Body, Post } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { HumanResourcesService } from './human-resources.service';
import type {
  MedicalInsurance,
  PensionInsurance,
  ListResponse,
} from '@shared/api.interface';

interface MedicalInsuranceStats {
  shouldPayCount: number;
  paidCount: number;
  unpaidCount: number;
  newlyAddedCount: number;
  paymentRate: number;
  history: { year: number; paid: number; rate: number }[];
}

interface PensionInsuranceStats {
  insuredCount: number;
  thisMonth60Count: number;
  futureAgeCount: number;
  toVerifyCount: number;
  receivingCount: number;
}

@Controller('api/human-resources')
export class HumanResourcesController {
  constructor(private readonly humanResourcesService: HumanResourcesService) {}

  @Get('medical-insurance')
  async getMedicalInsuranceList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('year') year?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ): Promise<ListResponse<MedicalInsurance>> {
    return this.humanResourcesService.getMedicalInsuranceList({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      year: year ? parseInt(year, 10) : 2026,
      status,
      keyword,
    });
  }

  @Get('medical-insurance/unpaid')
  async getUnpaidList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('year') year?: string,
    @Query('keyword') keyword?: string,
  ): Promise<ListResponse<{ id: string; idCard: string; name: string; insuranceYear: number; paymentStatus: string }>> {
    return this.humanResourcesService.getUnpaidList({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      year: year ? parseInt(year, 10) : 2026,
      keyword,
    });
  }

  @Post('medical-insurance/import')
  @NeedLogin()
  async importMedicalInsurance(
    @Body() dto: { records: Array<{ idCard: string; name: string; insuranceYear: number; paymentAmount: number; paymentDate?: string }> },
  ): Promise<{ imported: number; updated: number; failed: number; errors: string[] }> {
    return this.humanResourcesService.batchImportMedicalInsurance(dto.records);
  }

  @Get('medical-insurance/stats')
  async getMedicalInsuranceStats(
    @Query('year') year?: string,
  ): Promise<MedicalInsuranceStats> {
    return this.humanResourcesService.getMedicalInsuranceStats(
      year ? parseInt(year, 10) : 2026,
    );
  }

  @Get('pension-insurance')
  async getPensionInsuranceList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('treatmentStatus') treatmentStatus?: string,
    @Query('keyword') keyword?: string,
  ): Promise<ListResponse<PensionInsurance>> {
    return this.humanResourcesService.getPensionInsuranceList({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      treatmentStatus,
      keyword,
    });
  }

  @Get('pension-insurance/stats')
  async getPensionInsuranceStats(): Promise<PensionInsuranceStats> {
    return this.humanResourcesService.getPensionInsuranceStats();
  }

  @Patch('pension-insurance/type')
  @NeedLogin()
  async updatePensionType(
    @Body() dto: { idCard: string; pensionType: string },
  ): Promise<void> {
    return this.humanResourcesService.updatePensionType(dto.idCard, dto.pensionType);
  }

  @Post('pension-insurance/import')
  @NeedLogin()
  async importPensionInsurance(
    @Body() dto: { records: Array<{ idCard: string; name: string; pensionType?: string; insuredYear?: number }> },
  ): Promise<{ imported: number; updated: number; failed: number }> {
    return this.humanResourcesService.batchImportPensionInsurance(dto.records);
  }
}