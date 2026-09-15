import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, sql, count, gte, lt, ne, inArray } from 'drizzle-orm';
import {
  persons,
  deathRecords,
  medicalInsurance,
  pensionInsurance,
  lowIncome,
  specialPoverty,
  disabledPersons,
  elderlyAllowance,
  childSupport,
  homeCare,
  lowIncomeEdge,
} from '@server/database/schema';
import type { ListResponse, DataCheckItem } from '@shared/api.interface';

interface TodoItemSimple {
  type: string;
  title: string;
  count: number;
}

interface TodoCategory {
  total: number;
  items: TodoItemSimple[];
}

interface TodoSummary {
  ageReminder: TodoCategory;
  medicalInsurance: TodoCategory;
  pension: TodoCategory;
  population: TodoCategory;
  status: TodoCategory;
  treatment: TodoCategory;
}

@Injectable()
export class TodoService {
  private readonly logger = new Logger(TodoService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getSummary(): Promise<TodoSummary> {
    try {
      const currentYear = 2026;
      const now = new Date();
      const currYear = now.getFullYear();
      const currMonth = now.getMonth() + 1;

      const [
        age60Result,
        age80Result,
        age90Result,
        age100Result,
        medUnpaidResult,
        medDuplicateResult,
        pensionToAgeUnverifiedResult,
        pensionUninsuredResult,
        pensionYearsCheckResult,
        dupIdCardResult,
        infoAbnormalResult,
        deathInBusinessResult,
        movedOutInBusinessResult,
        deathWithTreatmentResult,
      ] = await Promise.all([
        this.countBirthdayInMonth(60),
        this.countBirthdayInMonth(80),
        this.countBirthdayInMonth(90),
        this.countBirthdayInMonth(100),
        this.db
          .select({ count: count() })
          .from(medicalInsurance)
          .where(
            and(
              eq(medicalInsurance.insuranceYear, currentYear),
              ne(medicalInsurance.paymentStatus, '已缴费'),
            ),
          ),
        this.db
          .select({ idCard: medicalInsurance.idCard, cnt: count() })
          .from(medicalInsurance)
          .where(eq(medicalInsurance.insuranceYear, currentYear))
          .groupBy(medicalInsurance.idCard)
          .having(sql`count(*) > 1`),
        this.db
          .select({ count: count() })
          .from(pensionInsurance)
          .where(
            and(
              eq(pensionInsurance.treatmentStatus, '已到龄'),
              eq(pensionInsurance.verificationStatus, '待核实'),
            ),
          ),
        this.db
          .select({ count: count() })
          .from(persons)
          .leftJoin(pensionInsurance, eq(persons.idCard, pensionInsurance.idCard))
          .where(and(
            eq(persons.householdStatus, '正常'),
            sql`${pensionInsurance.idCard} is null or ${pensionInsurance.isInsured} = false`,
          )),
        this.db
          .select({ count: count() })
          .from(pensionInsurance)
          .where(
            and(
              eq(pensionInsurance.isInsured, true),
              lt(pensionInsurance.cumulativePaymentYears, '15'),
            ),
          ),
        this.db
          .select({ idCard: persons.idCard, cnt: count() })
          .from(persons)
          .groupBy(persons.idCard)
          .having(sql`count(*) > 1`),
        this.db
          .select({ count: count() })
          .from(persons)
          .where(
            and(
              eq(persons.householdStatus, '正常'),
              sql`(${persons.phone} is null or ${persons.phone} = '')
                  and (${persons.idCard} is null or length(${persons.idCard}) < 18)`,
            ),
          ),
        this.db
          .select({ count: count() })
          .from(deathRecords)
          .innerJoin(
            medicalInsurance,
            and(
              eq(deathRecords.idCard, medicalInsurance.idCard),
              eq(medicalInsurance.insuranceYear, currentYear),
              eq(medicalInsurance.paymentStatus, '已缴费'),
            ),
          ),
        this.db
          .select({ count: count() })
          .from(persons)
          .where(eq(persons.householdStatus, '迁出'))
          .innerJoin(
            medicalInsurance,
            and(
              eq(persons.idCard, medicalInsurance.idCard),
              eq(medicalInsurance.insuranceYear, currentYear),
            ),
          ),
        this.getDeathWithTreatmentCount(),
      ]);

      const ageItems: TodoItemSimple[] = [
        { type: 'age_60', title: '60周岁到龄提醒', count: age60Result },
        { type: 'age_80', title: '80周岁到龄提醒', count: age80Result },
        { type: 'age_90', title: '90周岁到龄提醒', count: age90Result },
        { type: 'age_100', title: '100周岁到龄提醒', count: age100Result },
      ];

      const medItems: TodoItemSimple[] = [
        { type: 'unpaid', title: '医保未缴费', count: Number(medUnpaidResult[0]?.count ?? 0) },
        { type: 'duplicate', title: '医保重复缴费', count: medDuplicateResult.length },
      ];

      const pensionItems: TodoItemSimple[] = [
        {
          type: 'to_age_unverified',
          title: '到龄未核实',
          count: Number(pensionToAgeUnverifiedResult[0]?.count ?? 0),
        },
        { type: 'uninsured', title: '应保未保', count: Number(pensionUninsuredResult[0]?.count ?? 0) },
        {
          type: 'years_check',
          title: '缴费年限待核查',
          count: Number(pensionYearsCheckResult[0]?.count ?? 0),
        },
      ];

      const popItems: TodoItemSimple[] = [
        { type: 'dup_id_card', title: '身份证号重复', count: dupIdCardResult.length },
        { type: 'info_abnormal', title: '基本信息异常', count: Number(infoAbnormalResult[0]?.count ?? 0) },
      ];

      const statusItems: TodoItemSimple[] = [
        {
          type: 'death_in_business',
          title: '死亡人员仍在业务名单',
          count: Number(deathInBusinessResult[0]?.count ?? 0),
        },
        {
          type: 'moved_out_in_business',
          title: '迁出人员仍在业务名单',
          count: Number(movedOutInBusinessResult[0]?.count ?? 0),
        },
      ];

      const treatmentItems: TodoItemSimple[] = [
        { type: 'death_with_treatment', title: '死亡人员仍有待遇', count: deathWithTreatmentResult },
      ];

      return {
        ageReminder: { total: ageItems.reduce((s, i) => s + i.count, 0), items: ageItems },
        medicalInsurance: { total: medItems.reduce((s, i) => s + i.count, 0), items: medItems },
        pension: { total: pensionItems.reduce((s, i) => s + i.count, 0), items: pensionItems },
        population: { total: popItems.reduce((s, i) => s + i.count, 0), items: popItems },
        status: { total: statusItems.reduce((s, i) => s + i.count, 0), items: statusItems },
        treatment: { total: treatmentItems.reduce((s, i) => s + i.count, 0), items: treatmentItems },
      };
    } catch (error) {
      this.logger.error('获取待办汇总失败', JSON.stringify(error));
      throw error;
    }
  }

  async getChecks(
    page: number,
    pageSize: number,
    category?: string,
    severity?: string,
  ): Promise<ListResponse<DataCheckItem>> {
    try {
      const allChecks = await this.generateCheckItems();
      let filtered = allChecks;
      if (category) {
        filtered = filtered.filter((c) => c.category === category);
      }
      if (severity) {
        filtered = filtered.filter((c) => c.severity === severity);
      }
      const total = filtered.length;
      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);
      return { items, total, page, pageSize };
    } catch (error) {
      this.logger.error('获取数据核查列表失败', JSON.stringify(error));
      throw error;
    }
  }

