# MCP Router 功能架构总览

## 项目概述
MCP Router 是一款基于 Electron 的桌面应用，内嵌 React 渲染层与 Node 主进程，通过 MCP（Model Context Protocol）统一接入多种 AI 代理与工具。项目采用 pnpm monorepo，将跨端数据模型封装在 `packages/shared`，UI 组件沉淀在 `packages/ui`，并通过 TurboRepo 串联多包构建与测试。

## 分层结构总览
应用主要分为三层：
- **主进程（`apps/electron/src/main`）**：负责业务核心、数据库访问、MCP 会话调度与系统资源控制。
- **渲染进程（`apps/electron/src/renderer`）**：提供 React + Tailwind UI、Zustand 状态管理与可视化编排工具。
- **平台抽象（Platform API）**：在 `packages/shared/src/types/platform-api` 对外暴露统一类型接口，Electron 侧通过 IPC 封装具体实现，保证未来 Web 端或远程控制台可共享同一调用约定。

## 主进程核心模块
### Workspace 模块
- 位置：`main/modules/workspace`
- 功能：管理本地与远程工作区元数据，维护独立的 sqlite 数据库实例；负责切换工作区时的实例重置、Electron Session 生命周期与文件夹初始化。
- 亮点：默认生成本地工作区 `local-default`，支持导入旧版 `mcprouter.db`，并通过事件总线向其他模块广播工作区变化。

### MCP Server Manager
- 位置：`main/modules/mcp-server-manager`
- 功能：统一维护 MCP 服务器配置、启动/停止生命周期、自动启动策略与运行期状态缓存；与 `server-service` 协作持久化配置；在启动时接入 `mcp-apps-manager` 完成凭据替换与客户端初始化。
- 关联：启动流程会同步刷新 `mcp-logger` 的 server 名称映射，并向平台 API 通知状态变更。

### MCP Server Runtime
- 位置：`main/modules/mcp-server-runtime`
- 功能：对外暴露 HTTP/WebSocket 网关，通过 `http` 子模块协调请求分发；提供本地代理能力，使外部应用可通过 Router 间接访问已配置的 MCP Server。

### MCP Apps Manager
- 位置：`main/modules/mcp-apps-manager`
- 功能：管理第三方客户端令牌、处理 DXT/JSON 等连接方式，支持命令行、Docker 等多元部署；核心服务负责为 Server Manager 提供 `connectToMCPServer`、参数占位替换、令牌生成/验证等能力。

### Agent 模块
- 位置：`main/modules/agent`
- 功能：区分开发中与已部署两个生命周期，提供 CRUD、部署发布、Session 管理与 MCP 工具调用；`AgentSharingService` 支持导入导出配置，`DeployedAgentService` 维护运行态实例并跟踪服务器连接状态与工具可用性。

### Workflow & Hook 模块
- 位置：`main/modules/workflow`
- 功能：实现可视化工作流与 Hook 系统，按照 ADR 设计提供 Start/End/MCP Call/Hook 节点；支持 Pre/Post Hook JavaScript 脚本沙箱执行，并按照阻塞/非阻塞模式调度；工作流定义以 JSON 持久化，支撑工具调用前后的拦截、修改与审计。

### MCP Logger 模块
- 位置：`main/modules/mcp-logger`
- 功能：集中收集服务器日志、执行流程日志与 Hook 输出，支持实时订阅、筛选与导出；与 Server Manager 协调维护 serverId/name 映射，实现统一展示。

### System & Settings 模块
- 位置：`main/modules/system`、`main/modules/settings`
- 功能：`system` 负责环境检测、外部命令执行与 Electron Forge 更新流程；`settings` 管理全局偏好，如主题、遥测、代理配置及临时遮罩计数，并提供重置与变更订阅能力。

### Infrastructure & Utilities
- `infrastructure/database` 提供 `SqliteManager`、仓储基类及迁移策略（详见 ADR）；
- `main/ui` 管控菜单与系统托盘；
- `utils` 汇总日志、环境变量、错误处理等通用工具。

## 渲染进程模块
### React 组件分区
- `components/agent`：负责代理列表、部署、对话面板及工具调试 UI；
- `components/mcp`：承载服务器列表、连接测试与日志面板；
- `components/workflow`：基于 React Flow 的工作流编辑器；
- `components/setting`、`components/workspace`、`components/auth` 等分别处理设置、工作区切换与登录体验；全局框架由 `Layout`、`Sidebar`、`TitleBar` 组成。

### 状态管理与服务
- Zustand stores (`renderer/stores`) 划分为 `server-store`、`workflow-store`、`agent-store` 等，统一从 Platform API 拉取数据并响应推送事件；
- `renderer/services` 封装 UI 层业务，如表单校验、键盘快捷键；
- `renderer/platform-api` 按 `agent/app/auth/hooks/log/package/server/settings/workspace` 九大域暴露调用方法，确保类型安全与可测试性。

## 共享与辅助包
- `packages/shared`：集中类型定义，涵盖服务器、代理、工作流、平台 API 等领域模型；
- `packages/ui`：提供 Tailwind 设计体系下的基础组件与主题；
- `packages/tailwind-config`：统一 Tailwind 预设；
- `packages/remote-api-types`：对外暴露远程控制所需的 TypeScript 类型及构建产物。

## 典型功能流程
1. **新增 MCP 服务器**：渲染层调用 Platform `server.create` → 主进程 `MCPServerManager.addServer` 持久化 → 若配置 `autoStart`，立即通过 `startServer` 生成运行实例并注册日志通道。
2. **部署代理**：开发态代理在 UI 完成配置 → `DevelopmentAgentService` 保存草稿 → 触发 `deployFromAgent` 生成部署记录 → `DeployedAgentService` 缓存实例并可调用对应 MCP 工具。
3. **执行 Hook 工作流**：用户在可视化编辑器编排流程 → JSON 定义保存于 Workflow 模块 → 当服务器触发工具调用时，Workflow Engine 依次执行 Pre Hook、MCP 调用与 Post Hook，异步钩子结果写入 Logger。

## 未来改造切入点建议
- 按模块扩展：可围绕 `modules` 子目录逐个功能改造，避免跨域依赖；
- Platform API 扩展：新增能力需先在 `packages/shared` 定义类型，再在主、渲染层补齐实现；
- 数据层演进：关注 `docs/adr/database` 中的模式，确保多工作区下的迁移与备份策略一致。
