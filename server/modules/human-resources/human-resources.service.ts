import { Injectable, Inject } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, sql, ilike, or, gte, lt, inArray, notInArray } from 'drizzle-orm';
import {
  medicalInsurance,
  pensionInsurance,
  persons,
} from '@server/database/schema';
import type {
  MedicalInsurance,
  PensionInsurance,
  ListResponse,
} from '@shared/api.interface';

interface MedicalInsuranceParams {
  page: number;
  pageSize: number;
  year: number;
  status?: string;
  keyword?: string;
}

interface PensionInsuranceParams {
  page: number;
  pageSize: number;
  treatmentStatus?: string;
  keyword?: string;
}

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

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function normalizePagination(page: number, pageSize: number): { page: number; pageSize: number } {
  const p = Math.max(1, page || 1);
  const ps = Math.min(MAX_PAGE_SIZE, Math.max(1, pageSize || DEFAULT_PAGE_SIZE));
  return { page: p, pageSize: ps };
}

function dateToString(val: string | null | undefined): string {
  if (val == null) return '';
  return val;
}

function dateToOptionalString(val: string | null | undefined): string | undefined {
  if (val == null) return undefined;
  return val;
}

@Injectable()
export class HumanResourcesService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getMedicalInsuranceList(
    params: MedicalInsuranceParams,
  ): Promise<ListResponse<MedicalInsurance>> {
    const { page, pageSize } = normalizePagination(params.page, params.pageSize);
    const conditions = [eq(medicalInsurance.insuranceYear, params.year)];
    if (params.status) {
      conditions.push(eq(medicalInsurance.paymentStatus, params.status));
    }
    if (params.keyword) {
      const kw = `%${params.keyword}%`;
      conditions.push(or(ilike(medicalInsurance.name, kw), ilike(medicalInsurance.idCard, kw)));
    }
    const whereClause = and(...conditions);

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: this.db.$count(medicalInsurance) })
        .from(medicalInsurance)
        .where(whereClause),
      this.db
        .select()
        .from(medicalInsurance)
        .where(whereClause)
        .orderBy(desc(medicalInsurance.paymentDate))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const items: MedicalInsurance[] = rows.map((row) => ({
      id: row.id,
      idCard: row.idCard,
      name: row.name ?? '',
      insuranceYear: row.insuranceYear,
      paymentAmount: Number(row.paymentAmount),
      paymentDate: dateToString(row.paymentDate),
      paymentMethod: row.paymentMethod ?? '',
      receiptNo: row.receiptNo ?? '',
      paymentStatus: row.paymentStatus,
      isNewlyAdded: row.isNewlyAdded ?? false,
      remark: row.remark ?? '',
    }));

    return { items, total, page, pageSize };
  }

  async getMedicalInsuranceStats(year: number): Promise<MedicalInsuranceStats> {
    const normalPopulationPromise = this.db
      .select({ count: this.db.$count(persons) })
      .from(persons)
      .where(eq(persons.householdStatus, '正常'));

    const paidResultPromise = this.db
      .select({ idCard: medicalInsurance.idCard })
      .from(medicalInsurance)
      .where(eq(medicalInsurance.insuranceYear, year));

    const [[normalRow], paidRows] = await Promise.all([normalPopulationPromise, paidResultPromise]);

    const shouldPayCount = Number(normalRow?.count ?? 0);
    const paidIdCards = new Set(paidRows.map((r) => r.idCard));
    const paidCount = paidIdCards.size;
    const unpaidCount = Math.max(0, shouldPayCount - paidCount);
    const paymentRate = shouldPayCount > 0
      ? Math.round((paidCount / shouldPayCount) * 10000) / 100
      : 0;

    const years: number[] = [year - 2, year - 1, year];
    const historyResult = await this.db
      .select({
        year: medicalInsurance.insuranceYear,
        paid: sql<number>`count(distinct ${medicalInsurance.idCard})`,
      })
      .from(medicalInsurance)
      .where(inArray(medicalInsurance.insuranceYear, years))
      .groupBy(medicalInsurance.insuranceYear)
      .orderBy(medicalInsurance.insuranceYear);

    const historyMap = new Map<number, { paid: number; rate: number }>();
    for (const hr of historyResult) {
      const paid = Number(hr.paid ?? 0);
      historyMap.set(hr.year, {
        paid,
        rate: shouldPayCount > 0 ? Math.round((paid / shouldPayCount) * 10000) / 100 : 0,
      });
    }

    const history = years.map((y: number) => {
      const entry = historyMap.get(y);
      return { year: y, paid: entry?.paid ?? 0, rate: entry?.rate ?? 0 };
    });

    return {
      shouldPayCount,
      paidCount,
      unpaidCount,
      newlyAddedCount: 0,
      paymentRate,
      history,
    };
  }

  async getUnpaidList(
    params: { page: number; pageSize: number; year: number; keyword?: string },
  ): Promise<ListResponse<{ id: string; idCard: string; name: string; insuranceYear: number; paymentStatus: string }>> {
    const { page, pageSize } = normalizePagination(params.page, params.pageSize);

    const paidSubquery = this.db
      .select({ idCard: medicalInsurance.idCard })
      .from(medicalInsurance)
      .where(eq(medicalInsurance.insuranceYear, params.year));

    const paidIdCards = (await paidSubquery).map((r) => r.idCard);

    const conditions = [eq(persons.householdStatus, '正常')];
    if (paidIdCards.length > 0) {
      conditions.push(notInArray(persons.idCard, paidIdCards));
    }
    if (params.keyword) {
      const kw = `%${params.keyword}%`;
      conditions.push(or(ilike(persons.name, kw), ilike(persons.idCard, kw)));
    }
    const whereClause = and(...conditions);

    const [countResult, rows] = await Promise.all([
      this.db.select({ count: this.db.$count(persons) }).from(persons).where(whereClause),
      this.db
        .select({ id: persons.id, idCard: persons.idCard, name: persons.name })
        .from(persons)
        .where(whereClause)
        .orderBy(persons.name)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const items = rows.map((row) => ({
      id: row.id,
      idCard: row.idCard,
      name: row.name ?? '',
      insuranceYear: params.year,
      paymentStatus: '未缴费',
    }));

    return { items, total, page, pageSize };
  }

  async batchImportMedicalInsurance(
    records: Array<{ idCard: string; name: string; insuranceYear: number; paymentAmount: number; paymentDate?: string }>,
  ): Promise<{ imported: number; updated: number; failed: number; errors: string[] }> {
    let imported = 0;
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      try {
        if (!rec.idCard || !rec.name || !rec.insuranceYear) {
          failed++;
          errors.push(`第${i + 1}行：缺少必要字段（身份证/姓名/年度）`);
          continue;
        }
        const existing = await this.db
          .select()
          .from(medicalInsurance)
          .where(and(
            eq(medicalInsurance.idCard, rec.idCard),
            eq(medicalInsurance.insuranceYear, rec.insuranceYear),
          ))
          .limit(1);

        if (existing.length > 0) {
          await this.db
            .update(medicalInsurance)
            .set({
              paymentAmount: String(rec.paymentAmount ?? existing[0].paymentAmount),
              paymentDate: rec.paymentDate ?? existing[0].paymentDate,
            })
            .where(eq(medicalInsurance.id, existing[0].id));
          updated++;
        } else {
          await this.db.insert(medicalInsurance).values({
            idCard: rec.idCard,
            name: rec.name,
            insuranceYear: rec.insuranceYear,
            paymentAmount: String(rec.paymentAmount ?? 0),
            paymentDate: rec.paymentDate ?? null,
            paymentStatus: '已缴费',
          });
          imported++;
        }
      } catch (err) {
        failed++;
        errors.push(`第${i + 1}行：${err instanceof Error ? err.message : '导入失败'}`);
      }
    }

    return { imported, updated, failed, errors };
  }

  async getPensionInsuranceList(
    params: PensionInsuranceParams,
  ): Promise<ListResponse<PensionInsurance>> {
    const { page, pageSize } = normalizePagination(params.page, params.pageSize);
    const conditions = [];
    if (params.treatmentStatus) {
      conditions.push(eq(pensionInsurance.treatmentStatus, params.treatmentStatus));
    }
    if (params.keyword) {
      const kw = `%${params.keyword}%`;
      conditions.push(or(ilike(pensionInsurance.name, kw), ilike(pensionInsurance.idCard, kw)));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: this.db.$count(pensionInsurance) })
        .from(pensionInsurance)
        .where(whereClause),
      this.db
        .select()
        .from(pensionInsurance)
        .where(whereClause)
        .orderBy(desc(pensionInsurance.insuredYear))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const items: PensionInsurance[] = rows.map((row) => ({
      id: row.id,
      idCard: row.idCard,
      name: row.name ?? '',
      isInsured: row.isInsured ?? false,
      insuredYear: row.insuredYear ?? 0,
      paymentYears: row.paymentYears ?? 0,
      cumulativePaymentYears: Number(row.cumulativePaymentYears),
      insuredStatus: row.insuredStatus ?? '',
      treatmentStatus: row.treatmentStatus ?? '',
      treatmentStartDate: dateToOptionalString(row.treatmentStartDate),
      monthlyTreatmentAmount: Number(row.monthlyTreatmentAmount),
      isReceivingPension: row.isReceivingPension ?? false,
      ageReminderType: row.ageReminderType ?? '',
      verificationStatus: row.verificationStatus ?? '',
      pensionType: row.pensionType ?? '居民养老',
      remark: row.remark ?? '',
    }));

    return { items, total, page, pageSize };
  }

  async getPensionInsuranceStats(): Promise<PensionInsuranceStats> {
    const result = await this.db
      .select({
        insured: sql<number>`count(*) filter (where ${pensionInsurance.isInsured} = true)`,
        thisMonth60: sql<number>`count(*) filter (where ${pensionInsurance.ageReminderType} = '本月满60岁')`,
        futureAge: sql<number>`count(*) filter (where ${pensionInsurance.treatmentStatus} = '即将到龄')`,
        toVerify: sql<number>`count(*) filter (where ${pensionInsurance.verificationStatus} = '待核实')`,
        receiving: sql<number>`count(*) filter (where ${pensionInsurance.isReceivingPension} = true)`,
      })
      .from(pensionInsurance);

    const row = result[0];
    return {
      insuredCount: Number(row?.insured ?? 0),
      thisMonth60Count: Number(row?.thisMonth60 ?? 0),
      futureAgeCount: Number(row?.futureAge ?? 0),
      toVerifyCount: Number(row?.toVerify ?? 0),
      receivingCount: Number(row?.receiving ?? 0),
    };
  }

  async updatePensionType(idCard: string, pensionType: string): Promise<void> {
    const validTypes = ['职工养老', '居民养老', '待确认'];
    if (!validTypes.includes(pensionType)) {
      throw new Error('无效的养老类型');
    }
    const existing = await this.db
      .select({ id: pensionInsurance.id })
      .from(pensionInsurance)
      .where(eq(pensionInsurance.idCard, idCard))
      .limit(1);

    if (existing.length > 0) {
      await this.db
        .update(pensionInsurance)
        .set({ pensionType })
        .where(eq(pensionInsurance.idCard, idCard));
    } else {
      await this.db.insert(pensionInsurance).values({
        idCard,
        pensionType,
        isInsured: true,
        insuredStatus: '正常参保',
        treatmentStatus: '未到龄',
        verificationStatus: '待核实',
      });
    }
  }

  async batchImportPensionInsurance(records: Array<{ idCard: string; name: string; pensionType?: string; insuredYear?: number }>): Promise<{ imported: number; updated: number; failed: number }> {
    let imported = 0;
    let updated = 0;
    let failed = 0;

    for (const rec of records) {
      if (!rec.idCard || !rec.name) {
        failed += 1;
        continue;
      }
      try {
        const existing = await this.db
          .select({ id: pensionInsurance.id })
          .from(pensionInsurance)
          .where(eq(pensionInsurance.idCard, rec.idCard))
          .limit(1);

        if (existing.length > 0) {
          const patch: Partial<typeof pensionInsurance.$inferInsert> = {};
          if (rec.name) patch.name = rec.name;
          if (rec.pensionType) patch.pensionType = rec.pensionType;
          if (rec.insuredYear) patch.insuredYear = rec.insuredYear;
          if (Object.keys(patch).length > 0) {
            await this.db
              .update(pensionInsurance)
              .set(patch)
              .where(eq(pensionInsurance.idCard, rec.idCard));
          }
          updated += 1;
        } else {
          await this.db.insert(pensionInsurance).values({
            idCard: rec.idCard,
            name: rec.name,
            pensionType: rec.pensionType || '居民养老',
            insuredYear: rec.insuredYear || new Date().getFullYear(),
            isInsured: true,
            insuredStatus: '正常参保',
            treatmentStatus: '未到龄',
            verificationStatus: '待核实',
          });
          imported += 1;
        }
      } catch {
        failed += 1;
      }
    }

    return { imported, updated, failed };
  }
}