  private async generateCheckItems(): Promise<DataCheckItem[]> {
    const currentYear = 2026;

    const [
      age60Ids,
      age80Ids,
      age90Ids,
      age100Ids,
      medUnpaidRows,
      medDuplicateRows,
      pensionToAgeRows,
      pensionUninsuredRows,
      pensionYearsRows,
      dupIdCardRows,
      infoAbnormalRows,
      deathInBusinessRows,
      movedOutInBusinessRows,
      deathWithTreatmentRows,
    ] = await Promise.all([
      this.getBirthdayInMonthIds(60),
      this.getBirthdayInMonthIds(80),
      this.getBirthdayInMonthIds(90),
      this.getBirthdayInMonthIds(100),
      this.db
        .select({ id: medicalInsurance.id, idCard: medicalInsurance.idCard })
        .from(medicalInsurance)
        .where(
          and(
            eq(medicalInsurance.insuranceYear, currentYear),
            ne(medicalInsurance.paymentStatus, '已缴费'),
          ),
        )
        .limit(100),
      this.db
        .select({ idCard: medicalInsurance.idCard, cnt: count() })
        .from(medicalInsurance)
        .where(eq(medicalInsurance.insuranceYear, currentYear))
        .groupBy(medicalInsurance.idCard)
        .having(sql`count(*) > 1`)
        .limit(100),
      this.db
        .select({ id: pensionInsurance.id, idCard: pensionInsurance.idCard })
        .from(pensionInsurance)
        .where(
          and(
            eq(pensionInsurance.treatmentStatus, '已到龄'),
            eq(pensionInsurance.verificationStatus, '待核实'),
          ),
        )
        .limit(100),
        this.db
          .select({ id: persons.id, idCard: persons.idCard })
          .from(persons)
          .leftJoin(pensionInsurance, eq(persons.idCard, pensionInsurance.idCard))
          .where(and(
            eq(persons.householdStatus, '正常'),
            sql`${pensionInsurance.idCard} is null or ${pensionInsurance.isInsured} = false`,
          ))
          .limit(100),
      this.db
        .select({ id: pensionInsurance.id, idCard: pensionInsurance.idCard })
        .from(pensionInsurance)
        .where(
          and(
            eq(pensionInsurance.isInsured, true),
            lt(pensionInsurance.cumulativePaymentYears, '15'),
          ),
        )
        .limit(100),
      this.db
        .select({ idCard: persons.idCard, cnt: count() })
        .from(persons)
        .groupBy(persons.idCard)
        .having(sql`count(*) > 1`)
        .limit(100),
      this.db
        .select({ id: persons.id, idCard: persons.idCard })
        .from(persons)
        .where(
          and(
            eq(persons.householdStatus, '正常'),
            sql`(${persons.phone} is null or ${persons.phone} = '')
                and (${persons.idCard} is null or length(${persons.idCard}) < 18)`,
          ),
        )
        .limit(100),
      this.db
        .select({ id: deathRecords.id, idCard: deathRecords.idCard })
        .from(deathRecords)
        .innerJoin(
          medicalInsurance,
          and(
            eq(deathRecords.idCard, medicalInsurance.idCard),
            eq(medicalInsurance.insuranceYear, currentYear),
            eq(medicalInsurance.paymentStatus, '已缴费'),
          ),
        )
        .limit(100),
      this.db
        .select({ id: persons.id, idCard: persons.idCard })
        .from(persons)
        .where(eq(persons.householdStatus, '迁出'))
        .innerJoin(
          medicalInsurance,
          and(
            eq(persons.idCard, medicalInsurance.idCard),
            eq(medicalInsurance.insuranceYear, currentYear),
          ),
        )
        .limit(100),
      this.getDeathWithTreatmentIds(),
    ]);

    const checks: DataCheckItem[] = [
      {
        id: 'check_age_60',
        checkType: 'birthday',
        category: 'age',
        title: '60周岁到龄提醒',
        description: '本月满60周岁的居民，需关注养老待遇申领事宜',
        count: age60Ids.length,
        severity: 'warning',
        relatedIds: age60Ids,
      },
      {
        id: 'check_age_80',
        checkType: 'birthday',
        category: 'age',
        title: '80周岁到龄提醒',
        description: '本月满80周岁的居民，需关注高龄津贴申领事宜',
        count: age80Ids.length,
        severity: 'info',
        relatedIds: age80Ids,
      },
      {
        id: 'check_age_90',
        checkType: 'birthday',
        category: 'age',
        title: '90周岁到龄提醒',
        description: '本月满90周岁的居民，需关注高龄津贴标准调整',
        count: age90Ids.length,
        severity: 'info',
        relatedIds: age90Ids,
      },
      {
        id: 'check_age_100',
        checkType: 'birthday',
        category: 'age',
        title: '100周岁到龄提醒',
        description: '本月满100周岁的长寿老人，需上门慰问及待遇复核',
        count: age100Ids.length,
        severity: 'info',
        relatedIds: age100Ids,
      },
      {
        id: 'check_med_unpaid',
        checkType: 'unpaid',
        category: 'medical',
        title: '医保未缴费',
        description: '本年度居民医保仍未缴费的人员，需及时提醒缴费',
        count: medUnpaidRows.length,
        severity: 'warning',
        relatedIds: medUnpaidRows.map((r) => r.id),
      },
      {
        id: 'check_med_duplicate',
        checkType: 'duplicate',
        category: 'medical',
        title: '医保重复缴费',
        description: '同一年度存在多条缴费记录，需核实处理',
        count: medDuplicateRows.length,
        severity: 'error',
        relatedIds: medDuplicateRows.map((r) => r.idCard),
      },
      {
        id: 'check_pension_to_age',
        checkType: 'to_age_unverified',
        category: 'pension',
        title: '到龄未核实',
        description: '已到龄领取养老待遇但资格未核实的人员',
        count: pensionToAgeRows.length,
        severity: 'warning',
        relatedIds: pensionToAgeRows.map((r) => r.id),
      },
      {
        id: 'check_pension_uninsured',
        checkType: 'uninsured',
        category: 'pension',
        title: '应保未保',
        description: '达到参保年龄但未参加居民养老保险的人员',
        count: pensionUninsuredRows.length,
        severity: 'warning',
        relatedIds: pensionUninsuredRows.map((r) => r.id),
      },
      {
        id: 'check_pension_years',
        checkType: 'years_check',
        category: 'pension',
        title: '缴费年限待核查',
        description: '累计缴费年限不足15年的参保人员，需关注补缴事宜',
        count: pensionYearsRows.length,
        severity: 'info',
        relatedIds: pensionYearsRows.map((r) => r.id),
      },
      {
        id: 'check_pop_dup_id',
        checkType: 'dup_id_card',
        category: 'population',
        title: '身份证号重复',
        description: '系统中存在相同身份证号的多条记录，需核实清理',
        count: dupIdCardRows.length,
        severity: 'error',
        relatedIds: dupIdCardRows.map((r) => r.idCard),
      },
      {
        id: 'check_pop_info',
        checkType: 'info_abnormal',
        category: 'population',
        title: '基本信息异常',
        description: '人员基本信息不完整（缺少联系方式或身份证号异常）',
        count: infoAbnormalRows.length,
        severity: 'warning',
        relatedIds: infoAbnormalRows.map((r) => r.id),
      },
      {
        id: 'check_status_death',
        checkType: 'death_in_business',
        category: 'status',
        title: '死亡人员仍在业务名单',
        description: '已死亡人员仍出现在医保等业务名单中，需及时停办',
        count: deathInBusinessRows.length,
        severity: 'error',
        relatedIds: deathInBusinessRows.map((r) => r.id),
      },
      {
        id: 'check_status_moved',
        checkType: 'moved_out_in_business',
        category: 'status',
        title: '迁出人员仍在业务名单',
        description: '已迁出人员仍出现在业务名单中，需核实处理',
        count: movedOutInBusinessRows.length,
        severity: 'warning',
        relatedIds: movedOutInBusinessRows.map((r) => r.id),
      },
      {
        id: 'check_treatment_death',
        checkType: 'death_with_treatment',
        category: 'treatment',
        title: '死亡人员仍有待遇',
        description: '已死亡人员仍在享受民政等待遇，需立即停发',
        count: deathWithTreatmentRows.length,
        severity: 'error',
        relatedIds: deathWithTreatmentRows,
      },
    ];

    return checks;
  }

