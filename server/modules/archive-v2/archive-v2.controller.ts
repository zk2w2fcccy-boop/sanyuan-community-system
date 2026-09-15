import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ArchiveV2Service } from './archive-v2.service';
import type {
  ArchiveCategory,
  ArchiveCategoryTree,
  ArchiveItem,
  ArchiveFileItem,
  ArchiveV2Template,
  ArchiveReminder,
  ArchiveOperationLog,
  ArchiveDashboardStats,
  ArchiveListResponse,
  ArchiveRecentData,
} from '@shared/api.interface';

@Controller('api/archive-v2')
export class ArchiveV2Controller {
  constructor(private readonly archiveV2Service: ArchiveV2Service) {}

  private getOperatorId(req: Request): string {
    return req.userContext?.userId ?? 'system';
  }

  // ===== 分类管理 =====

  @Get('categories/tree')
  async getCategoryTree(): Promise<ArchiveCategoryTree[]> {
    return this.archiveV2Service.getCategoryTree();
  }

  @Post('categories')
  async createCategory(
    @Body() dto: {
      name: string;
      parentId?: string;
      sortOrder?: number;
      icon?: string;
      description?: string;
    },
  ): Promise<ArchiveCategory> {
    if (!dto.name) {
      throw new BadRequestException('分类名称不能为空');
    }
    return this.archiveV2Service.createCategory(dto);
  }

