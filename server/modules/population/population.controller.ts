import { Controller, Get, Query, Param, NotFoundException, Patch, Body, Post, BadRequestException, Delete, Req } from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type {
  Person,
  Household,
  PopulationChange,
  DeathRecord,
  ListResponse,
} from '@shared/api.interface';
import { PopulationService } from './population.service';

@Controller('api/population')
export class PopulationController {
  constructor(private readonly populationService: PopulationService) {}

  @Get('persons')
  async getPersons(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('householdNo') householdNo?: string,
  ): Promise<ListResponse<Person>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? Math.min(parseInt(pageSize, 10), 100) : 20;
    return this.populationService.getPersons({
      page: pageNum,
      pageSize: pageSizeNum,
      keyword,
      status,
      householdNo,
    });
  }

  @Get('persons/:id')
  async getPerson(@Param('id') id: string): Promise<Person> {
    const person = await this.populationService.getPerson(id);
    if (!person) {
      throw new NotFoundException('人员不存在');
    }
    return person;
  }

  @Patch('persons/:id')
  @NeedLogin()
  async updatePerson(
    @Param('id') id: string,
    @Body() dto: Partial<Person>,
  ): Promise<Person> {
    return this.populationService.updatePerson(id, dto);
  }

  @Delete('persons/:id')
  @NeedLogin()
  async deletePerson(
    @Param('id') id: string,
    @Body() dto: { changeType: '迁出' | '死亡' | '其他'; changeDate: string; changeReason?: string },
    @Req() req: Request,
  ): Promise<{ success: boolean }> {
    const { userId } = req.userContext;
    await this.populationService.deletePerson(id, {
      ...dto,
      operatorId: userId,
    });
    return { success: true };
  }

  @Get('households')
  async getHouseholds(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ): Promise<ListResponse<Household>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? Math.min(parseInt(pageSize, 10), 100) : 20;
    return this.populationService.getHouseholds({
      page: pageNum,
      pageSize: pageSizeNum,
      keyword,
    });
  }

  @Get('households/:id')
  async getHousehold(@Param('id') id: string): Promise<Household> {
    const household = await this.populationService.getHousehold(id);
    if (!household) {
      throw new NotFoundException('家庭户不存在');
    }
    return household;
  }

  @Get('households/:householdNo/members')
  async getHouseholdMembers(@Param('householdNo') householdNo: string): Promise<Person[]> {
    return this.populationService.getHouseholdMembers(householdNo);
  }

  @Get('changes')
  async getChanges(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('changeType') changeType?: string,
    @Query('keyword') keyword?: string,
  ): Promise<ListResponse<PopulationChange>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? Math.min(parseInt(pageSize, 10), 100) : 20;
    return this.populationService.getChanges({
      page: pageNum,
      pageSize: pageSizeNum,
      changeType,
      keyword,
    });
  }

  @Get('deaths')
  async getDeaths(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('verificationStatus') verificationStatus?: string,
  ): Promise<ListResponse<DeathRecord>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? Math.min(parseInt(pageSize, 10), 100) : 20;
    return this.populationService.getDeaths({
      page: pageNum,
      pageSize: pageSizeNum,
      keyword,
      verificationStatus,
    });
  }

  @Patch('deaths/:id')
  @NeedLogin()
  async updateDeath(
    @Param('id') id: string,
    @Body() dto: { deathDate: string; deathCause?: string },
  ): Promise<DeathRecord> {
    return this.populationService.updateDeath(id, dto);
  }

  @Post('households/merge')
  @NeedLogin()
  async mergeHouseholds(
    @Body() dto: {
      newHouseholdNo: string;
      headIdCard: string;
      sourceHouseholdNos: string[];
      relationMapping: Record<string, string>;
    },
  ): Promise<Household> {
    try {
      return this.populationService.mergeHouseholds(dto);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '合户失败';
      throw new BadRequestException(msg);
    }
  }
}