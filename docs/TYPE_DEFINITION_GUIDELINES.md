# TypeScript 类型定义指引

## 概述

本文档说明 MCP Router 项目中 TypeScript 类型定义的统一规范。通过集中化管理类型，可以提升可维护性、减少重复，并确保代码库各处保持一致。

## 类型定义存放位置

### ✅ 允许的目录

类型只能定义在以下位置：

1. **`packages/shared/src/types/`** —— 共享类型的主目录
   - 领域类型（MCP、Agent、User 等）
   - API 类型（请求/响应）
   - 通用 UI Props 模式
   - Store 状态类型

2. **`packages/remote-api-types/src/`** —— 远程 API 模型
   - Zod schema
   - 基于 schema 生成的类型

3. **`apps/electron/src/lib/database/schema/`** —— 数据库相关类型
   - 数据表结构
   - 数据库实体类型

4. **`apps/electron/src/lib/platform-api/types/`** —— 平台 API 类型
   - Electron IPC API 类型
   - 平台相关接口定义

5. **`apps/electron/src/frontend/stores/types/`** —— 前端 Store 类型
   - Store 状态接口
   - Store 专用类型

6. **类型声明文件（`*.d.ts`）** —— 全局类型声明

### ❌ 禁止的目录

以下位置不得新增类型定义：
- 组件文件（组件 Props 接口除外）
- Service 文件
- 工具方法文件
- 测试文件（仅允许测试专用类型）

## 组织结构建议

```
packages/shared/src/types/
├── domains/          # 领域实体
│   ├── mcp.ts       # MCP 服务器、工具、资源类型
│   ├── agent.ts     # Agent 配置类型
│   ├── auth.service.ts      # 认证相关类型
│   └── workspace.ts # 工作区类型
├── api/             # API 相关类型
│   ├── requests.ts  # API 请求类型
│   ├── responses.ts # API 响应类型
│   └── errors.ts    # API 错误类型
├── ui/              # UI 组件通用模式
│   ├── props.ts     # 通用 Props 接口
│   └── state.ts     # 通用状态类型
├── store/           # Store 状态类型
│   └── ipc.ts     # Store 状态接口
└── ipc.ts         # 主导出文件
```

## 类型定义规则

### 1. 组件 Props

组件 Props 接口可以写在 `.tsx` 文件中，但需要遵循以下范式：

```typescript
// ✅ 推荐
interface MyComponentProps {
  title: string;
  onClose: () => void;
}

// ❌ 不推荐 —— 通用模式请复用 shared UI 类型
interface MyComponentProps extends DialogProps {
  customField: string;
}
```

### 2. 从 shared 包导入

始终从共享包导入类型：

```typescript
// ✅ 正确
import { MCPServer, AgentConfig } from '@mcp_router/shared/types';

// ❌ 错误 —— 不要在本地重新定义
interface MCPServer {
  // ...
}
```

### 3. 扩展共享类型

若需要在共享类型基础上扩展，应使用继承：

```typescript
// ✅ 正确
import { MCPServer } from '@mcp_router/shared/types';

interface ExtendedMCPServer extends MCPServer {
  customField: string;
}
```

### 4. 数据库类型

数据库类型与 schema 保持在一起，同时通过映射转换成领域类型：

```typescript
// 数据库 schema
export interface DBUser {
  id: number;
  email: string;
  created_at: Date;
}

// 映射函数
import { User } from '@mcp_router/shared/types';

export function mapDBUserToUser(dbUser: DBUser): User {
  // mapping logic
}
```

## ESLint 规范

项目使用自定义 ESLint 规则（`custom/no-scattered-types`）来强制执行上述约束：

- ❌ 禁止在未授权目录定义类型
- ✅ 允许 `.tsx` 文件中的组件 Props 接口
- ✅ 允许测试文件中的类型
- ✅ 允许 `.d.ts` 文件中的类型

## 迁移指引

迁移历史类型时请遵循以下步骤：

1. 确认类型类别（领域、API、UI 等）
2. 将类型移动到 `packages/shared/src/types/` 中对应目录
3. 更新所有引用，改为从共享包导入
4. 删除原始类型定义
5. 运行 `pnpm lint` 确认规范通过

自定义 ESLint 规则会在 Commit 阶段自动检查，确保迁移完成后不再出现散落类型。

## 示例

### 迁移前（类型分散）
```typescript
// apps/electron/src/services/mcp-service.ts
interface MCPServerConfig {
  id: string;
  name: string;
}

// apps/web/src/components/ServerList.tsx
interface MCPServerConfig {
  id: string;
  name: string;
  status?: string;
}
```

### 迁移后（类型集中）
```typescript
// packages/shared/src/types/domains/mcp.ts
export interface MCPServerConfig {
  id: string;
  name: string;
  status?: string;
}

// apps/electron/src/services/mcp-service.ts
import { MCPServerConfig } from '@mcp_router/shared/types';

// apps/web/src/components/ServerList.tsx
import { MCPServerConfig } from '@mcp_router/shared/types';
```

## 收益

1. **唯一可信源**：杜绝重复定义
2. **更佳的智能提示**：IDE 能给出准确补全
3. **更易重构**：只需在单处修改类型
4. **类型安全**：前后端一致
5. **减小包体**：构建结果不会重复打包类型