  @Patch('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      parentId?: string;
      sortOrder?: number;
      icon?: string;
      description?: string;
    },
  ): Promise<ArchiveCategory> {
    return this.archiveV2Service.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.archiveV2Service.deleteCategory(id);
    return { success: true };
  }

  // ===== 档案管理 =====

  @Get('archives')
  async getArchiveList(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('keyword') keyword?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('personIdCard') personIdCard?: string,
    @Query('householdNo') householdNo?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<ArchiveListResponse> {
    return this.archiveV2Service.getArchiveList({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      keyword,
      categoryId,
      status,
      year: year ? parseInt(year, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined,
      personIdCard,
      householdNo,
      includeDeleted: includeDeleted === 'true',
    });
  }

  @Get('archives/:id')
  async getArchiveDetail(
    @Param('id') id: string,
  ): Promise<ArchiveItem & { files: ArchiveFileItem[] }> {
    return this.archiveV2Service.getArchiveDetail(id);
  }

  @Post('archives')
  async createArchive(
    @Req() req: Request,
    @Body() dto: {
      title: string;
      categoryId?: string;
      year?: number;
      month?: number;
      formDate?: string;
      responsiblePerson?: string;
      status?: string;
      tags?: string;
      relatedPersons?: string;
      relatedHouseholds?: string;
      remark?: string;
    },
  ): Promise<ArchiveItem> {
    if (!dto.title) {
      throw new BadRequestException('档案标题不能为空');
    }
    return this.archiveV2Service.createArchive(dto, this.getOperatorId(req));
  }

  @Patch('archives/:id')
  async updateArchive(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: {
      title?: string;
      categoryId?: string;
      year?: number;
      month?: number;
      formDate?: string;
      responsiblePerson?: string;
      status?: string;
      tags?: string;
      relatedPersons?: string;
      relatedHouseholds?: string;
      remark?: string;
    },
  ): Promise<ArchiveItem> {
    return this.archiveV2Service.updateArchive(id, dto, this.getOperatorId(req));
  }

  @Delete('archives/:id')
  async deleteArchive(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.archiveV2Service.deleteArchive(id, this.getOperatorId(req));
    return { success: true };
  }

  @Post('archives/:id/restore')
  async restoreArchive(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.archiveV2Service.restoreArchive(id, this.getOperatorId(req));
    return { success: true };
  }

  @Post('archives/:id/permanent-delete')
  async permanentDelete(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.archiveV2Service.permanentDelete(id, this.getOperatorId(req));
    return { success: true };
  }

  @Patch('archives/:id/status')
  async updateArchiveStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: { status: string },
  ): Promise<{ success: boolean }> {
    if (!dto.status) {
      throw new BadRequestException('状态不能为空');
    }
    await this.archiveV2Service.updateArchiveStatus(id, dto.status, this.getOperatorId(req));
    return { success: true };
  }

  @Post('archives/batch-status')
  async batchUpdateStatus(
    @Req() req: Request,
    @Body() dto: { ids: string[]; status: string },
  ): Promise<{ success: boolean; updated: number }> {
    if (!dto.ids || !dto.status) {
      throw new BadRequestException('ids 和 status 不能为空');
    }
    const updated = await this.archiveV2Service.batchUpdateStatus(
      dto.ids,
      dto.status,
      this.getOperatorId(req),
    );
    return { success: true, updated };
  }

  // ===== 档案文件 =====

  @Get('archives/:id/files')
  async getArchiveFiles(
    @Param('id') archiveId: string,
  ): Promise<ArchiveFileItem[]> {
    return this.archiveV2Service.getArchiveFiles(archiveId);
  }

  @Post('archives/:id/files')
  async addArchiveFile(
    @Param('id') archiveId: string,
    @Body() dto: {
      fileName: string;
      filePath?: string;
      fileSize?: number;
      fileType?: string;
    },
  ): Promise<ArchiveFileItem> {
    if (!dto.fileName) {
      throw new BadRequestException('文件名不能为空');
    }
    return this.archiveV2Service.addArchiveFile(archiveId, dto);
  }

  @Delete('archives/files/:fileId')
  async deleteArchiveFile(
    @Param('fileId') fileId: string,
  ): Promise<{ success: boolean }> {
    await this.archiveV2Service.deleteArchiveFile(fileId);
    return { success: true };
  }

  // ===== 模板管理 =====

  @Get('templates')
  async getTemplateList(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ): Promise<{ items: ArchiveV2Template[]; total: number; page: number; pageSize: number }> {
    return this.archiveV2Service.getTemplateList({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      type,
      category,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('templates/:id')
  async getTemplate(@Param('id') id: string): Promise<ArchiveV2Template> {
    return this.archiveV2Service.getTemplate(id);
  }

  @Post('templates')
  async createTemplate(
    @Body() dto: {
      name: string;
      type: string;
      category?: string;
      variables?: string;
      namingRule?: string;
      description?: string;
      isActive?: boolean;
    },
  ): Promise<ArchiveV2Template> {
    if (!dto.name || !dto.type) {
      throw new BadRequestException('模板名称和类型不能为空');
    }
    return this.archiveV2Service.createTemplate(dto);
  }

  @Patch('templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      type?: string;
      category?: string;
      variables?: string;
      namingRule?: string;
      description?: string;
      isActive?: boolean;
    },
  ): Promise<ArchiveV2Template> {
    return this.archiveV2Service.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.archiveV2Service.deleteTemplate(id);
    return { success: true };
  }

  // ===== 提醒管理 =====

  @Get('reminders')
  async getReminderList(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('status') status?: string,
    @Query('type') type?: string,
  ): Promise<{ items: ArchiveReminder[]; total: number; page: number; pageSize: number }> {
    return this.archiveV2Service.getReminderList({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      status,
      type,
    });
  }

  @Post('reminders')
  async createReminder(
    @Body() dto: {
      title: string;
      type: string;
      archiveId?: string;
      reminderDate?: string;
      content?: string;
    },
  ): Promise<ArchiveReminder> {
    if (!dto.title || !dto.type) {
      throw new BadRequestException('标题和类型不能为空');
    }
    return this.archiveV2Service.createReminder(dto);
  }

  @Patch('reminders/:id')
  async updateReminder(
    @Param('id') id: string,
    @Body() dto: {
      title?: string;
      type?: string;
      archiveId?: string;
      reminderDate?: string;
      status?: string;
      content?: string;
    },
  ): Promise<ArchiveReminder> {
    return this.archiveV2Service.updateReminder(id, dto);
  }

  @Post('reminders/:id/done')
  async markReminderDone(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.archiveV2Service.markReminderDone(id);
    return { success: true };
  }

  @Delete('reminders/:id')
  async deleteReminder(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.archiveV2Service.deleteReminder(id);
    return { success: true };
  }

  // ===== 操作日志 =====

  @Get('operation-logs')
  async getOperationLogs(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('archiveId') archiveId?: string,
    @Query('operationType') operationType?: string,
  ): Promise<{ items: ArchiveOperationLog[]; total: number; page: number; pageSize: number }> {
    return this.archiveV2Service.getOperationLogs({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      archiveId,
      operationType,
    });
  }

  // ===== 工作台 =====

  @Get('dashboard/stats')
  async getDashboardStats(): Promise<ArchiveDashboardStats> {
    return this.archiveV2Service.getDashboardStats();
  }

  @Get('dashboard/recent')
  async getRecentData(
    @Query('limit') limit: string = '5',
  ): Promise<ArchiveRecentData> {
    return this.archiveV2Service.getRecentData(parseInt(limit, 10));
  }

  // ===== 快速生成 =====

  @Post('quick-generate')
  async quickGenerate(
    @Req() req: Request,
    @Body() dto: {
      templateId: string;
      year: number;
      month: number;
      community?: string;
      autoArchive?: boolean;
    },
  ): Promise<ArchiveItem> {
    if (!dto.templateId || !dto.year || !dto.month) {
      throw new BadRequestException('模板ID、年份、月份不能为空');
    }
    return this.archiveV2Service.quickGenerate(dto, this.getOperatorId(req));
  }

  // ===== 全文搜索 =====

  @Get('full-search')
  async fullSearch(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('keyword') keyword?: string,
    @Query('categoryId') categoryId?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('status') status?: string,
    @Query('personName') personName?: string,
    @Query('idCard') idCard?: string,
    @Query('householdNo') householdNo?: string,
  ): Promise<ArchiveListResponse> {
    return this.archiveV2Service.fullSearch({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      keyword,
      categoryId,
      year: year ? parseInt(year, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined,
      status,
      personName,
      idCard,
      householdNo,
    });
  }

  // ===== 台账中心 =====

  @Get('ledgers')
  async getLedgerList(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('keyword') keyword?: string,
    @Query('year') year?: string,
  ): Promise<ArchiveListResponse> {
    return this.archiveV2Service.getLedgerList({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      keyword,
      year: year ? parseInt(year, 10) : undefined,
    });
  }

  // ===== 待归档 =====

  @Get('pending')
  async getPendingArchives(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('keyword') keyword?: string,
    @Query('categoryId') categoryId?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ): Promise<ArchiveListResponse> {
    return this.archiveV2Service.getPendingArchives({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      keyword,
      categoryId,
      year: year ? parseInt(year, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined,
    });
  }

  // ===== 回收站 =====

  @Get('recycle')
  async getRecycleList(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('keyword') keyword?: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<ArchiveListResponse> {
    return this.archiveV2Service.getRecycleList({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      keyword,
      categoryId,
    });
  }
}