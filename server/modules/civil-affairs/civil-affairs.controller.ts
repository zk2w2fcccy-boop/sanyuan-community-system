import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CivilAffairsService } from './civil-affairs.service';
import type {
  LowIncome,
  SpecialPoverty,
  DisabledPerson,
  ElderlyAllowance,
  ChildSupport,
  HomeCare,
  HomeCareCandidate,
  LowIncomeEdge,
  RigidExpenditure,
  TemporaryAssistance,
  CivilAffairsStandard,
  ListResponse,
} from '@shared/api.interface';

@Controller('api/civil-affairs')
export class CivilAffairsController {
  constructor(private readonly civilAffairsService: CivilAffairsService) {}

  @Get('low-income')
  async getLowIncomeList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ): Promise<ListResponse<LowIncome>> {
    return this.civilAffairsService.getLowIncomeList({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      type,
      status,
      keyword,
    });
  }

  @Get('special-poverty')
  async getSpecialPovertyList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ): Promise<ListResponse<SpecialPoverty>> {
    return this.civilAffairsService.getSpecialPovertyList({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      status,
      keyword,
    });
  }

  @Get('disabled')
  async getDisabledList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ): Promise<ListResponse<DisabledPerson>> {
    return this.civilAffairsService.getDisabledList({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      keyword,
    });
  }

  @Get('elderly-allowance')
  async getElderlyAllowanceList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('ageGroup') ageGroup?: string,
    @Query('keyword') keyword?: string,
  ): Promise<ListResponse<ElderlyAllowance>> {
    return this.civilAffairsService.getElderlyAllowanceList({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      ageGroup,
      keyword,
    });
  }

  @Get('child-support')
  async getChildSupportList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ): Promise<ListResponse<ChildSupport>> {
    return this.civilAffairsService.getChildSupportList({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      keyword,
    });
  }

  @Get('home-care/candidates')
  async getHomeCareCandidates(): Promise<HomeCareCandidate[]> {
    return this.civilAffairsService.getHomeCareCandidates();
  }

  @Post('home-care/candidates/:idCard/exclude')
  async excludeHomeCareCandidate(
    @Param('idCard') idCard: string,
    @Body() body: { reason: string },
  ): Promise<void> {
    return this.civilAffairsService.toggleHomeCareExclusion(
      idCard,
      body.reason,
    );
  }

  @Post('home-care/candidates/:idCard/include')
  async includeHomeCareCandidate(
    @Param('idCard') idCard: string,
  ): Promise<void> {
    return this.civilAffairsService.toggleHomeCareExclusion(idCard, null);
  }

  @Post('home-care/candidates/:idCard/add')
  async addHomeCareFromCandidate(
    @Param('idCard') idCard: string,
  ): Promise<void> {
    return this.civilAffairsService.addHomeCareFromCandidate(idCard);
  }

  @Get('home-care')
  async getHomeCareList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('includeExcluded') includeExcluded?: string,
  ): Promise<ListResponse<HomeCare>> {
    return this.civilAffairsService.getHomeCareList({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      keyword,
      includeExcluded,
    });
  }

  @Get('low-income-edge')
  async getLowIncomeEdgeList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ): Promise<ListResponse<LowIncomeEdge>> {
    return this.civilAffairsService.getLowIncomeEdgeList({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      keyword,
    });
  }

  @Get('rigid-expenditure')
  async getRigidExpenditureList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ): Promise<ListResponse<RigidExpenditure>> {
    return this.civilAffairsService.getRigidExpenditureList({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      keyword,
    });
  }

  @Get('rigid-expenditure/:id')
  async getRigidExpenditureItem(
    @Param('id') id: string,
  ): Promise<RigidExpenditure> {
    return this.civilAffairsService.getRigidExpenditureById(id);
  }

  @Post('rigid-expenditure')
  async createRigidExpenditure(
    @Body() body: {
      idCard: string;
      name?: string;
      householdNo?: string;
      familyMembers?: number;
      startDate?: string;
      endDate?: string | null;
      currentStatus?: string;
      exitReason?: string;
      familySituation?: string;
      remark?: string;
    },
  ): Promise<RigidExpenditure> {
    return this.civilAffairsService.createRigidExpenditure(body);
  }

  @Patch('rigid-expenditure/:id')
  async updateRigidExpenditure(
    @Param('id') id: string,
    @Body() body: {
      idCard?: string;
      name?: string;
      householdNo?: string;
      familyMembers?: number;
      startDate?: string;
      endDate?: string | null;
      currentStatus?: string;
      exitReason?: string;
      familySituation?: string;
      remark?: string;
    },
  ): Promise<RigidExpenditure> {
    return this.civilAffairsService.updateRigidExpenditure(id, body);
  }

  @Delete('rigid-expenditure/:id')
  async deleteRigidExpenditure(@Param('id') id: string): Promise<void> {
    return this.civilAffairsService.deleteRigidExpenditure(id);
  }

  @Get('temporary-assistance')
  async getTemporaryAssistanceList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ): Promise<ListResponse<TemporaryAssistance>> {
    return this.civilAffairsService.getTemporaryAssistanceList({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      keyword,
    });
  }

  @Get('standards')
  async getStandardsList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
  ): Promise<ListResponse<CivilAffairsStandard>> {
    return this.civilAffairsService.getStandardsList({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      type,
      isActive,
    });
  }
}