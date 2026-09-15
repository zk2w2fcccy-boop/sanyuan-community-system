import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { count, eq, and, ilike, desc, sql, inArray } from 'drizzle-orm';
import type {
  Person,
  Household,
  PopulationChange,
  DeathRecord,
  ListResponse,
} from '@shared/api.interface';
import {
  persons,
  households,
  populationChanges,
  deathRecords,
  lowIncome,
  specialPoverty,
  lowIncomeEdge,
  disabledPersons,
  elderlyAllowance,
  childSupport,
  homeCare,
  pensionInsurance,
} from '@server/database/schema';

function calculateAge(birthDateStr: string): number {
  const birth = new Date(birthDateStr);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

function mapPerson(row: typeof persons.$inferSelect): Person {
  const birthDate = row.birthDate;
  const computedAge = row.age ?? calculateAge(birthDate);
  return {
    id: row.id,
    idCard: row.idCard ?? '',
    name: row.name ?? '',
    gender: row.gender ?? '',
    birthDate,
    age: computedAge,
    householdNo: row.householdNo ?? '',
    relationToHead: row.relationToHead ?? '',
    isHouseholdHead: !!row.isHouseholdHead,
    householdAddress: row.householdAddress ?? '',
    phone: row.phone ?? '',
    ethnicity: row.ethnicity ?? '',
    politicalStatus: row.politicalStatus ?? '',
    education: row.education ?? '',
    occupation: row.occupation ?? '',
    maritalStatus: row.maritalStatus ?? '',
    householdStatus: row.householdStatus ?? '',
    businessTags: [],
    deathDate: row.deathDate || undefined,
    moveDate: row.moveDate || undefined,
    remark: row.remark ?? '',
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

function mapHousehold(row: typeof households.$inferSelect): Household {
  return {
    id: row.id,
    householdNo: row.householdNo ?? '',
    householdType: row.householdType ?? '',
    householdAddress: row.householdAddress ?? '',
    area: row.area ?? '',
    building: row.building ?? '',
    unit: row.unit ?? '',
    roomNo: row.roomNo ?? '',
    householdHeadIdCard: row.householdHeadIdCard ?? '',
    familyMembersCount: row.familyMembersCount ?? 0,
    householdStatus: row.householdStatus ?? '',
    remark: row.remark ?? '',
  };
}

function mapPopulationChange(row: typeof populationChanges.$inferSelect): PopulationChange {
  const changeDate = row.changeDate;
  return {
    id: row.id,
    idCard: row.idCard ?? '',
    name: row.name ?? '',
    changeType: row.changeType ?? '',
    oldHouseholdNo: row.oldHouseholdNo ?? '',
    newHouseholdNo: row.newHouseholdNo ?? '',
    changeDate,
    changeReason: row.changeReason ?? '',
    operator: row.operator ?? '',
    remark: row.remark ?? '',
  };
}

function mapDeathRecord(row: typeof deathRecords.$inferSelect): DeathRecord {
  const deathDate = row.deathDate;
  const handleDate = row.handleDate || '';
  return {
    id: row.id,
    idCard: row.idCard ?? '',
    name: row.name ?? '',
    deathDate,
    deathCause: row.deathCause ?? '',
    deathCertificateNo: row.deathCertificateNo ?? '',
    handleDate,
    operator: row.operator ?? '',
    hasCivilAffairsTreatment: !!row.hasCivilAffairsTreatment,
    hasMedicalInsurance: !!row.hasMedicalInsurance,
    hasPension: !!row.hasPension,
    verificationStatus: row.verificationStatus ?? '',
    remark: row.remark ?? '',
  };
}

@Injectable()
export class PopulationService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getPersons(params: {
    page: number;
    pageSize: number;
    keyword?: string;
    status?: string;
    householdNo?: string;
  }): Promise<ListResponse<Person>> {
    const { page, pageSize, keyword, status, householdNo } = params;
    const conditions = [];

    if (status) {
      conditions.push(eq(persons.householdStatus, status));
    } else {
      conditions.push(eq(persons.householdStatus, '正常'));
    }
    if (householdNo) {
      conditions.push(eq(persons.householdNo, householdNo));
    }
    if (keyword) {
      const kw = `%${keyword}%`;
      conditions.push(sql`(${persons.name} ilike ${kw} or ${persons.idCard} ilike ${kw})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * pageSize;

    const [itemsResult, totalResult] = await Promise.all([
      this.db.select().from(persons)
        .where(whereClause)
        .orderBy(desc(persons.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(persons).where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    const items: Person[] = itemsResult.map((row) => mapPerson(row));

    if (items.length > 0) {
      const idCards = items.map((p) => p.idCard);
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
      const pensionMap = new Map(pensionRows.map((r) => [r.idCard, r.pensionType ?? '居民养老']));

      const now = new Date();
      for (const person of items) {
        const tags: string[] = [];
        const idCard = person.idCard;

        if (liSet.has(idCard)) tags.push('低保');
        if (spMap.has(idCard)) tags.push('特困');
        if (leSet.has(idCard)) tags.push('低边');
        if (disSet.has(idCard)) tags.push('残疾');
        if (eldSet.has(idCard)) tags.push('高龄');
        if (childSet.has(idCard)) tags.push('儿童保障');

        const pType = pensionMap.get(idCard);
        if (pType) tags.push(pType);

        const hcInfo = hcMap.get(idCard);
        const inHomeCare = !!hcInfo && hcInfo.status === '服务中' && !hcInfo.isExcluded;
        if (inHomeCare) tags.push('居家服务');
        if (hcInfo?.isExcluded && hcInfo.reason) tags.push(hcInfo.reason);

        const birth = new Date(person.birthDate);
        const ageNow = now.getFullYear() - birth.getFullYear();
        const monthDiff = now.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
          // 未过生日
        } else {
          if (ageNow >= 60 && ageNow < 80 && birth.getMonth() === now.getMonth() && birth.getDate() <= now.getDate()) tags.push('达龄');
          if (ageNow >= 80 && ageNow < 90 && birth.getMonth() === now.getMonth() && birth.getDate() <= now.getDate()) tags.push('达龄');
          if (ageNow >= 90 && ageNow < 100 && birth.getMonth() === now.getMonth() && birth.getDate() <= now.getDate()) tags.push('达龄');
          if (ageNow >= 100 && birth.getMonth() === now.getMonth() && birth.getDate() <= now.getDate()) tags.push('达龄');
        }

        person.businessTags = tags;
      }
    }

    return { items, total, page, pageSize };
  }

  async getPerson(id: string): Promise<Person | null> {
    const result = await this.db.select().from(persons).where(eq(persons.id, id)).limit(1);
    if (result.length === 0) return null;
    return mapPerson(result[0]);
  }

  async updatePerson(id: string, data: Partial<Person>): Promise<Person> {
    const patch: Partial<typeof persons.$inferInsert> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.idCard !== undefined) patch.idCard = data.idCard;
    if (data.gender !== undefined) patch.gender = data.gender;
    if (data.birthDate !== undefined) patch.birthDate = data.birthDate;
    if (data.ethnicity !== undefined) patch.ethnicity = data.ethnicity;
    if (data.politicalStatus !== undefined) patch.politicalStatus = data.politicalStatus;
    if (data.education !== undefined) patch.education = data.education;
    if (data.occupation !== undefined) patch.occupation = data.occupation;
    if (data.maritalStatus !== undefined) patch.maritalStatus = data.maritalStatus;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.householdNo !== undefined) patch.householdNo = data.householdNo;
    if (data.relationToHead !== undefined) patch.relationToHead = data.relationToHead;
    if (data.householdAddress !== undefined) patch.householdAddress = data.householdAddress;
    if (data.remark !== undefined) patch.remark = data.remark;

    if (Object.keys(patch).length === 0) {
      const existing = await this.getPerson(id);
      if (!existing) throw new NotFoundException('人员不存在');
      return existing;
    }

    const updated = await this.db.update(persons)
      .set(patch)
      .where(eq(persons.id, id))
      .returning();
    if (updated.length === 0) {
      throw new NotFoundException('人员不存在');
    }
    return mapPerson(updated[0]);
  }

  async getHouseholds(params: {
    page: number;
    pageSize: number;
    keyword?: string;
  }): Promise<ListResponse<Household>> {
    const { page, pageSize, keyword } = params;
    const conditions = [];

    if (keyword) {
      const kw = `%${keyword}%`;
      conditions.push(sql`(${households.householdNo} ilike ${kw} or ${households.householdAddress} ilike ${kw})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * pageSize;

    const [itemsResult, totalResult] = await Promise.all([
      this.db.select().from(households)
        .where(whereClause)
        .orderBy(desc(households.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(households).where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    const items: Household[] = itemsResult.map((row) => mapHousehold(row));

    return { items, total, page, pageSize };
  }

  async getHousehold(id: string): Promise<Household | null> {
    const result = await this.db.select().from(households).where(eq(households.id, id)).limit(1);
    if (result.length === 0) return null;
    return mapHousehold(result[0]);
  }

  async getHouseholdMembers(householdNo: string): Promise<Person[]> {
    const result = await this.db.select().from(persons)
      .where(eq(persons.householdNo, householdNo))
      .orderBy(desc(persons.isHouseholdHead), desc(persons.createdAt));
    return result.map((row) => mapPerson(row));
  }

  async getChanges(params: {
    page: number;
    pageSize: number;
    changeType?: string;
    keyword?: string;
  }): Promise<ListResponse<PopulationChange>> {
    const { page, pageSize, changeType, keyword } = params;
    const conditions = [];

    if (changeType) {
      conditions.push(eq(populationChanges.changeType, changeType));
    }
    if (keyword) {
      const kw = `%${keyword}%`;
      conditions.push(sql`(${populationChanges.name} ilike ${kw} or ${populationChanges.idCard} ilike ${kw})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * pageSize;

    const [itemsResult, totalResult] = await Promise.all([
      this.db.select().from(populationChanges)
        .where(whereClause)
        .orderBy(desc(populationChanges.changeDate), desc(populationChanges.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(populationChanges).where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    const items: PopulationChange[] = itemsResult.map((row) => mapPopulationChange(row));

    return { items, total, page, pageSize };
  }

  async getDeaths(params: {
    page: number;
    pageSize: number;
    keyword?: string;
    verificationStatus?: string;
  }): Promise<ListResponse<DeathRecord>> {
    const { page, pageSize, keyword, verificationStatus } = params;
    const conditions = [];

    if (verificationStatus) {
      conditions.push(eq(deathRecords.verificationStatus, verificationStatus));
    }
    if (keyword) {
      const kw = `%${keyword}%`;
      conditions.push(sql`(${deathRecords.name} ilike ${kw} or ${deathRecords.idCard} ilike ${kw})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * pageSize;

    const [itemsResult, totalResult] = await Promise.all([
      this.db.select().from(deathRecords)
        .where(whereClause)
        .orderBy(desc(deathRecords.deathDate), desc(deathRecords.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(deathRecords).where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    const items: DeathRecord[] = itemsResult.map((row) => mapDeathRecord(row));

    return { items, total, page, pageSize };
  }

  async deletePerson(
    id: string,
    dto: {
      changeType: '迁出' | '死亡' | '其他';
      changeDate: string;
      changeReason?: string;
      operatorId: string;
    },
  ): Promise<void> {
    const { changeType, changeDate, changeReason, operatorId } = dto;

    const existing = await this.db.select().from(persons).where(eq(persons.id, id)).limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('人员不存在');
    }
    const person = existing[0];

    await this.db.transaction(async (tx) => {
      // 1. 创建人员变动记录
      await tx.insert(populationChanges).values({
        idCard: person.idCard,
        name: person.name,
        changeType,
        changeDate,
        changeReason: changeReason || null,
        operator: operatorId,
      });

      // 2. 更新人员状态
      const patch: Partial<typeof persons.$inferInsert> = {
        householdStatus: changeType,
      };

      if (changeType === '死亡') {
        patch.deathDate = changeDate;

        // 3. 插入死亡档案（如果不存在）
        const existingDeath = await tx.select({ id: deathRecords.id })
          .from(deathRecords)
          .where(eq(deathRecords.idCard, person.idCard ?? ''))
          .limit(1);

        if (existingDeath.length === 0) {
          const today = new Date().toISOString().slice(0, 10);
          await tx.insert(deathRecords).values({
            idCard: person.idCard,
            name: person.name,
            deathDate: changeDate,
            deathCause: changeReason || null,
            handleDate: today,
            verificationStatus: '已核实',
            operator: operatorId,
          });
        }
      }

      await tx.update(persons)
        .set(patch)
        .where(eq(persons.id, id));
    });
  }

  async updateDeath(
    id: string,
    data: { deathDate: string; deathCause?: string },
  ): Promise<DeathRecord> {
    const patch: Partial<typeof deathRecords.$inferInsert> = {};
    if (data.deathDate !== undefined) patch.deathDate = data.deathDate;
    if (data.deathCause !== undefined) patch.deathCause = data.deathCause || null;

    const updated = await this.db.update(deathRecords)
      .set(patch)
      .where(eq(deathRecords.id, id))
      .returning();
    if (updated.length === 0) {
      throw new NotFoundException('死亡记录不存在');
    }
    return mapDeathRecord(updated[0]);
  }

  async mergeHouseholds(params: {
    newHouseholdNo: string;
    headIdCard: string;
    sourceHouseholdNos: string[];
    relationMapping: Record<string, string>;
  }): Promise<Household> {
    const { newHouseholdNo, headIdCard, sourceHouseholdNos, relationMapping } = params;

    if (sourceHouseholdNos.length < 2) {
      throw new Error('至少选择2户才能合并');
    }

    const sourceHouseholds = await this.db.select().from(households)
      .where(inArray(households.householdNo, sourceHouseholdNos));

    if (sourceHouseholds.length === 0) {
      throw new Error('未找到源家庭户');
    }

    const existing = await this.db.select({ id: households.id })
      .from(households)
      .where(eq(households.householdNo, newHouseholdNo))
      .limit(1);
    if (existing.length > 0) {
      throw new Error('新户号已存在');
    }

    const baseHousehold = sourceHouseholds[0];

    const newHh = await this.db.transaction(async (tx) => {
      const inserted = await tx.insert(households).values({
        householdNo: newHouseholdNo,
        householdType: baseHousehold.householdType ?? '普通家庭',
        householdAddress: baseHousehold.householdAddress,
        area: baseHousehold.area,
        building: baseHousehold.building,
        unit: baseHousehold.unit,
        roomNo: baseHousehold.roomNo,
        householdHeadIdCard: headIdCard,
        familyMembersCount: 0,
        householdStatus: '正常',
      }).returning();

      const newHouseholdId = inserted[0].id;

      const allMembers = await tx.select().from(persons)
        .where(inArray(persons.householdNo, sourceHouseholdNos));

      for (const member of allMembers) {
        const relation = relationMapping[member.idCard] || '其他亲属';
        const isHead = member.idCard === headIdCard;
        await tx.update(persons)
          .set({
            householdNo: newHouseholdNo,
            isHouseholdHead: isHead,
            relationToHead: isHead ? '户主' : relation,
          })
          .where(eq(persons.idCard, member.idCard));

        await tx.insert(populationChanges).values({
          idCard: member.idCard,
          name: member.name,
          changeType: '合户',
          oldHouseholdNo: member.householdNo,
          newHouseholdNo: newHouseholdNo,
          changeDate: new Date().toISOString().slice(0, 10),
          changeReason: `家庭户合并，原户号${member.householdNo}并入${newHouseholdNo}`,
        });
      }

      await tx.update(households)
        .set({ householdStatus: '已合并' })
        .where(inArray(households.householdNo, sourceHouseholdNos));

      const memberCount = allMembers.length;
      await tx.update(households)
        .set({ familyMembersCount: memberCount })
        .where(eq(households.id, newHouseholdId));

      return inserted[0];
    });

    return mapHousehold(newHh);
  }
}