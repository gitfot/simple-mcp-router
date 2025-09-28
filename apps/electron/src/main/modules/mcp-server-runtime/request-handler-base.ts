import { TokenValidator } from "./token-validator";
import { getLogService } from "@/main/modules/mcp-logger/mcp-logger.service";
import { McpManagerRequestLogEntry as RequestLogEntry } from "@mcp_router/shared";

/**
 * Base class for request handlers with common error handling patterns
 */
export abstract class RequestHandlerBase {
  protected tokenValidator: TokenValidator;

  constructor(tokenValidator: TokenValidator) {
    this.tokenValidator = tokenValidator;
  }

  /**
   * Extract client ID from token
   */
  protected getClientId(token?: string): string {
    return token
      ? this.tokenValidator.validateToken(token).clientId || "unknownClient"
      : "unknownClient";
  }

  /**
   * Execute a request (workflow support removed, call handler directly)
   */
  protected async executeWithHooks<T>(
    _method: string,
    _params: any,
    _clientId: string,
    handler: () => Promise<T>,
    _additionalMetadata?: Record<string, any>,
  ): Promise<T> {
    return handler();
  }

  /**
   * Execute a request with logging
   */
  protected async executeWithHooksAndLogging<T>(
    method: string,
    params: any,
    clientId: string,
    serverName: string,
    requestType: string,
    handler: () => Promise<T>,
    additionalMetadata?: Record<string, any>,
  ): Promise<T> {
    // Create log entry
    const logEntry: RequestLogEntry = {
      timestamp: new Date().toISOString(),
      requestType,
      params,
      result: "success",
      duration: 0,
      clientId,
    };

    try {
      // Execute the actual handler
      const result = await handler();

      // Log success
      logEntry.response = result;
      logEntry.duration = Date.now() - new Date(logEntry.timestamp).getTime();
      getLogService().recordMcpRequestLog(logEntry, serverName);

      return result;
    } catch (error: any) {
      // Log error
      logEntry.result = "error";
      logEntry.errorMessage = error.message || String(error);
      logEntry.duration = Date.now() - new Date(logEntry.timestamp).getTime();
      getLogService().recordMcpRequestLog(logEntry, serverName);

      // Re-throw the original error
      throw error;
    }
  }
}
