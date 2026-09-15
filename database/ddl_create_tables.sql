BEGIN;

-- 1. 家庭户表
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_no VARCHAR(50) NOT NULL UNIQUE,
  household_type VARCHAR(20) NOT NULL DEFAULT '普通家庭',
  household_address VARCHAR(500),
  area VARCHAR(100),
  building VARCHAR(50),
  unit VARCHAR(20),
  room_no VARCHAR(20),
  household_head_id_card VARCHAR(18),
  family_members_count INTEGER DEFAULT 0,
  household_status VARCHAR(20) DEFAULT '正常',
  remark TEXT,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
CREATE POLICY "households_select_all" ON households AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "households_all_auth" ON households AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- 2. 人员基础信息表
CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card VARCHAR(18) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  birth_date DATE NOT NULL,
  age INTEGER,
  household_no VARCHAR(50) NOT NULL,
  relation_to_head VARCHAR(20),
  is_household_head BOOLEAN DEFAULT false,
  household_address VARCHAR(500),
  phone VARCHAR(20),
  ethnicity VARCHAR(20) DEFAULT '汉族',
  political_status VARCHAR(20),
  education VARCHAR(30),
  occupation VARCHAR(50),
  marital_status VARCHAR(20),
  household_status VARCHAR(20) NOT NULL DEFAULT '正常',
  death_date DATE,
  move_date DATE,
  remark TEXT,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "persons_select_all" ON persons AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "persons_all_auth" ON persons AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_persons_household_no ON persons(household_no);
CREATE INDEX IF NOT EXISTS idx_persons_status ON persons(household_status);
CREATE INDEX IF NOT EXISTS idx_persons_birth_date ON persons(birth_date);

-- 3. 人员变动记录表
CREATE TABLE IF NOT EXISTS population_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card VARCHAR(18) NOT NULL,
  name VARCHAR(50),
  change_type VARCHAR(20) NOT NULL,
  old_household_no VARCHAR(50),
  new_household_no VARCHAR(50),
  change_date DATE NOT NULL,
  change_reason VARCHAR(200),
  materials TEXT,
  operator VARCHAR(50),
  remark TEXT,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE population_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "changes_select_all" ON population_changes AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "changes_all_auth" ON population_changes AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_changes_id_card ON population_changes(id_card);
CREATE INDEX IF NOT EXISTS idx_changes_type ON population_changes(change_type);

-- 4. 死亡档案表
CREATE TABLE IF NOT EXISTS death_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card VARCHAR(18) NOT NULL UNIQUE,
  name VARCHAR(50),
  death_date DATE NOT NULL,
  death_cause VARCHAR(100),
  death_certificate_no VARCHAR(50),
  handle_date DATE,
  operator VARCHAR(50),
  has_civil_affairs_treatment BOOLEAN DEFAULT false,
  has_medical_insurance BOOLEAN DEFAULT false,
  has_pension BOOLEAN DEFAULT false,
  verification_status VARCHAR(20) DEFAULT '待核查',
  remark TEXT,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE death_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "death_select_all" ON death_records AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "death_all_auth" ON death_records AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- 5. 低保待遇表
CREATE TABLE IF NOT EXISTS low_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card VARCHAR(18) NOT NULL,
  name VARCHAR(50),
  low_income_type VARCHAR(20) NOT NULL,
  category VARCHAR(10) NOT NULL,
  monthly_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  current_status VARCHAR(20) DEFAULT '享受中',
  exit_reason VARCHAR(200),
  household_no VARCHAR(50),
  guarantee_members INTEGER DEFAULT 1,
  remark TEXT,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE low_income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "low_income_select_all" ON low_income AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "low_income_all_auth" ON low_income AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_low_income_id_card ON low_income(id_card);
CREATE INDEX IF NOT EXISTS idx_low_income_status ON low_income(current_status);

-- 6. 特困供养表
CREATE TABLE IF NOT EXISTS special_poverty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card VARCHAR(18) NOT NULL,
  name VARCHAR(50),
  support_type VARCHAR(20) NOT NULL,
  support_method VARCHAR(20) NOT NULL,
  nursing_level VARCHAR(20),
  basic_amount DECIMAL(10,2) DEFAULT 0,
  nursing_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  current_status VARCHAR(20) DEFAULT '享受中',
  exit_reason VARCHAR(200),
  remark TEXT,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE special_poverty ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp_select_all" ON special_poverty AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "sp_all_auth" ON special_poverty AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_sp_id_card ON special_poverty(id_card);

-- 7. 低边表
CREATE TABLE IF NOT EXISTS low_income_edge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card VARCHAR(18) NOT NULL,
  name VARCHAR(50),
  household_no VARCHAR(50),
  family_members INTEGER DEFAULT 1,
  start_date DATE,
  end_date DATE,
  current_status VARCHAR(20) DEFAULT '享受中',
  exit_reason VARCHAR(200),
  family_situation TEXT,
  remark TEXT,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE low_income_edge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lie_select_all" ON low_income_edge AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "lie_all_auth" ON low_income_edge AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- 8. 残疾人表
CREATE TABLE IF NOT EXISTS disabled_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card VARCHAR(18) NOT NULL,
  name VARCHAR(50),
  disability_cert_no VARCHAR(30),
  disability_category VARCHAR(20) NOT NULL,
  disability_level VARCHAR(10) NOT NULL,
  issue_date DATE,
  has_living_subsidy BOOLEAN DEFAULT false,
  living_subsidy_amount DECIMAL(10,2) DEFAULT 0,
  has_nursing_subsidy BOOLEAN DEFAULT false,
  nursing_subsidy_amount DECIMAL(10,2) DEFAULT 0,
  total_monthly_amount DECIMAL(10,2) DEFAULT 0,
  current_status VARCHAR(20) DEFAULT '享受中',
  remark TEXT,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE disabled_persons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dp_select_all" ON disabled_persons AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "dp_all_auth" ON disabled_persons AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_dp_id_card ON disabled_persons(id_card);

