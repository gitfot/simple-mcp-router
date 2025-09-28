# 构建问题排查笔记（MCP Router 桌面端）

## 背景
在 Windows 环境（Node ≥ 20、pnpm 8.15.6）执行 `pnpm install` 与 `pnpm make` 构建 Electron 安装包时，先后遇到 Git 依赖下载失败与 Electron 二进制下载中断的问题。现将排查过程、命令及结论记录如下，便于后续同类环境快速复用。

## 问题与处理

### 1. `pnpm install` 阶段：Git SSH 主机验证失败
- **报错摘要**：
  ```text
  git -c core.longpaths=true fetch --depth 1 origin 06b29aaf...
  Host key verification failed.
  ```
- **影响**：无法拉取 `@electron/node-gyp` 的 GitHub 仓库，`@electron/rebuild` 安装中断。
- **处置步骤**：
  1. 通过 SSH 接受 GitHub 指纹：
     ```powershell
     ssh -T git@github.com
     # 或
     ssh-keyscan -H github.com >> $env:USERPROFILE\.ssh\known_hosts
     ```
  2. 若需改走 HTTPS，可执行：
     ```powershell
     git config --global url."https://github.com/".insteadOf "git@github.com:"
     ```
  3. 重新运行 `pnpm install`，依赖可正常解析。

### 2. `pnpm install` 阶段：Electron postinstall 下载超时
- **报错摘要**：`RequestError: connect ETIMEDOUT 20.205.243.166:443`，或 `ReadError: The server aborted pending request`。
- **根因**：`electron@36.9.0` 默认从 GitHub CDN 下载二进制，网络无法稳定访问。
- **处置步骤**：
  1. 在执行命令的终端临时设置镜像与缓存目录：
     ```powershell
     $env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
     $env:ELECTRON_BUILDER_BINARIES_MIRROR = "https://npmmirror.com/mirrors/electron-builder-binaries/"
     $env:ELECTRON_CACHE = "$env:LOCALAPPDATA\electron\Cache"
     ```
  2. 若网络仍不稳定，可手动预下所需压缩包并放入缓存：
     ```powershell
     $version = "36.9.0"
     Invoke-WebRequest -Uri "https://npmmirror.com/mirrors/electron/v$version/electron-v$version-win32-x64.zip" `
       -OutFile "$env:ELECTRON_CACHE\electron-v$version-win32-x64.zip"
     ```
     按需校验 SHA256 后再次执行 `pnpm install`。
  3. 对于持续性超时，可提高重试与超时阈值：
     ```powershell
     pnpm install --fetch-timeout 600000 --fetch-retries 5
     ```

### 3. `pnpm make` 阶段：Forge 下载二进制失败
- **报错摘要**：`ReadError: The server aborted pending request`。
- **根因**：打包时 Electron Forge 仍需下载 Electron/电子签名等工具，与步骤 2 同源。
- **处置步骤**：
  1. 确保与安装阶段相同的镜像/缓存环境变量在当前终端已设置。
  2. 若已准备本地缓存，确认 `electron-v36.9.0-win32-x64.zip` 位于 `$env:ELECTRON_CACHE`。
  3. 运行带超时参数的构建命令：
     ```powershell
     pnpm --filter @mcp_router/electron make --fetch-timeout 600000 --fetch-retries 5
     ```
  4. 命令执行成功后，Windows 安装包位于 `apps/electron/out/make/squirrel.windows/x64/`，包含 `MCP Router Setup <version>.exe` 及 ZIP 产物。

## 经验总结
- 多包仓库中的 `pnpm.overrides` 应集中放在根 `package.json`，子包内的配置不会生效（构建时会有 WARN）。
- 使用 `setx` 写入环境变量后需重新打开终端；若在同一窗口连续操作，需要通过 `$env:VAR = "..."` 重新赋值。
- Electron 及 electron-builder 相关工具默认从 GitHub 下载，内网或跨境网络需提前配置镜像或离线缓存，以免在 install 与 make 阶段重复失败。
- 最终采用 `pnpm --filter @mcp_router/electron make` 可缩短依赖构建范围，结合缓存后顺利生成安装包。
