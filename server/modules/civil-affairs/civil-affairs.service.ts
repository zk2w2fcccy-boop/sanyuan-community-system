import { Inject, Injectable } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { and, asc, desc, eq, gte, ilike, inArray, or, sql } from 'drizzle-orm';
import {
  lowIncome,
  specialPoverty,
  disabledPersons,
  elderlyAllowance,
  childSupport,
  homeCare,
  lowIncomeEdge,
  rigidExpenditure,
  temporaryAssistance,
  civilAffairsStandards,
  persons,
} from '@server/database/schema';
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

interface PaginationInput {
  page: number;
  pageSize: number;
}

interface LowIncomeParams extends PaginationInput {
  type?: string;
  status?: string;
  keyword?: string;
}

interface StatusKeywordParams extends PaginationInput {
  status?: string;
  keyword?: string;
}

interface KeywordParams extends PaginationInput {
  keyword?: string;
}

interface ElderlyAllowanceParams extends PaginationInput {
  ageGroup?: string;
  keyword?: string;
}

interface HomeCareParams extends PaginationInput {
  keyword?: string;
  includeExcluded?: string;
}

interface StandardsParams extends PaginationInput {
  type?: string;
  isActive?: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function normalizePagination(params: PaginationInput): { page: number; pageSize: number } {
  const page = Math.max(1, params.page || DEFAULT_PAGE);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize || DEFAULT_PAGE_SIZE));
  return { page, pageSize };
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
export class CivilAffairsService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getLowIncomeList(params: LowIncomeParams): Promise<ListResponse<LowIncome>> {
    const { page, pageSize } = normalizePagination(params);
    const conditions = [];
    if (params.type) conditions.push(eq(lowIncome.lowIncomeType, params.type));
    if (params.status) conditions.push(eq(lowIncome.currentStatus, params.status));
    if (params.keyword) {
      const kw = `%${params.keyword}%`;
      conditions.push(or(ilike(lowIncome.name, kw), ilike(lowIncome.idCard, kw)));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: this.db.$count(lowIncome) })
        .from(lowIncome)
        .where(whereClause),
      this.db
        .select()
        .from(lowIncome)
        .where(whereClause)
        .orderBy(desc(lowIncome.startDate))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const items: LowIncome[] = rows.map((row) => ({
      id: row.id,
      idCard: row.idCard,
      name: row.name ?? '',
      lowIncomeType: row.lowIncomeType,
      category: row.category,
      monthlyAmount: Number(row.monthlyAmount),
      startDate: dateToString(row.startDate),
      endDate: dateToOptionalString(row.endDate),
      currentStatus: row.currentStatus,
      exitReason: row.exitReason ?? '',
      householdNo: row.householdNo ?? '',
      guaranteeMembers: row.guaranteeMembers ?? 0,
      remark: row.remark ?? '',
    }));

    return { items, total, page, pageSize };
  }

  async getSpecialPovertyList(params: StatusKeywordParams): Promise<ListResponse<SpecialPoverty>> {
    const { page, pageSize } = normalizePagination(params);
    const conditions = [];
    if (params.status) conditions.push(eq(specialPoverty.currentStatus, params.status));
    if (params.keyword) {
      const kw = `%${params.keyword}%`;
      conditions.push(or(ilike(specialPoverty.name, kw), ilike(specialPoverty.idCard, kw)));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: this.db.$count(specialPoverty) })
        .from(specialPoverty)
        .where(whereClause),
      this.db
        .select()
        .from(specialPoverty)
        .where(whereClause)
        .orderBy(desc(specialPoverty.startDate))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const items: SpecialPoverty[] = rows.map((row) => ({
      id: row.id,
      idCard: row.idCard,
      name: row.name ?? '',
      supportType: row.supportType,
      supportMethod: row.supportMethod,
      nursingLevel: row.nursingLevel ?? '',
      basicAmount: Number(row.basicAmount),
      nursingAmount: Number(row.nursingAmount),
      totalAmount: Number(row.totalAmount),
      startDate: dateToString(row.startDate),
      endDate: dateToOptionalString(row.endDate),
      currentStatus: row.currentStatus,
      exitReason: row.exitReason ?? '',
      remark: row.remark ?? '',
    }));

    return { items, total, page, pageSize };
  }

  async getDisabledList(params: KeywordParams): Promise<ListResponse<DisabledPerson>> {
    const { page, pageSize } = normalizePagination(params);
    const conditions = [];
    if (params.keyword) {
      const kw = `%${params.keyword}%`;
      conditions.push(or(ilike(disabledPersons.name, kw), ilike(disabledPersons.idCard, kw)));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: this.db.$count(disabledPersons) })
        .from(disabledPersons)
        .where(whereClause),
      this.db
        .select()
        .from(disabledPersons)
        .where(whereClause)
        .orderBy(desc(disabledPersons.issueDate))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const items: DisabledPerson[] = rows.map((row) => ({
      id: row.id,
      idCard: row.idCard,
      name: row.name ?? '',
      disabilityCertNo: row.disabilityCertNo ?? '',
      disabilityCategory: row.disabilityCategory,
      disabilityLevel: row.disabilityLevel,
      issueDate: dateToString(row.issueDate),
      hasLivingSubsidy: row.hasLivingSubsidy ?? false,
      livingSubsidyAmount: Number(row.livingSubsidyAmount),
      hasNursingSubsidy: row.hasNursingSubsidy ?? false,
      nursingSubsidyAmount: Number(row.nursingSubsidyAmount),
      totalMonthlyAmount: Number(row.totalMonthlyAmount),
      currentStatus: row.currentStatus,
      remark: row.remark ?? '',
    }));

    return { items, total, page, pageSize };
  }

  async getElderlyAllowanceList(params: ElderlyAllowanceParams): Promise<ListResponse<ElderlyAllowance>> {
    const { page, pageSize } = normalizePagination(params);
    const conditions = [];
    if (params.ageGroup) conditions.push(eq(elderlyAllowance.ageGroup, params.ageGroup));
    if (params.keyword) {
      const kw = `%${params.keyword}%`;
      conditions.push(or(ilike(elderlyAllowance.name, kw), ilike(elderlyAllowance.idCard, kw)));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: this.db.$count(elderlyAllowance) })
        .from(elderlyAllowance)
        .where(whereClause),
      this.db
        .select()
        .from(elderlyAllowance)
        .where(whereClause)
        .orderBy(desc(elderlyAllowance.startDate))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const items: ElderlyAllowance[] = rows.map((row) => ({
      id: row.id,
      idCard: row.idCard,
      name: row.name ?? '',
      ageGroup: row.ageGroup,
      monthlyAmount: Number(row.monthlyAmount),
      startDate: dateToString(row.startDate),
      endDate: dateToOptionalString(row.endDate),
      currentStatus: row.currentStatus,
      exitReason: row.exitReason ?? '',
      remark: row.remark ?? '',
    }));

    return { items, total, page, pageSize };
  }

  async getChildSupportList(params: KeywordParams): Promise<ListResponse<ChildSupport>> {
    const { page, pageSize } = normalizePagination(params);
    const conditions = [];
    if (params.keyword) {
      const kw = `%${params.keyword}%`;
      conditions.push(or(ilike(childSupport.name, kw), ilike(childSupport.idCard, kw)));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: this.db.$count(childSupport) })
        .from(childSupport)
        .where(whereClause),
      this.db
        .select()
        .from(childSupport)
        .where(whereClause)
        .orderBy(desc(childSupport.startDate))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const items: ChildSupport[] = rows.map((row) => ({
      id: row.id,
      idCard: row.idCard,
      name: row.name ?? '',
      supportType: row.supportType,
      monthlyAmount: Number(row.monthlyAmount),
      startDate: dateToString(row.startDate),
      endDate: dateToOptionalString(row.endDate),
      currentStatus: row.currentStatus,
      exitReason: row.exitReason ?? '',
      guardianName: row.guardianName ?? '',
      guardianRelation: row.guardianRelation ?? '',
      guardianPhone: row.guardianPhone ?? '',
      remark: row.remark ?? '',
    }));

    return { items, total, page, pageSize };
  }

  async getHomeCareList(params: HomeCareParams): Promise<ListResponse<HomeCare>> {
    const { page, pageSize } = normalizePagination(params);
    const conditions = [];
    if (params.includeExcluded !== 'true') {
      conditions.push(eq(homeCare.isExcluded, false));
    }
    if (params.keyword) {
      const kw = `%${params.keyword}%`;
      conditions.push(or(ilike(homeCare.name, kw), ilike(homeCare.idCard, kw)));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: this.db.$count(homeCare) })
        .from(homeCare)
        .where(whereClause),
      this.db
        .select()
        .from(homeCare)
        .where(whereClause)
        .orderBy(desc(homeCare.startDate))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const items: HomeCare[] = rows.map((row) => ({
      id: row.id,
      idCard: row.idCard,
      name: row.name ?? '',
      serviceType: row.serviceType,
      serviceFrequency: row.serviceFrequency ?? '',
      startDate: dateToString(row.startDate),
      endDate: dateToOptionalString(row.endDate),
      currentStatus: row.currentStatus,
      serviceProvider: row.serviceProvider ?? '',
      contactPhone: row.contactPhone ?? '',
      remark: row.remark ?? '',
      isExcluded: row.isExcluded ?? false,
      exclusionReason: row.exclusionReason ?? '',
    }));

    return { items, total, page, pageSize };
  }

  async getHomeCareCandidates(): Promise<HomeCareCandidate[]> {
    // 低保享受中的人员
    const lowIncomeRows = await this.db
      .select({ idCard: lowIncome.idCard, name: lowIncome.name })
      .from(lowIncome)
      .where(eq(lowIncome.currentStatus, '享受中'));

    // 特困享受中的人员
    const specialPovertyRows = await this.db
      .select({
        idCard: specialPoverty.idCard,
        name: specialPoverty.name,
        supportMethod: specialPoverty.supportMethod,
      })
      .from(specialPoverty)
      .where(eq(specialPoverty.currentStatus, '享受中'));

    const liMap = new Map<string, string>();
    for (const row of lowIncomeRows) {
      liMap.set(row.idCard, row.name ?? '');
    }

    const spMap = new Map<string, { name: string; supportMethod: string }>();
    for (const row of specialPovertyRows) {
      spMap.set(row.idCard, {
        name: row.name ?? '',
        supportMethod: row.supportMethod ?? '',
      });
    }

    // 合并两个集合的所有身份证
    const allIdCards: string[] = Array.from(
      new Set([...liMap.keys(), ...spMap.keys()]),
    );

    if (allIdCards.length === 0) {
      return [];
    }

    // 从 persons 表筛选户籍正常且年龄 >= 60 的人员
    const personRows = await this.db
      .select({
        idCard: persons.idCard,
        name: persons.name,
        gender: persons.gender,
        birthDate: persons.birthDate,
        age: sql<number>`extract(year from age(current_date, ${persons.birthDate}))`,
      })
      .from(persons)
      .where(
        and(
          eq(persons.householdStatus, '正常'),
          inArray(persons.idCard, allIdCards),
          gte(
            sql<number>`extract(year from age(current_date, ${persons.birthDate}))`,
            60,
          ),
        ),
      )
      .orderBy(asc(persons.name));

    if (personRows.length === 0) {
      return [];
    }

    const candidateIdCards = personRows.map((r: { idCard: string }) => r.idCard);

    // 查询这些人在 home_care 表中的状态
    const homeCareRows = await this.db
      .select({
        idCard: homeCare.idCard,
        isExcluded: homeCare.isExcluded,
        exclusionReason: homeCare.exclusionReason,
        currentStatus: homeCare.currentStatus,
      })
      .from(homeCare)
      .where(inArray(homeCare.idCard, candidateIdCards));

    const hcMap = new Map<
      string,
      {
        isExcluded: boolean;
        exclusionReason: string;
        currentStatus: string;
      }
    >();
    for (const row of homeCareRows) {
      hcMap.set(row.idCard, {
        isExcluded: row.isExcluded ?? false,
        exclusionReason: row.exclusionReason ?? '',
        currentStatus: row.currentStatus ?? '',
      });
    }

    // 组装结果
    const candidates: HomeCareCandidate[] = personRows.map(
      (row: {
        idCard: string;
        name: string;
        gender: string;
        birthDate: string;
        age: number;
      }) => {
        const idCard = row.idCard;
        const isLowIncome = liMap.has(idCard);
        const spInfo = spMap.get(idCard);
        const isSpecialPoverty = !!spInfo;

        // 特困优先
        let welfareType = '';
        let supportMethod: string | undefined;
        if (isSpecialPoverty) {
          welfareType = '特困';
          supportMethod = spInfo!.supportMethod || undefined;
        } else if (isLowIncome) {
          welfareType = '低保';
        }

        const hcInfo = hcMap.get(idCard);
        let isExcluded = hcInfo?.isExcluded ?? false;
        let exclusionReason = hcInfo?.exclusionReason ?? '';
        const alreadyInService =
          !!hcInfo &&
          hcInfo.currentStatus === '服务中' &&
          !hcInfo.isExcluded;

        // 特困集中供养自动排除
        if (isSpecialPoverty && spInfo!.supportMethod === '集中供养') {
          isExcluded = true;
          if (!exclusionReason) {
            exclusionReason = '集中供养';
          }
        }

        return {
          idCard: row.idCard,
          name: row.name ?? '',
          gender: row.gender ?? '',
          birthDate: dateToString(row.birthDate),
          age: Number(row.age),
          welfareType,
          supportMethod,
          isExcluded,
          exclusionReason,
          alreadyInService,
        };
      },
    );

    return candidates;
  }

  async toggleHomeCareExclusion(
    idCard: string,
    reason: string | null,
  ): Promise<void> {
    const existing = await this.db
      .select()
      .from(homeCare)
      .where(eq(homeCare.idCard, idCard))
      .limit(1);

    if (existing.length > 0) {
      // 更新现有记录
      const patch: Partial<typeof homeCare.$inferInsert> = {};
      if (reason !== null) {
        patch.isExcluded = true;
        patch.exclusionReason = reason;
      } else {
        patch.isExcluded = false;
        patch.exclusionReason = null;
      }
      await this.db
        .update(homeCare)
        .set(patch)
        .where(eq(homeCare.idCard, idCard));
    } else if (reason !== null) {
      // 插入新记录
      await this.db.insert(homeCare).values({
        idCard,
        serviceType: '居家养老上门服务',
        currentStatus: '未服务',
        isExcluded: true,
        exclusionReason: reason,
      });
    }
  }

  async addHomeCareFromCandidate(idCard: string): Promise<void> {
    const existing = await this.db
      .select()
      .from(homeCare)
      .where(eq(homeCare.idCard, idCard))
      .limit(1);

    const today = new Date().toISOString().slice(0, 10);

    if (existing.length > 0) {
      await this.db
        .update(homeCare)
        .set({
          currentStatus: '服务中',
          isExcluded: false,
          exclusionReason: null,
          startDate: today,
        })
        .where(eq(homeCare.idCard, idCard));
    } else {
      const personRows = await this.db
        .select({ name: persons.name })
        .from(persons)
        .where(eq(persons.idCard, idCard))
        .limit(1);
      const name = personRows[0]?.name ?? '';

      await this.db.insert(homeCare).values({
        idCard,
        name,
        serviceType: '居家养老上门服务',
        serviceFrequency: '每月4次',
        startDate: today,
        currentStatus: '服务中',
        serviceProvider: '社区居家养老服务中心',
        contactPhone: '',
        isExcluded: false,
        exclusionReason: '',
      });
    }
  }

  async getLowIncomeEdgeList(params: KeywordParams): Promise<ListResponse<LowIncomeEdge>> {
    const { page, pageSize } = normalizePagination(params);
    const conditions = [];
    if (params.keyword) {
      const kw = `%${params.keyword}%`;
      conditions.push(or(ilike(lowIncomeEdge.name, kw), ilike(lowIncomeEdge.idCard, kw)));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: this.db.$count(lowIncomeEdge) })
        .from(lowIncomeEdge)
        .where(whereClause),
      this.db
        .select()
        .from(lowIncomeEdge)
        .where(whereClause)
        .orderBy(desc(lowIncomeEdge.startDate))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const items: LowIncomeEdge[] = rows.map((row) => ({
      id: row.id,
      idCard: row.idCard,
      name: row.name ?? '',
      householdNo: row.householdNo ?? '',
      familyMembers: row.familyMembers ?? 0,
      startDate: dateToString(row.startDate),
      endDate: dateToOptionalString(row.endDate),
      currentStatus: row.currentStatus,
      exitReason: row.exitReason ?? '',
      familySituation: row.familySituation ?? '',
      remark: row.remark ?? '',
    }));

    return { items, total, page, pageSize };
  }

  async getRigidExpenditureList(params: KeywordParams): Promise<ListResponse<RigidExpenditure>> {
    const { page, pageSize } = normalizePagination(params);
    const conditions = [];
    if (params.keyword) {
      const kw = `%${params.keyword}%`;
      conditions.push(or(
        ilike(rigidExpenditure.name, kw),
        ilike(rigidExpenditure.idCard, kw),
        ilike(rigidExpenditure.householdNo, kw),
      ));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: this.db.$count(rigidExpenditure) })
        .from(rigidExpenditure)
        .where(whereClause),
      this.db
        .select()
        .from(rigidExpenditure)
        .where(whereClause)
        .orderBy(desc(rigidExpenditure.startDate))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const items: RigidExpenditure[] = rows.map((row) => ({
      id: row.id,
      idCard: row.idCard,
      name: row.name ?? '',
      householdNo: row.householdNo ?? '',
      familyMembers: row.familyMembers ?? 1,
      startDate: dateToString(row.startDate),
      endDate: dateToOptionalString(row.endDate),
      currentStatus: row.currentStatus ?? '享受中',
      exitReason: row.exitReason ?? '',
      familySituation: row.familySituation ?? '',
      remark: row.remark ?? '',
    }));

    return { items, total, page, pageSize };
  }

  async getRigidExpenditureById(id: string): Promise<RigidExpenditure> {
    const rows = await this.db
      .select()
      .from(rigidExpenditure)
      .where(eq(rigidExpenditure.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new Error('记录不存在');
    }
    const row = rows[0];
    return {
      id: row.id,
      idCard: row.idCard,
      name: row.name ?? '',
      householdNo: row.householdNo ?? '',
      familyMembers: row.familyMembers ?? 1,
      startDate: dateToString(row.startDate),
      endDate: dateToOptionalString(row.endDate),
      currentStatus: row.currentStatus ?? '享受中',
      exitReason: row.exitReason ?? '',
      familySituation: row.familySituation ?? '',
      remark: row.remark ?? '',
    };
  }

  async createRigidExpenditure(dto: {
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
  }): Promise<RigidExpenditure> {
    const inserted = await this.db
      .insert(rigidExpenditure)
      .values({
        idCard: dto.idCard,
        name: dto.name,
        householdNo: dto.householdNo,
        familyMembers: dto.familyMembers ?? 1,
        startDate: dto.startDate,
        endDate: dto.endDate ?? null,
        currentStatus: dto.currentStatus ?? '享受中',
        exitReason: dto.exitReason,
        familySituation: dto.familySituation,
        remark: dto.remark,
      })
      .returning();

    const row = inserted[0];
    return {
      id: row.id,
      idCard: row.idCard,
      name: row.name ?? '',
      householdNo: row.householdNo ?? '',
      familyMembers: row.familyMembers ?? 1,
      startDate: dateToString(row.startDate),
      endDate: dateToOptionalString(row.endDate),
      currentStatus: row.currentStatus ?? '享受中',
      exitReason: row.exitReason ?? '',
      familySituation: row.familySituation ?? '',
      remark: row.remark ?? '',
    };
  }

  async updateRigidExpenditure(
    id: string,
    dto: {
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
    const patch: Partial<typeof rigidExpenditure.$inferInsert> = {};
    if (dto.idCard !== undefined) patch.idCard = dto.idCard;
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.householdNo !== undefined) patch.householdNo = dto.householdNo;
    if (dto.familyMembers !== undefined) patch.familyMembers = dto.familyMembers;
    if (dto.startDate !== undefined) patch.startDate = dto.startDate;
    if (dto.endDate !== undefined) patch.endDate = dto.endDate ?? null;
    if (dto.currentStatus !== undefined) patch.currentStatus = dto.currentStatus;
    if (dto.exitReason !== undefined) patch.exitReason = dto.exitReason;
    if (dto.familySituation !== undefined) patch.familySituation = dto.familySituation;
    if (dto.remark !== undefined) patch.remark = dto.remark;

    const updated = await this.db
      .update(rigidExpenditure)
      .set(patch)
      .where(eq(rigidExpenditure.id, id))
      .returning();

    if (updated.length === 0) {
      throw new Error('记录不存在');
    }
    const row = updated[0];
    return {
      id: row.id,
      idCard: row.idCard,
      name: row.name ?? '',
      householdNo: row.householdNo ?? '',
      familyMembers: row.familyMembers ?? 1,
      startDate: dateToString(row.startDate),
      endDate: dateToOptionalString(row.endDate),
      currentStatus: row.currentStatus ?? '享受中',
      exitReason: row.exitReason ?? '',
      familySituation: row.familySituation ?? '',
      remark: row.remark ?? '',
    };
  }

  async deleteRigidExpenditure(id: string): Promise<void> {
    const deleted = await this.db
      .delete(rigidExpenditure)
      .where(eq(rigidExpenditure.id, id))
      .returning({ id: rigidExpenditure.id });
    if (deleted.length === 0) {
      throw new Error('记录不存在');
    }
  }

  async getTemporaryAssistanceList(params: KeywordParams): Promise<ListResponse<TemporaryAssistance>> {
    const { page, pageSize } = normalizePagination(params);
    const conditions = [];
    if (params.keyword) {
      const kw = `%${params.keyword}%`;
      conditions.push(or(ilike(temporaryAssistance.name, kw), ilike(temporaryAssistance.idCard, kw)));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: this.db.$count(temporaryAssistance) })
        .from(temporaryAssistance)
        .where(whereClause),
      this.db
        .select()
        .from(temporaryAssistance)
        .where(whereClause)
        .orderBy(desc(temporaryAssistance.assistanceDate))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const items: TemporaryAssistance[] = rows.map((row) => ({
      id: row.id,
      idCard: row.idCard,
      name: row.name ?? '',
      assistanceDate: dateToString(row.assistanceDate),
      assistanceReason: row.assistanceReason ?? '',
      assistanceType: row.assistanceType ?? '',
      assistanceAmount: Number(row.assistanceAmount),
      operator: row.operator ?? '',
      remark: row.remark ?? '',
    }));

    return { items, total, page, pageSize };
  }

  async getStandardsList(params: StandardsParams): Promise<ListResponse<CivilAffairsStandard>> {
    const { page, pageSize } = normalizePagination(params);
    const conditions = [];
    if (params.type) conditions.push(eq(civilAffairsStandards.standardType, params.type));
    if (params.isActive !== undefined && params.isActive !== '') {
      conditions.push(eq(civilAffairsStandards.isActive, params.isActive === 'true'));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: this.db.$count(civilAffairsStandards) })
        .from(civilAffairsStandards)
        .where(whereClause),
      this.db
        .select()
        .from(civilAffairsStandards)
        .where(whereClause)
        .orderBy(desc(civilAffairsStandards.effectiveDate))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const items: CivilAffairsStandard[] = rows.map((row) => ({
      id: row.id,
      standardType: row.standardType,
      standardName: row.standardName,
      category: row.category ?? '',
      amount: Number(row.amount),
      unit: row.unit ?? '',
      effectiveDate: dateToString(row.effectiveDate),
      expiryDate: dateToOptionalString(row.expiryDate),
      isActive: row.isActive ?? true,
      version: row.version ?? 1,
      description: row.description ?? '',
    }));

    return { items, total, page, pageSize };
  }
}