-- 9. 高龄津贴表
CREATE TABLE IF NOT EXISTS elderly_allowance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card VARCHAR(18) NOT NULL,
  name VARCHAR(50),
  age_group VARCHAR(20) NOT NULL,
  monthly_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  current_status VARCHAR(20) DEFAULT '享受中',
  exit_reason VARCHAR(200),
  remark TEXT,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE elderly_allowance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ea_select_all" ON elderly_allowance AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "ea_all_auth" ON elderly_allowance AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_ea_id_card ON elderly_allowance(id_card);

-- 10. 儿童保障表
CREATE TABLE IF NOT EXISTS child_support (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card VARCHAR(18) NOT NULL,
  name VARCHAR(50),
  support_type VARCHAR(30) NOT NULL,
  monthly_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  current_status VARCHAR(20) DEFAULT '享受中',
  exit_reason VARCHAR(200),
  guardian_name VARCHAR(50),
  guardian_relation VARCHAR(20),
  guardian_phone VARCHAR(20),
  remark TEXT,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE child_support ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cs_select_all" ON child_support AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "cs_all_auth" ON child_support AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- 11. 居家服务表
CREATE TABLE IF NOT EXISTS home_care (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card VARCHAR(18) NOT NULL,
  name VARCHAR(50),
  service_type VARCHAR(50) NOT NULL,
  service_frequency VARCHAR(30),
  start_date DATE,
  end_date DATE,
  current_status VARCHAR(20) DEFAULT '服务中',
  service_provider VARCHAR(100),
  contact_phone VARCHAR(20),
  service_records TEXT,
  remark TEXT,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE home_care ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hc_select_all" ON home_care AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "hc_all_auth" ON home_care AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- 12. 临时救助表
CREATE TABLE IF NOT EXISTS temporary_assistance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card VARCHAR(18) NOT NULL,
  name VARCHAR(50),
  assistance_date DATE NOT NULL,
  assistance_reason VARCHAR(200),
  assistance_type VARCHAR(50),
  assistance_amount DECIMAL(10,2) DEFAULT 0,
  materials TEXT,
  operator VARCHAR(50),
  remark TEXT,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE temporary_assistance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ta_select_all" ON temporary_assistance AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "ta_all_auth" ON temporary_assistance AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- 13. 民政补贴标准库
CREATE TABLE IF NOT EXISTS civil_affairs_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_type VARCHAR(50) NOT NULL,
  standard_name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) DEFAULT '元/月',
  effective_date DATE NOT NULL,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  description TEXT,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE civil_affairs_standards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cas_select_all" ON civil_affairs_standards AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "cas_all_auth" ON civil_affairs_standards AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- 14. 居民医保缴费表
CREATE TABLE IF NOT EXISTS medical_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card VARCHAR(18) NOT NULL,
  name VARCHAR(50),
  insurance_year INTEGER NOT NULL,
  payment_amount DECIMAL(10,2) DEFAULT 0,
  payment_date DATE,
  payment_method VARCHAR(30),
  receipt_no VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT '已缴费',
  is_newly_added BOOLEAN DEFAULT false,
  remark TEXT,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE medical_insurance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mi_select_all" ON medical_insurance AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "mi_all_auth" ON medical_insurance AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mi_id_card_year ON medical_insurance(id_card, insurance_year);
CREATE INDEX IF NOT EXISTS idx_mi_year ON medical_insurance(insurance_year);

-- 15. 居民养老保险表
CREATE TABLE IF NOT EXISTS pension_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_card VARCHAR(18) NOT NULL,
  name VARCHAR(50),
  is_insured BOOLEAN DEFAULT false,
  insured_year INTEGER,
  payment_years INTEGER DEFAULT 0,
  cumulative_payment_years DECIMAL(5,1) DEFAULT 0,
  insured_status VARCHAR(30) DEFAULT '正常参保',
  treatment_status VARCHAR(30) DEFAULT '未到龄',
  treatment_start_date DATE,
  monthly_treatment_amount DECIMAL(10,2) DEFAULT 0,
  is_receiving_pension BOOLEAN DEFAULT false,
  age_reminder_type VARCHAR(30),
  verification_status VARCHAR(20) DEFAULT '待核实',
  remark TEXT,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE pension_insurance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pi_select_all" ON pension_insurance AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "pi_all_auth" ON pension_insurance AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pi_id_card ON pension_insurance(id_card);

-- 16. 材料附件表
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  related_type VARCHAR(50) NOT NULL,
  related_id VARCHAR(50) NOT NULL,
  doc_name VARCHAR(200) NOT NULL,
  doc_type VARCHAR(50),
  file_path TEXT,
  file_size BIGINT,
  upload_date DATE,
  uploader VARCHAR(50),
  remark TEXT,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docs_select_all" ON documents AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "docs_all_auth" ON documents AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- 17. 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type VARCHAR(50) NOT NULL,
  module_name VARCHAR(50),
  operation_content TEXT,
  operator_id VARCHAR(50),
  operator_name VARCHAR(50),
  ip_address VARCHAR(50),
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_select_all" ON operation_logs AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "logs_all_auth" ON operation_logs AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- 18. 系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type VARCHAR(20) DEFAULT 'string',
  description TEXT,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (CASE WHEN current_setting('app.user_id', TRUE) = '' THEN NULL ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile END)
);
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ss_select_all" ON system_settings AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "ss_all_auth" ON system_settings AS PERMISSIVE FOR ALL TO authenticated USING (true);

COMMIT;