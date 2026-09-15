import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, count, ilike } from 'drizzle-orm';
import { civilAffairsStandards, operationLogs } from '@server/database/schema';
import type { ListResponse, CivilAffairsStandard } from '@shared/api.interface';

export interface OperationLog {
  id: string;
  operationType: string;
  moduleName: string;
  operationContent: string;
  operatorName: string;
  operationTime: string;
  ipAddress: string;
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getStandards(
    page: number,
    pageSize: number,
    type?: string,
    isActive?: boolean,
  ): Promise<ListResponse<CivilAffairsStandard>> {
    try {
      const conditions = [];
      if (type) {
        conditions.push(eq(civilAffairsStandards.standardType, type));
      }
      if (isActive !== undefined) {
        conditions.push(eq(civilAffairsStandards.isActive, isActive));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [totalResult, rows] = await Promise.all([
        whereClause
          ? this.db.select({ count: count() }).from(civilAffairsStandards).where(whereClause)
          : this.db.select({ count: count() }).from(civilAffairsStandards),
        this.db
          .select()
          .from(civilAffairsStandards)
          .where(whereClause)
          .orderBy(desc(civilAffairsStandards.effectiveDate))
          .limit(pageSize)
          .offset((page - 1) * pageSize),
      ]);

      const total = Number(totalResult[0]?.count ?? 0);
      const items = rows.map((row) => this.mapStandard(row));

      return { items, total, page, pageSize };
    } catch (error) {
      this.logger.error('获取补贴标准列表失败', JSON.stringify(error));
      throw error;
    }
  }

  async getOperationLogs(
    page: number,
    pageSize: number,
    moduleName?: string,
  ): Promise<ListResponse<OperationLog>> {
    try {
      const whereClause = moduleName
        ? eq(operationLogs.moduleName, moduleName)
        : undefined;

      const [totalResult, rows] = await Promise.all([
        whereClause
          ? this.db.select({ count: count() }).from(operationLogs).where(whereClause)
          : this.db.select({ count: count() }).from(operationLogs),
        this.db
          .select()
          .from(operationLogs)
          .where(whereClause)
          .orderBy(desc(operationLogs.operationTime))
          .limit(pageSize)
          .offset((page - 1) * pageSize),
      ]);

      const total = Number(totalResult[0]?.count ?? 0);
      const items = rows.map((row) => this.mapOperationLog(row));

      return { items, total, page, pageSize };
    } catch (error) {
      this.logger.error('获取操作日志列表失败', JSON.stringify(error));
      throw error;
    }
  }

  private mapStandard(row: typeof civilAffairsStandards.$inferSelect): CivilAffairsStandard {
    return {
      id: row.id,
      standardType: row.standardType,
      standardName: row.standardName,
      category: row.category ?? '',
      amount: Number(row.amount),
      unit: row.unit ?? '元/月',
      effectiveDate: row.effectiveDate
        ? String(row.effectiveDate)
        : '',
      expiryDate: row.expiryDate ? String(row.expiryDate) : undefined,
      isActive: row.isActive ?? true,
      version: row.version ?? 1,
      description: row.description ?? '',
    };
  }

  private mapOperationLog(row: typeof operationLogs.$inferSelect): OperationLog {
    return {
      id: row.id,
      operationType: row.operationType ?? '',
      moduleName: row.moduleName ?? '',
      operationContent: row.operationContent ?? '',
      operatorName: row.operatorName ?? '',
      operationTime: row.operationTime
        ? (row.operationTime instanceof Date
            ? row.operationTime.toISOString()
            : String(row.operationTime))
        : '',
      ipAddress: row.ipAddress ?? '',
    };
  }
}