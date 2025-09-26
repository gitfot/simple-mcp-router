# Repository Guidelines

## 项目结构与模块组织
- 核心应用：`apps/electron` 覆盖 Electron main process 与 React renderer，E2E 脚本 位于 `apps/electron/e2e`。
- 共享逻辑：`packages/shared` 提供 core utils，`packages/ui` 聚合 组件，`packages/remote-api-types` 保存 协议 类型。
- 样式预设：`packages/tailwind-config` 对齐 Tailwind preset，公共 样式 在 `packages/ui` 内 共用。
- 资源与文档：`public/` 提供 静态 资源，`docs/` 汇总 产品 流程 与 运营 指南。

## 构建、测试与开发命令
- 安装依赖：`pnpm install`，Node 版本 ≥ 20。
- 多包开发：`pnpm dev` 通过 turbo graph 同步 构建 shared 与 electron。
- 构建产物：`pnpm build` 输出 dist，发布桌面端 使用 `pnpm make` 或 `pnpm --filter @mcp_router/electron publish`。
- 定向调试：在 `apps/electron` 执行 `pnpm start` 获取 标准 打包流程，或 `pnpm dev -- --enable-logging` 追踪 日志。

## 代码风格与命名约定
- 语言栈：TypeScript + React + Tailwind，遵循 ESLint 与 Prettier；执行 `pnpm lint:fix`、`pnpm -C apps/electron lint` 保持 两空格 缩进 与 单引号。
- 文件命名：React 组件 使用 PascalCase，例如 `ServerList.tsx`；hooks 以 `use` 前缀；常量 使用 SCREAMING_SNAKE_CASE。
- 状态管理：优先 使用 Zustand 与 内建 hooks；复杂 样式 组件 迁移 至 `packages/ui` 统一 维护。
- 注释规范：仅 对 复杂 逻辑 添加 中文 概述，避免 冗余 叙述。

## 测试指引
- 主要 覆盖：Playwright E2E 位于 `apps/electron/e2e`，场景文件 按 功能 命名，如 `toggle-servers.spec.ts`。
- 执行命令：根目录 `pnpm test:e2e` 先触发 `pnpm make`，需要 headed 模式 调用 `pnpm -C apps/electron test:e2e:headed`。
- 新增用例：保障 关键 操作 包含 登录、路由、连接 管理 断言，并 在 PR 描述 填写 已运行 用例。
- 快速 回归：局部 调试 可使用 `pnpm -C apps/electron test:e2e:only` 并 结合 `PWDEBUG=1` 观察 UI。

## 提交与 Pull Request
- 提交语气：使用 英文 祈使动词，参考 `Remove legacy router config`、`Fix connection status sync`；关联 issue 时 附 `(#id)`。
- PR 要求：说明 变更 背景、代码 范围、测试 结果；界面 改动 提供 截图 或 录屏 链接。
- 验证流程：合并 前 至少 跑 `pnpm lint:fix`、`pnpm typecheck`、`pnpm test:e2e`；失败 时 写明 阻塞 方案 与 临时 处理。
- 版本管理：发布 前 更新 `apps/electron/package.json` 与 相关 changelog，确保 与 `package.json` 版本 对齐。

## 安全与配置提示
- 环境变量：所有 凭据 通过 `.env.local` 或 系统 密钥 管理，避免 将 `.env` 文件 提交 仓库。
- 网络 与 日志：Playwright 录制 输出 位于 `apps/electron/e2e/output`，PR 完成 后 清理 大体积 产物。
- 依赖 升级：遵循 pnpm overrides 规则，升级 Electron 或 Octokit 时 先 调整 根目录 `package.json` overrides 并 记录 影响。
- 审计 留痕：关键 决策 在 PR 评论 总结，匹配 Serena 记忆 机制，方便 追踪 历史。
