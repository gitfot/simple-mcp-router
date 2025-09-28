# 代码质量治理指南

## ESLint 配置策略
- 根目录 `eslint.config.mjs` 作为唯一配置源，统一加载 `@typescript-eslint`、`prettier` 以及 `tools/eslint-rules` 自研规则。
- `apps/electron`、`packages/shared`、`packages/tailwind-config` 仅通过 `export { default } from '../../eslint.config.mjs';` 复用根配置，避免规则漂移。
- 如需针对特定目录放宽或新增规则，请在根配置中追加 overrides，保持集中治理。

## 格式化与 Lint 脚本入口
- 根级命令：`pnpm lint`（只检查）、`pnpm lint:fix`（自动修复）、`pnpm format`（批量格式化）、`pnpm format:check`（只校验）。
- 子包兼容脚本（如 `apps/electron`）统一代理到根目录命令，保证任何目录下执行都落到同一份配置。
- 建议在 Powershell 环境执行时使用 `powershell -Command "pnpm lint"` 等形式，便于与仓库规范保持一致。

## 批量修复推荐流程
1. 首次执行 `powershell -Command "pnpm lint"`，确认告警规模并记录关键规则。
2. 运行 `powershell -Command "pnpm lint:fix --cache"` 与 `powershell -Command "pnpm format"` 完成可自动修复的部分。
3. 对剩余告警按规则分组逐项处理，必要时在根配置追加针对性 overrides 或补充类型声明。
4. 完成修复后，再次运行 `powershell -Command "pnpm lint"` 与 `powershell -Command "pnpm format:check"`，确保零告警。

## 回滚与注意事项
- 如需撤销本次策略变更，可执行 `git checkout -- eslint.config.mjs apps/electron/eslint.config.mjs packages/shared/eslint.config.mjs packages/tailwind-config/eslint.config.mjs package.json apps/electron/package.json docs/code-quality.md`。
- 所有脚本均启用统一配置，请避免在子包内新增独立 `.eslintrc` 或 `.prettierrc`，以防产生重复治理成本。
