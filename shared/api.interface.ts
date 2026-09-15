export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface ListResponse&lt;T&gt; {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Person {
  id: string;
  idCard: string;
  name: string;
  gender: string;
  birthDate: string;
  age: number;
  householdNo: string;
  relationToHead: string;
  isHouseholdHead: boolean;
  householdAddress: string;
  phone: string;
  ethnicity: string;
  politicalStatus: string;
  education: string;
  occupation: string;
  maritalStatus: string;
  householdStatus: string;
  businessTags: string[];
  deathDate?: string;
  moveDate?: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export interface Household {
  id: string;
  householdNo: string;
  householdType: string;
  householdAddress: string;
  area: string;
  building: string;
  unit: string;
  roomNo: string;
  householdHeadIdCard: string;
  familyMembersCount: number;
  householdStatus: string;
  remark: string;
}

export interface PopulationChange {
  id: string;
  idCard: string;
  name: string;
  changeType: string;
  oldHouseholdNo: string;
  newHouseholdNo: string;
  changeDate: string;
  changeReason: string;
  operator: string;
  remark: string;
}

export interface DeathRecord {
  id: string;
  idCard: string;
  name: string;
  deathDate: string;
  deathCause: string;
  deathCertificateNo: string;
  handleDate: string;
  operator: string;
  hasCivilAffairsTreatment: boolean;
  hasMedicalInsurance: boolean;
  hasPension: boolean;
  verificationStatus: string;
  remark: string;
}

export interface DeletePersonDto {
  changeType: '迁出' | '死亡' | '其他';
  changeDate: string;
  changeReason?: string;
}

export interface LowIncome {
  id: string;
  idCard: string;
  name: string;
  lowIncomeType: string;
  category: string;
  monthlyAmount: number;
  startDate: string;
  endDate?: string;
  currentStatus: string;
  exitReason: string;
  householdNo: string;
  guaranteeMembers: number;
  remark: string;
}

export interface SpecialPoverty {
  id: string;
  idCard: string;
  name: string;
  supportType: string;
  supportMethod: string;
  nursingLevel: string;
  basicAmount: number;
  nursingAmount: number;
  totalAmount: number;
  startDate: string;
  endDate?: string;
  currentStatus: string;
  exitReason: string;
  remark: string;
}

export interface DisabledPerson {
  id: string;
  idCard: string;
  name: string;
  disabilityCertNo: string;
  disabilityCategory: string;
  disabilityLevel: string;
  issueDate: string;
  hasLivingSubsidy: boolean;
  livingSubsidyAmount: number;
  hasNursingSubsidy: boolean;
  nursingSubsidyAmount: number;
  totalMonthlyAmount: number;
  currentStatus: string;
  remark: string;
}

export interface ElderlyAllowance {
  id: string;
  idCard: string;
  name: string;
  ageGroup: string;
  monthlyAmount: number;
  startDate: string;
  endDate?: string;
  currentStatus: string;
  exitReason: string;
  remark: string;
}

export interface ChildSupport {
  id: string;
  idCard: string;
  name: string;
  supportType: string;
  monthlyAmount: number;
  startDate: string;
  endDate?: string;
  currentStatus: string;
  exitReason: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  remark: string;
}

export interface HomeCare {
  id: string;
  idCard: string;
  name: string;
  serviceType: string;
  serviceFrequency: string;
  startDate: string;
  endDate?: string;
  currentStatus: string;
  serviceProvider: string;
  contactPhone: string;
  remark: string;
  isExcluded: boolean;
  exclusionReason: string;
}

export interface HomeCareCandidate {
  idCard: string;
  name: string;
  gender: string;
  birthDate: string;
  age: number;
  welfareType: string;
  supportMethod?: string;
  isExcluded: boolean;
  exclusionReason: string;
  alreadyInService: boolean;
}

export interface LowIncomeEdge {
  id: string;
  idCard: string;
  name: string;
  householdNo: string;
  familyMembers: number;
  startDate: string;
  endDate?: string;
  currentStatus: string;
  exitReason: string;
  familySituation: string;
  remark: string;
}

export interface RigidExpenditure {
  id: string;
  idCard: string;
  name: string;
  householdNo: string;
  familyMembers: number;
  startDate: string;
  endDate?: string;
  currentStatus: string;
  exitReason?: string;
  familySituation?: string;
  remark?: string;
}

export interface TemporaryAssistance {
  id: string;
  idCard: string;
  name: string;
  assistanceDate: string;
  assistanceReason: string;
  assistanceType: string;
  assistanceAmount: number;
  operator: string;
  remark: string;
}

export interface CivilAffairsStandard {
  id: string;
  standardType: string;
  standardName: string;
  category: string;
  amount: number;
  unit: string;
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
  version: number;
  description: string;
}

export interface MedicalInsurance {
  id: string;
  idCard: string;
  name: string;
  insuranceYear: number;
  paymentAmount: number;
  paymentDate: string;
  paymentMethod: string;
  receiptNo: string;
  paymentStatus: string;
  isNewlyAdded: boolean;
  remark: string;
}

export interface PensionInsurance {
  id: string;
  idCard: string;
  name: string;
  isInsured: boolean;
  insuredYear: number;
  paymentYears: number;
  cumulativePaymentYears: number;
  insuredStatus: string;
  treatmentStatus: string;
  treatmentStartDate?: string;
  monthlyTreatmentAmount: number;
  isReceivingPension: boolean;
  ageReminderType: string;
  verificationStatus: string;
  pensionType: string;
  remark: string;
}

export interface DashboardStats {
  population: {
    totalHouseholds: number;
    totalPopulation: number;
    maleCount: number;
    femaleCount: number;
    normalCount: number;
    deathCount: number;
  };
  civilAffairs: {
    lowIncomeCount: number;
    specialPovertyCount: number;
    lowIncomeEdgeCount: number;
    disabledCount: number;
    elderlyAllowanceCount: number;
    childSupportCount: number;
    homeCareCount: number;
  };
  medicalInsurance: {
    shouldPayCount: number;
    paidCount: number;
    unpaidCount: number;
    newlyAddedCount: number;
    paymentRate: number;
  };
  pension: {
    insuredCount: number;
    thisMonth60Count: number;
    futureAgeCount: number;
    toVerifyCount: number;
    receivingCount: number;
  };
  todo: TodoItem[];
}

export interface TodoItem {
  id: string;
  type: string;
  title: string;
  count: number;
  priority: string;
  category: string;
  detailPath?: string;
}

export interface BirthdayPerson {
  name: string;
  idCard: string;
  gender: string;
  birthDate: string;
  age: number;
  ageType: string;
  pensionType: string;
  tags: string[];
  inHomeCare: boolean;
  canAddHomeCare: boolean;
}

export interface DataCheckItem {
  id: string;
  checkType: string;
  category: string;
  title: string;
  description: string;
  count: number;
  severity: string;
  relatedIds: string[];
}

// 档案管理 V2
export interface ArchiveCategory {
  id: string;
  name: string;
  parentId?: string;
  sortOrder: number;
  icon?: string;
  description?: string;
}

export interface ArchiveCategoryTree extends ArchiveCategory {
  children: ArchiveCategoryTree[];
}

export interface ArchiveItem {
  id: string;
  title: string;
  categoryId?: string;
  categoryName?: string;
  year?: number;
  month?: number;
  formDate?: string;
  responsiblePerson?: string;
  status: string;
  tags?: string;
  relatedPersons?: string;
  relatedHouseholds?: string;
  remark?: string;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  fileCount?: number;
}

export interface ArchiveFileItem {
  id: string;
  archiveId: string;
  fileName: string;
  filePath?: string;
  fileSize?: number;
  fileType?: string;
  version: number;
  isCurrent: boolean;
  createdAt?: string;
}

export interface ArchiveV2Template {
  id: string;
  name: string;
  type: string;
  category?: string;
  variables?: string;
  namingRule?: string;
  description?: string;
  isActive: boolean;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  createdAt?: string;
}

export interface ArchiveReminder {
  id: string;
  title: string;
  type: string;
  archiveId?: string;
  reminderDate?: string;
  status: string;
  content?: string;
}

export interface ArchiveOperationLog {
  id: string;
  archiveId?: string;
  archiveTitle?: string;
  operationType: string;
  operator?: string;
  operationResult: string;
  detail?: string;
  createdAt: string;
}

export interface ArchiveDashboardStats {
  totalArchives: number;
  monthNew: number;
  pendingArchive: number;
  pendingTasks: number;
  expiringSoon: number;
}

export interface ArchiveListResponse {
  items: ArchiveItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ArchiveRecentData {
  recentArchives: ArchiveItem[];
  recentReminders: ArchiveReminder[];
}
