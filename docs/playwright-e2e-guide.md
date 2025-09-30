# Playwright E2E 测试指南

本文介绍在 MCP Router 项目中如何使用 Playwright 运行 Electron 端到端测试，并给出常见命令与调试方式。`apps/electron/e2e/README.md` 也提供了基础说明，可配合本文使用。

## 目录结构

```
apps/electron/e2e/
├── fixtures/              # Playwright 测试夹具与页面对象
│   ├── electron-app.ts    # Electron 应用启动逻辑
│   └── page-objects/      # 页面对象抽象层
├── specs/                 # 实际测试用例（例如 app-launch.spec.ts）
├── utils/                 # 常用工具函数（如窗口定位、等待工具）
├── playwright-electron.config.ts  # Playwright 配置文件
└── README.md              # 与本文互补的运行说明
```

## 环境准备

- Node.js ≥ 20，推荐使用 pnpm 8 以上版本（仓库已配置 `packageManager: pnpm@8.15.6`）。
- 首次拉取后运行 `pnpm install` 安装依赖。
- 如果是首次在本机使用 Playwright，可执行 `pnpm --filter @mcp_router/electron exec playwright install` 以确保必需运行时已安装。

## 运行测试

### 常规流程（推荐从仓库根目录执行）

```bash
pnpm test:e2e
```

该命令会触发以下流程：
- `pnpm make` 生成 Electron 生产构建（放置在 `apps/electron/.webpack` 目录）。
- 拷贝 `package.json` 进入 `.webpack/arm64/main/`，供 Electron 启动依赖。
- 使用 `playwright test --config=e2e/playwright-electron.config.ts` 运行全部规格文件。

### 快速迭代

- **仅重新执行 Playwright：** `pnpm --filter @mcp_router/electron test:e2e:only`
- **headed 模式观察窗口：** `pnpm --filter @mcp_router/electron test:e2e:headed`
- **打开调试 UI：** `pnpm --filter @mcp_router/electron exec playwright test --config=e2e/playwright-electron.config.ts --ui`
- **逐步排查：** 在上述命令后追加 `--debug` 或 `PWDEBUG=1` 环境变量。

测试失败时会在 `apps/electron/e2e/playwright-report/` 生成 HTML 报告；可通过 `pnpm --filter @mcp_router/electron exec playwright show-report` 复查结果。

## 调试技巧

- `fixtures/electron-app.ts` 会先启动打包后的 Electron 程序，再通过 `_electron.launch` 建立 Playwright 会话。若启动失败，优先确认 `.webpack` 构建是否存在。
- `utils/helpers.ts` 提供 `waitForAppReady`、`getMainWindow` 等工具，可在自定义用例中复用。
- 为保持测试稳定，建议在被测页面上增加 `data-testid` 属性，结合页面对象封装常用交互。

## CI 与约定

- 仓库默认在 CI 中以 headless 模式运行 Playwright，并配置了失败重试与 HTML 报告。
- 对关键业务流新增用例时，请同步在 PR 描述中列出已执行的测试命令。
