# MCP Router 安全评估（2025-03-13）

## 背景
根据仓库当前 @mcp_router/electron 实现，对涉及身份凭据、服务器配置与命令执行的代码进行了静态审查。本报告用于记录已发现的主要安全风险与整改建议，尚未包含运行时验证或渗透测试结果。

## 高风险问题

### 明文存储身份令牌
- 位置：apps/electron/src/main/modules/settings/settings.repository.ts:123，apps/electron/src/main/modules/auth/auth.service.ts:223
- 描述：应用将完整的设置对象序列化为 JSON 写入 SQLite 数据库，登录后获取的 authToken 会随同明文保存并直接返回给调用方。
- 影响：一旦 mcprouter.db 被复制或读取，攻击者可立即伪造登录态访问云端 API。
- 建议：使用 safeStorage、操作系统密钥链或 KMS 加密敏感字段，迁移历史数据，并限制令牌读取接口。

### 服务器密钥与环境变量未加密
- 位置：apps/electron/src/main/modules/mcp-server-manager/mcp-server-manager.repository.ts:181，apps/electron/src/main/modules/workspace/workspace.repository.ts:153
- 描述：MCP 服务器的 bearerToken、env、command 等字段在数据库中以明文存储，远程工作区认证信息仅做 Base64 编码。
- 影响：攻击者可窃取远程服务访问密钥，或篡改环境变量与命令以注入恶意行为。
- 建议：对敏感配置写入落盘前统一加密；为工作区密钥引入密钥轮换与访问审计。

### 不受信任命令执行风险
- 位置：apps/electron/src/main/modules/mcp-apps-manager/mcp-client.ts:118，apps/electron/src/main/modules/mcp-server-manager/dxt-processor/dxt-converter.ts:32
- 描述：应用可直接执行来自 DXT 扩展或导入配置中的命令，缺乏签名验证与白名单控制。
- 影响：用户导入恶意扩展或被恶意修改数据库时可能触发任意本地命令执行。
- 建议：在加载前校验扩展来源、要求用户确认命令清单，并提供允许列表机制或代码签名校验。

## 其他观察
- 未发现使用 eval、new Function 等直接执行字符串的危险模式；相关调用仅出现在 Playwright 测试环境。
- 网络访问均通过显式 fetch 或 tRPC 客户端完成，未发现隐藏的数据回传逻辑。

## 后续行动建议
1. 设计并实现凭据安全存储方案，覆盖令牌、服务器密钥与远程配置，并提供一次性迁移脚本。
2. 为 DXT/配置导入流程增加来源校验、用户提示与权限分级，防止无意中执行高风险命令。
3. 结合运行时日志与权限配置，补充针对上述风险的自动化测试与安全告警。

