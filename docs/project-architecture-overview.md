# MCP Router 功能架构总览

## 项目概述
MCP Router 是一款基于 Electron 的桌面端工具，专注于本地与远程 MCP 服务的统一管理。应用由 Node 主进程与 React 渲染层组成，通过平台 API 在两端共享类型与调用约定，提供服务器启停、远程连接、令牌管理以及请求日志观测等核心能力。仓库采用 pnpm monorepo，公共类型沉淀在 `packages/shared`，UI 组件封装在 `packages/ui`，并借助 TurboRepo 统一构建流水线。

## 分层结构总览
应用沿用“三层 + 平台抽象”结构：
- **主进程（`apps/electron/src/main`）**：负责服务器生命周期、磁盘资源、系统命令执行与远程代理。
- **渲染进程（`apps/electron/src/renderer`）**：承担 UI 渲染、交互逻辑与状态管理，通过 IPC 调用主进程能力。
- **平台抽象（Platform API）**：在 `packages/shared/src/types/platform-api` 定义共享类型，Electron 端封装实际实现，确保未来可扩展至 Web 或远程控制台。

## 主进程核心模块
### Workspace 模块
- 位置：`main/modules/workspace`
- 职责：维护本地/远程工作区清单与当前上下文，管理 sqlite 数据文件及迁移；切换工作区时负责初始化关联目录并广播变更事件。

### MCP Server Manager
- 位置：`main/modules/mcp-server-manager`
- 职责：集中管理 MCP 服务配置、启动/停止状态与自动拉起策略；与 `server-service` 协作持久化配置并推送状态更新。

### MCP Server Runtime
- 位置：`main/modules/mcp-server-runtime`
- 职责：提供本地代理与远程 HTTP/WebSocket 网关，封装 SSE、Streamable HTTP 等传输方式，使外部客户端可通过 Router 访问已配置的服务器。

### MCP Apps Manager
- 位置：`main/modules/mcp-apps-manager`
- 职责：管理第三方应用集成令牌、生成短期访问凭据、完成 DXT/JSON 导入；在服务器启动时注入必要的连接参数，并协调 OAuth 回调。

### MCP Logger
- 位置：`main/modules/mcp-logger`
- 职责：记录并索引请求日志、工具调用及运行期事件，向渲染层提供实时订阅与分页查询。

### Settings 模块
- 位置：`main/modules/settings`
- 职责：保存主题、登录令牌等全局偏好，提供读取、更新与重置接口；在应用启动时加载默认值并监听变更。

### System 模块
- 位置：`main/modules/system`
- 职责：运行环境检测、外部命令执行以及 Electron Forge 更新流程封装，提供必要的系统信息查询接口。

### Auth 模块
- 位置：`main/modules/auth`
- 职责：处理登录流程与令牌刷新，向设置模块写入用户资料，并对远程工作区访问提供凭证支撑。

## 渲染进程模块
### React 组件分区
- `components/mcp`：服务器列表、详情面板、运行状态与配置表单。
- `components/workspace`：工作区切换对话框与导入导出能力。
- `components/setting`：主题、语言、登录状态及积分展示。
- `components/auth`：登录引导与回调处理。
- `components/layout` `components/common`：应用框架、侧边栏、标题栏及通用控件。

### 状态管理与服务
- Zustand stores（`renderer/stores`）：`server-store` 负责服务器 CRUD 与运行状态，`workspace-store` 负责工作区列表，`auth-store` 同步登录态，`theme-store` 与 `view-preferences-store` 管理 UI 偏好，`ui-store`/`server-editing-store` 管控弹窗与临时编辑数据。
- `renderer/platform-api`：以域划分暴露 `servers`、`apps`、`logs`、`workspaces`、`settings`、`auth` 等调用，自动注入平台区分逻辑（本地/远程）。
- `renderer/services`：封装表单处理、文件选择、日志格式化等 UI 侧业务。

## 共享与辅助包
- `packages/shared`：集中维护平台 API、服务器、应用、日志等 TypeScript 类型与常量。
- `packages/ui`：提供 Tailwind 体系下的基础组件与主题配置。
- `packages/tailwind-config`：统一 Tailwind 预设，供子包复用。
- `packages/remote-api-types`：导出远程控制台所需的 API 类型与工具方法。

## 典型功能流程
1. **新增 MCP 服务**：渲染层调用 Platform API `servers.create` → 主进程 `MCPServerManager.addServer` 持久化 → 按配置自动启动并通过 Logger 注册事件流。
2. **配置 MCP App 集成**：渲染层创建或导入应用 → `MCPAppsManager` 生成令牌并绑定服务器 → 在客户端中使用生成的 URL/Token 完成集成。
3. **查看请求日志**：渲染层调用 Platform API `logs.query` → 主进程 `MCPLogger` 读取本地索引 → 前端按时间轴/分页展示并支持过滤。

## 改进建议
- **模块化演进**：持续按模块维度拆分服务边界，保持 IPC 接口清晰可测。
- **可观测性**：在不引入重型链路的前提下增加失败重试、速率统计等指标，保障服务器运行可见性。
- **远程能力**：为远程工作区逐步引入 Token 生命周期管理、只读模式等策略，提升部署安全性。