  private async countBirthdayInMonth(age: number): Promise<number> {
    const now = new Date();
    const targetYear = now.getFullYear() - age;
    const targetMonth = now.getMonth() + 1;

    const result = await this.db
      .select({ count: count() })
      .from(persons)
      .where(
        and(
          eq(persons.householdStatus, '正常'),
          sql`extract(year from ${persons.birthDate})::integer = ${targetYear}`,
          sql`extract(month from ${persons.birthDate})::integer = ${targetMonth}`,
        ),
      );
    return Number(result[0]?.count ?? 0);
  }

  private async getBirthdayInMonthIds(age: number): Promise<string[]> {
    const now = new Date();
    const targetYear = now.getFullYear() - age;
    const targetMonth = now.getMonth() + 1;

    const result = await this.db
      .select({ id: persons.id })
      .from(persons)
      .where(
        and(
          eq(persons.householdStatus, '正常'),
          sql`extract(year from ${persons.birthDate})::integer = ${targetYear}`,
          sql`extract(month from ${persons.birthDate})::integer = ${targetMonth}`,
        ),
      )
      .limit(100);
    return result.map((r) => r.id);
  }

  private async getDeathWithTreatmentCount(): Promise<number> {
    const treatmentTables = [
      { table: lowIncome, status: '享受中' },
      { table: specialPoverty, status: '享受中' },
      { table: disabledPersons, status: '享受中' },
      { table: elderlyAllowance, status: '享受中' },
      { table: childSupport, status: '享受中' },
      { table: homeCare, status: '服务中' },
      { table: lowIncomeEdge, status: '享受中' },
    ];

    let total = 0;
    for (const { table, status } of treatmentTables) {
      const result = await this.db
        .select({ count: count() })
        .from(deathRecords)
        .innerJoin(table, eq(deathRecords.idCard, table.idCard))
        .where(eq(table.currentStatus, status));
      total += Number(result[0]?.count ?? 0);
    }
    return total;
  }

  private async getDeathWithTreatmentIds(): Promise<string[]> {
    const treatmentTables = [
      { table: lowIncome, status: '享受中' },
      { table: specialPoverty, status: '享受中' },
      { table: disabledPersons, status: '享受中' },
      { table: elderlyAllowance, status: '享受中' },
      { table: childSupport, status: '享受中' },
      { table: homeCare, status: '服务中' },
      { table: lowIncomeEdge, status: '享受中' },
    ];

    const idSet = new Set<string>();
    for (const { table, status } of treatmentTables) {
      const result = await this.db
        .select({ id: deathRecords.id })
        .from(deathRecords)
        .innerJoin(table, eq(deathRecords.idCard, table.idCard))
        .where(eq(table.currentStatus, status))
        .limit(100);
      for (const r of result) {
        idSet.add(r.id);
      }
    }
    return Array.from(idSet);
  }
}