# 三元社区户籍人口综合管理系统

基层社区人口、民政、人社一体化管理工具。核心理念：一人一档、一户一档、数据联动、自动提醒、一次录入、多处使用。

## 技术栈

- **前端**：React 19 + TypeScript + TailwindCSS + shadcn/ui + Vite
- **后端**：NestJS 10 + Drizzle ORM + PostgreSQL
- **构建工具**：Vite + Rspack
- **包管理**：npm

## 功能模块

1. **工作台** - 人口/民政/医保/养老概况、本月待办、快捷操作
2. **人口管理** - 户籍人口、家庭户管理、人员变动、死亡档案
3. **民政管理** - 低保、特困、残疾人、高龄津贴、儿童保障、居家服务、低边、刚支、临时救助
4. **人社管理** - 居民医保、居民养老保险
5. **档案管理** - 工作台、档案中心、人员档案、档案分类、待归档、模板中心、快速生成、全文搜索、工作提醒、台账中心、回收站
6. **待办与核查** - 待办与数据核查
7. **系统设置** - 系统设置

## 环境要求

- Node.js &gt;= 22.0.0
- PostgreSQL &gt;= 14
- npm &gt;= 9.x

## 项目结构

```
├── client/              # React 前端
│   ├── src/
│   │   ├── pages/       # 页面组件
│   │   ├── components/  # 可复用组件
│   │   ├── api/         # API 调用
│   │   └── app.tsx      # 路由配置
│   └── index.html
├── server/              # NestJS 后端
│   ├── modules/         # 业务模块
│   ├── database/        # Drizzle ORM Schema
│   └── common/          # 共享工具
├── shared/              # 前后端共享类型
│   └── api.interface.ts
├── database/            # 数据库脚本
│   ├── ddl_create_tables.sql  # 建表 DDL
│   └── seed_data.sql    # 种子数据（示例数据）
├── .env.example         # 环境变量示例
├── AGENTS.md            # 应用设计规范
└── package.json         # 根配置
```

## 本地部署步骤

### 1. 安装依赖

在项目根目录执行：

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，根据实际情况修改：

```bash
cp .env.example .env
```

主要环境变量：

```env
# 数据库连接
DATABASE_URL=postgres://username:password@localhost:5432/sanyuan_community

# 应用端口（后端）
PORT=3000

# 客户端端口（前端）
CLIENT_PORT=5173
```

### 3. 初始化数据库

创建 PostgreSQL 数据库：

```sql
CREATE DATABASE sanyuan_community;
```

执行建表 DDL：

```bash
psql -U your_user -d sanyuan_community -f database/ddl_create_tables.sql
```

（可选）导入种子示例数据：

```bash
psql -U your_user -d sanyuan_community -f database/seed_data.sql
```

### 4. 启动开发服务

```bash
# 同时启动前后端
npm run dev
```

- 前端开发服务器：http://localhost:5173
- 后端 API 服务器：http://localhost:3000

### 5. 构建生产版本

```bash
# 同时构建前后端
npm run build
```

## 数据库 Schema

本项目使用 Drizzle ORM，Schema 定义文件位于 `server/database/schema.ts`，建表 DDL 位于 `database/ddl_create_tables.sql`。

如需修改表结构：
1. 在数据库中执行 DDL（ALTER TABLE / CREATE TABLE）
2. 运行 `npm run gen:db-schema` 重新生成 schema.ts

### 主要数据表

| 表名 | 说明 |
|------|------|
| `population` | 户籍人口信息 |
| `households` | 家庭户信息 |
| `population_changes` | 人员变动记录 |
| `death_records` | 死亡档案 |
| `low_income` | 低保人员 |
| `special_poverty` | 特困供养人员 |
| `disabled_persons` | 残疾人档案 |
| `elderly_allowance` | 高龄津贴 |
| `child_support` | 儿童保障 |
| `home_care` | 居家服务 |
| `low_income_edge` | 低边人员 |
| `rigid_expenditure` | 刚性支出 |
| `temporary_assistance` | 临时救助 |
| `medical_insurance` | 居民医保 |
| `pension_insurance` | 居民养老保险 |
| `archive_categories` | 档案分类 |
| `archives` | 档案主表 |
| `archive_files` | 档案文件 |
| `archive_templates` | 档案模板 |
| `archive_reminders` | 档案提醒 |
| `archive_operation_logs` | 档案操作日志 |
| `settings` | 系统设置 |
| `todo_tasks` | 待办任务 |

## 注意事项

1. **用户系统**：本项目依赖妙搭平台内置的用户登录系统，本地部署时登录/注册、用户选择等功能需自行适配
2. **文件存储**：文件上传功能依赖妙搭平台的 dataloom 存储服务，本地部署需自行实现文件存储逻辑
3. **飞书集成**：如涉及飞书消息、多维表格等插件功能，需在妙搭平台配置相应插件实例
4. **权限控制**：RLS（行级安全策略）依赖平台身份中间件，本地部署需自行调整
5. **妙搭 SDK**：`@lark-apaas/fullstack-nestjs-core`、`@lark-apaas/client-toolkit` 等妙搭专属 SDK 需在妙搭平台环境下使用

## 设计规范

- 主色：蓝色系 `#165DFF`（政务系统风格）
- 成功：`#00B42A`
- 警告：`#FF7D00`
- 危险：`#F53F3F`
- 卡片圆角 8px，按钮圆角 6px
- 侧边栏宽度 240px

详见 `AGENTS.md`

## License

内部使用
