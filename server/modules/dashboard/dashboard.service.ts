import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { count, eq, and, sql, gte, lt, inArray } from 'drizzle-orm';
import type { DashboardStats, TodoItem, BirthdayPerson } from '@shared/api.interface';
import {
  households,
  persons,
  deathRecords,
  lowIncome,
  specialPoverty,
  lowIncomeEdge,
  disabledPersons,
  elderlyAllowance,
  childSupport,
  homeCare,
  medicalInsurance,
  pensionInsurance,
} from '@server/database/schema';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getStats(): Promise<DashboardStats> {
    const [
      totalHouseholdsResult,
      normalPersonsResult,
      maleResult,
      femaleResult,
      deathCountResult,
      lowIncomeResult,
      specialPovertyResult,
      lowIncomeEdgeResult,
      disabledResult,
      elderlyAllowanceResult,
      childSupportResult,
      homeCareResult,
      paidResult,
      newlyAddedResult,
      insuredResult,
      receivingResult,
      toVerifyResult,
    ] = await Promise.all([
      this.db.select({ count: count() }).from(households),
      this.db.select({ count: count() }).from(persons).where(eq(persons.householdStatus, '正常')),
      this.db.select({ count: count() }).from(persons).where(and(eq(persons.householdStatus, '正常'), eq(persons.gender, '男'))),
      this.db.select({ count: count() }).from(persons).where(and(eq(persons.householdStatus, '正常'), eq(persons.gender, '女'))),
      this.db.select({ count: count() }).from(deathRecords),
      this.db.select({ count: count() }).from(lowIncome).where(eq(lowIncome.currentStatus, '享受中')),
      this.db.select({ count: count() }).from(specialPoverty).where(eq(specialPoverty.currentStatus, '享受中')),
      this.db.select({ count: count() }).from(lowIncomeEdge).where(eq(lowIncomeEdge.currentStatus, '享受中')),
      this.db.select({ count: count() }).from(disabledPersons).where(eq(disabledPersons.currentStatus, '享受中')),
      this.db.select({ count: count() }).from(elderlyAllowance).where(eq(elderlyAllowance.currentStatus, '享受中')),
      this.db.select({ count: count() }).from(childSupport).where(eq(childSupport.currentStatus, '享受中')),
      this.db.select({ count: count() }).from(homeCare).where(eq(homeCare.currentStatus, '服务中')),
      this.db.select({ count: count() }).from(medicalInsurance).where(and(eq(medicalInsurance.insuranceYear, 2026), eq(medicalInsurance.paymentStatus, '已缴费'))),
      this.db.select({ count: count() }).from(medicalInsurance).where(and(eq(medicalInsurance.insuranceYear, 2026), eq(medicalInsurance.isNewlyAdded, true))),
      this.db.select({ count: count() }).from(pensionInsurance).where(eq(pensionInsurance.isInsured, true)),
      this.db.select({ count: count() }).from(pensionInsurance).where(eq(pensionInsurance.isReceivingPension, true)),
      this.db.select({ count: count() }).from(pensionInsurance).where(eq(pensionInsurance.verificationStatus, '待核实')),
    ]);

    const totalHouseholds = Number(totalHouseholdsResult[0]?.count ?? 0);
    const totalPopulation = Number(normalPersonsResult[0]?.count ?? 0);
    const maleCount = Number(maleResult[0]?.count ?? 0);
    const femaleCount = Number(femaleResult[0]?.count ?? 0);
    const deathCount = Number(deathCountResult[0]?.count ?? 0);

    const shouldPayCount = totalPopulation;
    const paidCount = Number(paidResult[0]?.count ?? 0);
    const unpaidCount = Math.max(0, shouldPayCount - paidCount);
    const newlyAddedCount = Number(newlyAddedResult[0]?.count ?? 0);
    const paymentRate = shouldPayCount > 0
      ? Math.round((paidCount / shouldPayCount) * 1000) / 10
      : 0;

    const insuredCount = Number(insuredResult[0]?.count ?? 0);
    const receivingCount = Number(receivingResult[0]?.count ?? 0);
    const toVerifyCount = Number(toVerifyResult[0]?.count ?? 0);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const fmt = (d: Date): string => d.toISOString().slice(0, 10);

    // 本月满60周岁
    const thisMonth60Start = fmt(new Date(currentYear - 60, currentMonth, 1));
    const thisMonth60End = fmt(new Date(currentYear - 60, currentMonth + 1, 1));
    const thisMonth60Result = await this.db.select({ count: count() }).from(persons)
      .where(and(
        eq(persons.householdStatus, '正常'),
        gte(persons.birthDate, thisMonth60Start),
        lt(persons.birthDate, thisMonth60End),
      ));
    const thisMonth60Count = Number(thisMonth60Result[0]?.count ?? 0);

    // 未来12个月满60岁
    const future60Start = fmt(new Date(currentYear - 60, currentMonth + 1, 1));
    const future60End = fmt(new Date(currentYear - 60 + 1, currentMonth + 1, 1));
    const future60Result = await this.db.select({ count: count() }).from(persons)
      .where(and(
        eq(persons.householdStatus, '正常'),
        gte(persons.birthDate, future60Start),
        lt(persons.birthDate, future60End),
      ));
    const futureAgeCount = Number(future60Result[0]?.count ?? 0);

    // 本月到龄计算（80/90/100岁类似）
    const thisMonth80Start = fmt(new Date(currentYear - 80, currentMonth, 1));
    const thisMonth80End = fmt(new Date(currentYear - 80, currentMonth + 1, 1));
    const thisMonth80Result = await this.db.select({ count: count() }).from(persons)
      .where(and(eq(persons.householdStatus, '正常'), gte(persons.birthDate, thisMonth80Start), lt(persons.birthDate, thisMonth80End)));
    const thisMonth80Count = Number(thisMonth80Result[0]?.count ?? 0);

    const thisMonth90Start = fmt(new Date(currentYear - 90, currentMonth, 1));
    const thisMonth90End = fmt(new Date(currentYear - 90, currentMonth + 1, 1));
    const thisMonth90Result = await this.db.select({ count: count() }).from(persons)
      .where(and(eq(persons.householdStatus, '正常'), gte(persons.birthDate, thisMonth90Start), lt(persons.birthDate, thisMonth90End)));
    const thisMonth90Count = Number(thisMonth90Result[0]?.count ?? 0);

    const thisMonth100Start = fmt(new Date(currentYear - 100, currentMonth, 1));
    const thisMonth100End = fmt(new Date(currentYear - 100, currentMonth + 1, 1));
    const thisMonth100Result = await this.db.select({ count: count() }).from(persons)
      .where(and(eq(persons.householdStatus, '正常'), gte(persons.birthDate, thisMonth100Start), lt(persons.birthDate, thisMonth100End)));
    const thisMonth100Count = Number(thisMonth100Result[0]?.count ?? 0);

    // 死亡待遇核查（待核查状态）
    const deathVerifyResult = await this.db.select({ count: count() }).from(deathRecords)
      .where(eq(deathRecords.verificationStatus, '待核查'));
    const deathVerifyCount = Number(deathVerifyResult[0]?.count ?? 0);

    const todo: TodoItem[] = [
      {
        id: 'age-60',
        type: 'age-reminder',
        title: '60周岁到龄提醒',
        count: thisMonth60Count,
        priority: 'high',
        category: '养老',
        detailPath: '/pension-insurance?tab=age-reminder&type=60',
      },
      {
        id: 'age-80',
        type: 'age-reminder',
        title: '80周岁到龄提醒',
        count: thisMonth80Count,
        priority: 'high',
        category: '民政',
        detailPath: '/pension-insurance?tab=age-reminder&type=80',
      },
      {
        id: 'age-90',
        type: 'age-reminder',
        title: '90周岁到龄提醒',
        count: thisMonth90Count,
        priority: 'medium',
        category: '民政',
        detailPath: '/pension-insurance?tab=age-reminder&type=90',
      },
      {
        id: 'age-100',
        type: 'age-reminder',
        title: '100周岁到龄提醒',
        count: thisMonth100Count,
        priority: 'medium',
        category: '民政',
        detailPath: '/pension-insurance?tab=age-reminder&type=100',
      },
      {
        id: 'medical-unpaid',
        type: 'insurance',
        title: '医保未缴费',
        count: unpaidCount,
        priority: 'high',
        category: '医保',
      },
      {
        id: 'pension-verify',
        type: 'pension',
        title: '养老到龄待核实',
        count: toVerifyCount,
        priority: 'high',
        category: '养老',
      },
      {
        id: 'death-verify',
        type: 'death',
        title: '死亡待遇核查',
        count: deathVerifyCount,
        priority: 'medium',
        category: '人口',
      },
      {
        id: 'data-abnormal',
        type: 'data',
        title: '数据异常',
        count: 0,
        priority: 'low',
        category: '系统',
      },
    ];

    return {
      population: {
        totalHouseholds,
        totalPopulation,
        maleCount,
        femaleCount,
        normalCount: totalPopulation,
        deathCount,
      },
      civilAffairs: {
        lowIncomeCount: Number(lowIncomeResult[0]?.count ?? 0),
        specialPovertyCount: Number(specialPovertyResult[0]?.count ?? 0),
        lowIncomeEdgeCount: Number(lowIncomeEdgeResult[0]?.count ?? 0),
        disabledCount: Number(disabledResult[0]?.count ?? 0),
        elderlyAllowanceCount: Number(elderlyAllowanceResult[0]?.count ?? 0),
        childSupportCount: Number(childSupportResult[0]?.count ?? 0),
        homeCareCount: Number(homeCareResult[0]?.count ?? 0),
      },
      medicalInsurance: {
        shouldPayCount,
        paidCount,
        unpaidCount,
        newlyAddedCount,
        paymentRate,
      },
      pension: {
        insuredCount,
        thisMonth60Count,
        futureAgeCount,
        toVerifyCount,
        receivingCount,
      },
      todo,
    };
  }

  async getBirthdayList(
    age: number,
    year?: number,
    month?: number,
    pensionType?: string,
  ): Promise<BirthdayPerson[]> {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month !== undefined ? month - 1 : now.getMonth();

    const fmt = (d: Date): string => d.toISOString().slice(0, 10);
    const startDate = fmt(new Date(targetYear - age, targetMonth, 1));
    const endDate = fmt(new Date(targetYear - age, targetMonth + 1, 1));

    const results = await this.db.select({
      name: persons.name,
      idCard: persons.idCard,
      gender: persons.gender,
      birthDate: persons.birthDate,
    }).from(persons)
      .where(and(
        eq(persons.householdStatus, '正常'),
        gte(persons.birthDate, startDate),
        lt(persons.birthDate, endDate),
      ))
      .orderBy(persons.birthDate)
      .limit(200);

    if (results.length === 0) return [];

    const idCards = results.map((r) => r.idCard);

    const [
      lowIncomeRows,
      specialPovertyRows,
      lowIncomeEdgeRows,
      disabledRows,
      elderlyRows,
      childRows,
      homeCareRows,
      pensionRows,
    ] = await Promise.all([
      this.db.select({ idCard: lowIncome.idCard })
        .from(lowIncome)
        .where(and(eq(lowIncome.currentStatus, '享受中'), inArray(lowIncome.idCard, idCards))),
      this.db.select({
        idCard: specialPoverty.idCard,
        supportMethod: specialPoverty.supportMethod,
      })
        .from(specialPoverty)
        .where(and(eq(specialPoverty.currentStatus, '享受中'), inArray(specialPoverty.idCard, idCards))),
      this.db.select({ idCard: lowIncomeEdge.idCard })
        .from(lowIncomeEdge)
        .where(and(eq(lowIncomeEdge.currentStatus, '享受中'), inArray(lowIncomeEdge.idCard, idCards))),
      this.db.select({ idCard: disabledPersons.idCard })
        .from(disabledPersons)
        .where(and(eq(disabledPersons.currentStatus, '享受中'), inArray(disabledPersons.idCard, idCards))),
      this.db.select({ idCard: elderlyAllowance.idCard })
        .from(elderlyAllowance)
        .where(and(eq(elderlyAllowance.currentStatus, '享受中'), inArray(elderlyAllowance.idCard, idCards))),
      this.db.select({ idCard: childSupport.idCard })
        .from(childSupport)
        .where(and(eq(childSupport.currentStatus, '享受中'), inArray(childSupport.idCard, idCards))),
      this.db.select({
        idCard: homeCare.idCard,
        currentStatus: homeCare.currentStatus,
        isExcluded: homeCare.isExcluded,
        exclusionReason: homeCare.exclusionReason,
      })
        .from(homeCare)
        .where(inArray(homeCare.idCard, idCards)),
      this.db.select({
        idCard: pensionInsurance.idCard,
        pensionType: pensionInsurance.pensionType,
      })
        .from(pensionInsurance)
        .where(inArray(pensionInsurance.idCard, idCards)),
    ]);

    const liSet = new Set(lowIncomeRows.map((r) => r.idCard));
    const spMap = new Map(specialPovertyRows.map((r) => [r.idCard, r.supportMethod]));
    const leSet = new Set(lowIncomeEdgeRows.map((r) => r.idCard));
    const disSet = new Set(disabledRows.map((r) => r.idCard));
    const eldSet = new Set(elderlyRows.map((r) => r.idCard));
    const childSet = new Set(childRows.map((r) => r.idCard));
    const hcMap = new Map(homeCareRows.map((r) => [
      r.idCard,
      { status: r.currentStatus, isExcluded: r.isExcluded ?? false, reason: r.exclusionReason ?? '' },
    ]));
    const pensionMap = new Map(pensionRows.map((r) => [r.idCard, r.pensionType ?? '待确认']));

    const ageType = `${age}周岁`;

    let list: BirthdayPerson[] = results.map((r) => {
      const tags: string[] = [];
      const idCard = r.idCard;

      if (liSet.has(idCard)) tags.push('低保');
      if (spMap.has(idCard)) tags.push('特困');
      if (leSet.has(idCard)) tags.push('低边');
      if (disSet.has(idCard)) tags.push('残疾');
      if (eldSet.has(idCard)) tags.push('高龄');
      if (childSet.has(idCard)) tags.push('儿童保障');

      const pType = pensionMap.get(idCard) ?? '待确认';
      tags.push(pType);

      const hcInfo = hcMap.get(idCard);
      const inHomeCare = !!hcInfo && hcInfo.status === '服务中' && !hcInfo.isExcluded;
      if (inHomeCare) tags.push('居家服务');
      if (hcInfo?.isExcluded && hcInfo.reason) tags.push(hcInfo.reason);

      tags.push('达龄');

      const isLowIncomeOrSpecial = liSet.has(idCard) || spMap.has(idCard);
      const supportMethod = spMap.get(idCard);
      const isInstitutional = supportMethod === '集中供养';
      const isAway = hcInfo?.reason === '在外居住';
      const isUnwilling = hcInfo?.reason === '不愿意享受';
      const canAddHomeCare = age >= 60 && isLowIncomeOrSpecial && !isInstitutional && !isAway && !isUnwilling && !inHomeCare;

      return {
        name: r.name,
        idCard: r.idCard,
        gender: r.gender ?? '',
        birthDate: r.birthDate,
        age,
        ageType,
        pensionType: pType,
        tags,
        inHomeCare,
        canAddHomeCare,
      };
    });

    if (pensionType && pensionType !== 'all') {
      list = list.filter((p) => p.pensionType === pensionType);
    }

    return list;
  }
}