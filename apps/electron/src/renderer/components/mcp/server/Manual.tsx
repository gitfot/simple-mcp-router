import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { usePlatformAPI } from "@/renderer/platform-api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mcp_router/ui";
import { Button } from "@mcp_router/ui";
import {
  Upload,
  AlertTriangle,
  Plus,
  FileJson,
  X,
  ExternalLink,
  HardDrive,
  Globe,
  FileCode2,
  FileUp,
} from "lucide-react";
import {
  validateMcpServerJson,
  processMcpServerConfigs,
} from "./utils/mcp-server-utils";
import { toast } from "sonner";
import { Textarea } from "@mcp_router/ui";
import { Alert, AlertDescription, AlertTitle } from "@mcp_router/ui";
import { Input } from "@mcp_router/ui";
import { Label } from "@mcp_router/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mcp_router/ui";
import { v4 as uuidv4 } from "uuid";
import { MCPServerConfig } from "@mcp_router/shared";
import { Checkbox } from "@mcp_router/ui";
import { RadioGroup, RadioGroupItem } from "@mcp_router/ui";
import { useServerStore } from "@/renderer/stores";

interface EnvVariable {
  key: string;
  value: string;
}

const Manual: React.FC = () => {
  const { t } = useTranslation();
  const platformAPI = usePlatformAPI();
  const { createServer, refreshServers } = useServerStore();

  // JSON Import State
  const [jsonInput, setJsonInput] = useState("");
  const [isLoadingJson, setIsLoadingJson] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [importedServers, setImportedServers] = useState<any>(null);
  const [jsonFileName, setJsonFileName] = useState<string | null>(null);
  const jsonUploadInputRef = useRef<HTMLInputElement>(null);

  // Manual Configuration State
  const [serverName, setServerName] = useState("");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);
  const [isLoadingManual, setIsLoadingManual] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    serverName?: string;
    command?: string;
    args?: string;
  }>({});

  // Remote Server State
  const [remoteServerName, setRemoteServerName] = useState("");
  const [remoteServerUrl, setRemoteServerUrl] = useState("");
  const [bearerToken, setBearerToken] = useState("");
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [remoteServerType, setRemoteServerType] = useState<
    "remote" | "remote-streamable"
  >("remote");
  const [remoteValidationErrors, setRemoteValidationErrors] = useState<{
    serverName?: string;
    serverUrl?: string;
  }>({});
  const [autoStart, setAutoStart] = useState(false);

  // DXT Import State
  const [dxtFile, setDxtFile] = useState<File | null>(null);
  const [isLoadingDxt, setIsLoadingDxt] = useState(false);
  const [dxtError, setDxtError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: "", value: "" }]);
  };

  const removeEnvVar = (index: number) => {
    const newEnvVars = [...envVars];
    newEnvVars.splice(index, 1);
    setEnvVars(newEnvVars);
  };

  const updateEnvVar = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    const newEnvVars = [...envVars];
    newEnvVars[index][field] = value;
    setEnvVars(newEnvVars);
  };

  const validateJson = (
    input: string,
  ): { valid: boolean; error?: string; jsonData?: any } => {
    try {
      const result = validateMcpServerJson(input);

      if (!result.valid) {
        // Map generic error messages to localized ones
        if (result.error?.includes("Invalid JSON format")) {
          return {
            valid: false,
            error: t("importFromJson.errorInvalidFormat"),
          };
        } else if (result.error?.includes("No server configurations found")) {
          return {
            valid: false,
            error: t("importFromJson.errorEmptyMcpServers"),
          };
        } else if (result.error?.includes("Invalid server configuration for")) {
          const serverName = result.error.match(/'([^']+)'/)?.[1] || "";
          return {
            valid: false,
            error: t("importFromJson.errorInvalidServerConfig", { serverName }),
          };
        } else if (result.error?.includes("Missing or invalid command")) {
          const serverName = result.error.match(/'([^']+)'/)?.[1] || "";
          return {
            valid: false,
            error: t("importFromJson.errorMissingCommand", { serverName }),
          };
        } else if (result.error?.includes("Arguments must be an array")) {
          const serverName = result.error.match(/'([^']+)'/)?.[1] || "";
          return {
            valid: false,
            error: t("importFromJson.errorInvalidArgs", { serverName }),
          };
        } else if (result.error?.includes("Invalid JSON:")) {
          return { valid: false, error: t("importFromJson.errorInvalidJson") };
        }

        // Fallback error
        return { valid: false, error: result.error };
      }

      return { valid: true, jsonData: result.jsonData };
    } catch {
      return { valid: false, error: t("importFromJson.errorInvalidJson") };
    }
  };

  const handleJsonImport = async () => {
    // Reset error state
    setJsonError(null);

    // Validate JSON format
    const validation = validateJson(jsonInput);
    if (!validation.valid) {
      setJsonError(validation.error || t("importFromJson.errorUnknown"));
      return;
    }

    setIsLoadingJson(true);

    try {
      const jsonConfig = validation.jsonData!;

      // Set imported servers first for display
      setImportedServers(jsonConfig);
      setJsonFileName(null);

      // Extract server configurations - either from mcpServers or directly from root
      const serverConfigs = jsonConfig.mcpServers || jsonConfig;

      if (!serverConfigs || typeof serverConfigs !== "object") {
        throw new Error(
          "Invalid configuration: server configuration is missing or invalid",
        );
      }

      // Get existing servers to prevent duplicates
      const existingServers = await platformAPI.servers.list();
      const existingServerNames = new Set<string>(
        existingServers.map((server: any) => server.name as string),
      );

      // Process server configurations using the utility function
      const results = processMcpServerConfigs(
        serverConfigs,
        existingServerNames,
      );

      // Add processed servers to the system
      for (const result of results) {
        if (result.success && result.server) {
          try {
            // Add the server
            const serverResponse = await platformAPI.servers.create({
              type: "config",
              config: result.server,
            });
            result.server = serverResponse;
          } catch (error: any) {
            result.success = false;
            result.message = `Error adding server: ${error.message}`;
            delete result.server;
          }
        }
      }

      const success = results.some((r: any) => r.success);

      if (success) {
        // Show success message
        toast.success(
          t("importFromJson.successImport", { count: results.length }),
        );

        // Display detailed results
        const successCount = results.filter((r: any) => r.success).length;
        const failCount = results.filter((r: any) => !r.success).length;

        if (failCount > 0) {
          toast.error(
            t("importFromJson.partialSuccess", {
              success: successCount,
              fail: failCount,
            }),
          );
        }

        // Refresh servers list after successful import
        await refreshServers();
      } else {
        toast.error(t("importFromJson.errorFailedImport"));
      }
    } catch {
      toast.error(t("importFromJson.errorFailedImport"));
      setJsonError(t("importFromJson.errorUnknown"));
    } finally {
      setIsLoadingJson(false);
    }
  };

  const clearImportedServers = () => {
    setImportedServers(null);
    setJsonInput("");
    setJsonError(null);
    setJsonFileName(null);
    if (jsonUploadInputRef.current) {
      jsonUploadInputRef.current.value = "";
    }
  };

  const handleJsonFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setJsonInput(text);
      setJsonError(null);
      setImportedServers(null);
      setJsonFileName(file.name);
    };
    reader.onerror = () => {
      setJsonError(t("importFromJson.errorUnknown"));
      toast.error(t("importFromJson.errorFailedImport"));
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const resetForm = () => {
    setServerName("");
    setCommand("");
    setArgs("");
    setEnvVars([]);
    setValidationErrors({});
  };

  const resetRemoteForm = () => {
    setRemoteServerName("");
    setRemoteServerUrl("");
    setBearerToken("");
    setRemoteValidationErrors({});
    setRemoteServerType("remote");
    setAutoStart(false);
  };

  const handleDxtFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".dxt")) {
      setDxtError(t("manual.dxt.errorInvalidFile"));
      return;
    }

    setDxtFile(file);
    setDxtError(null);
  };

  const handleDxtImport = async () => {
    if (!dxtFile) return;

    setIsLoadingDxt(true);
    setDxtError(null);

    try {
      // For Electron, we need to save the file to a temporary location
      // and pass the file path to the main process
      const arrayBuffer = await dxtFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Process the DXT file on the main process
      await platformAPI.servers.create({
        type: "dxt",
        dxtFile: uint8Array,
      });
      // Show success toast
      toast.success(t("manual.dxt.successImport", { name: dxtFile.name }));

      // Refresh servers list
      await refreshServers();

      // Reset form
      setDxtFile(null);
      setDxtError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("manual.dxt.errorFailedImport");
      toast.error(errorMessage);
      setDxtError(errorMessage);
    } finally {
      setIsLoadingDxt(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: {
      serverName?: string;
      command?: string;
      args?: string;
    } = {};

    if (!serverName.trim()) {
      errors.serverName = t("manual.errors.nameRequired");
    }

    if (!command.trim()) {
      errors.command = t("manual.errors.commandRequired");
    }

    if (!args.trim()) {
      errors.args = t("manual.errors.argsRequired");
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRemoteForm = (): boolean => {
    const errors: {
      serverName?: string;
      serverUrl?: string;
    } = {};

    if (!remoteServerName.trim()) {
      errors.serverName = t("manual.errors.nameRequired");
    }

    if (!remoteServerUrl.trim()) {
      errors.serverUrl = t("manual.errors.urlRequired");
    }

    setRemoteValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleManualCreate = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoadingManual(true);

    try {
      // Split args into an array
      const argsArray = args.split(" ").filter((arg) => arg.trim() !== "");

      // Create the env object from the envVars array
      const envObject: Record<string, string> = {};
      for (const envVar of envVars) {
        if (envVar.key && envVar.value) {
          envObject[envVar.key] = envVar.value;
        }
      }

      // Create server config directly
      const serverConfig: MCPServerConfig = {
        id: uuidv4(),
        name: serverName,
        command: command,
        args: argsArray,
        env: envObject,
        autoStart: autoStart,
        disabled: false,
        serverType: "local",
      };

      // Add server using store method which handles refresh
      await createServer(serverConfig);
      toast.success(t("manual.successCreate", { name: serverName }));
      resetForm();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("manual.errorFailedCreate");
      toast.error(errorMessage);
    } finally {
      setIsLoadingManual(false);
    }
  };

  const connectToRemoteServer = async () => {
    if (!validateRemoteForm()) {
      return;
    }

    setIsLoadingRemote(true);

    try {
      const config: MCPServerConfig = {
        id: uuidv4(),
        name: remoteServerName,
        env: {},
        serverType: remoteServerType, // Using the selected server type
        remoteUrl: remoteServerUrl,
        bearerToken: bearerToken,
        autoStart: autoStart,
        disabled: false,
      };

      // Add server using store method which handles refresh
      await createServer(config);
      toast.success(
        t("manual.successConnectRemote", { name: remoteServerName }),
      );
      resetRemoteForm();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("manual.errorFailedConnectRemote");
      toast.error(errorMessage);
    } finally {
      setIsLoadingRemote(false);
    }
  };

  return (
    <div className="p-2 space-y-6">
      <Tabs defaultValue="json" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="json">
            <FileJson className="h-4 w-4 mr-2" />
            {t("manual.importFromJson")}
          </TabsTrigger>
          <TabsTrigger value="dxt">
            <FileCode2 className="h-4 w-4 mr-2" />
            {t("manual.importFromDxt")}
          </TabsTrigger>
          <TabsTrigger value="local">
            <HardDrive className="h-4 w-4 mr-2" />
            {t("manual.createManually")}
          </TabsTrigger>
          <TabsTrigger value="remote">
            <Globe className="h-4 w-4 mr-2" />
            {t("manual.remote.name")}
          </TabsTrigger>
        </TabsList>

        {/* JSON Import Section */}
        <TabsContent value="json">
          <Card className="w-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-medium">
                    <FileJson className="h-5 w-5 inline-block mr-2" />
                    {t("importFromJson.title")}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t("importFromJson.description")}
                  </CardDescription>
                </div>
                {importedServers && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearImportedServers}
                    title={t("common.clear")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="pb-4">
              <div className="flex flex-col space-y-4">
                {importedServers ? (
                  <div className="bg-muted/30 p-3 rounded-md text-xs text-muted-foreground font-mono whitespace-pre overflow-auto max-h-60">
                    {JSON.stringify(importedServers, null, 2)}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => jsonUploadInputRef.current?.click()}
                      >
                        <FileUp className="h-4 w-4" />
                        {t("serverDetails.selectFile")}
                      </Button>
                      {jsonFileName && (
                        <span className="text-xs text-muted-foreground truncate max-w-[60%]">
                          {jsonFileName}
                        </span>
                      )}
                    </div>
                    <input
                      ref={jsonUploadInputRef}
                      type="file"
                      accept=".json,.txt,application/json,text/plain"
                      className="hidden"
                      onChange={handleJsonFileChange}
                    />
                    <Textarea
                      value={jsonInput}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        setJsonInput(e.target.value);
                        setJsonError(null);
                        setJsonFileName(null);
                      }}
                      placeholder={`{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"],
      "env": {
        "PUPPETEER_LAUNCH_OPTIONS": "{ \\"headless\\": false }",
        "ALLOW_DANGEROUS": "true"
      }
    }
  }
}`}
                      className="font-mono h-80 text-sm"
                    />

                    {jsonError && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>
                          {t("importFromJson.errorTitle")}
                        </AlertTitle>
                        <AlertDescription>{jsonError}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleJsonImport}
                      disabled={isLoadingJson || !jsonInput.trim()}
                      className="flex items-center justify-center gap-2 w-full"
                    >
                      {isLoadingJson ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                          {t("common.loading")}
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          {t("importFromJson.import")}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DXT Import Section */}
        <TabsContent value="dxt">
          <Card className="w-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-medium">
                    <FileCode2 className="h-5 w-5 inline-block mr-2" />
                    {t("manual.dxt.title")}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t("manual.dxt.description")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-4">
              <div className="flex flex-col space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".dxt"
                    onChange={handleDxtFileSelect}
                    className="hidden"
                  />
                  {dxtFile ? (
                    <div className="space-y-4">
                      <FileCode2 className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{dxtFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(dxtFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDxtFile(null);
                            setDxtError(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          {t("manual.dxt.remove")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">
                        {t("manual.dxt.clickToUpload")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("manual.dxt.dxtFilesOnly")}
                      </p>
                    </div>
                  )}
                </div>

                {dxtError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t("manual.dxt.error")}</AlertTitle>
                    <AlertDescription>{dxtError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleDxtImport}
                  disabled={isLoadingDxt || !dxtFile}
                  className="flex items-center justify-center gap-2 w-full"
                >
                  {isLoadingDxt ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      {t("common.loading")}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      {t("manual.dxt.importServers")}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Local Server Configuration Section */}
        <TabsContent value="local">
          <Card className="w-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div>
                  <CardTitle className="text-lg font-medium">
                    <HardDrive className="h-5 w-5 inline-block mr-2" />
                    {t("manual.title")}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t("manual.description")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-4">
              <div className="flex flex-col space-y-4">
                <div className="space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="serverName" className="text-right">
                        {t("manual.remote.serverName")}{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                    </div>
                    <Input
                      id="serverName"
                      value={serverName}
                      onChange={(e) => {
                        setServerName(e.target.value);
                        if (validationErrors.serverName) {
                          setValidationErrors({
                            ...validationErrors,
                            serverName: undefined,
                          });
                        }
                      }}
                      placeholder="puppeteer"
                      className={
                        validationErrors.serverName ? "border-destructive" : ""
                      }
                    />
                    {validationErrors.serverName && (
                      <p className="text-xs text-destructive">
                        {validationErrors.serverName}
                      </p>
                    )}
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="command" className="text-right">
                        {t("manual.command")}{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                    </div>
                    <Input
                      id="command"
                      value={command}
                      onChange={(e) => {
                        setCommand(e.target.value);
                        if (validationErrors.command) {
                          setValidationErrors({
                            ...validationErrors,
                            command: undefined,
                          });
                        }
                      }}
                      placeholder="npx"
                      className={
                        validationErrors.command ? "border-destructive" : ""
                      }
                    />
                    {validationErrors.command && (
                      <p className="text-xs text-destructive">
                        {validationErrors.command}
                      </p>
                    )}
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="args" className="text-right">
                        {t("manual.args")}{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                    </div>
                    <Input
                      id="args"
                      value={args}
                      onChange={(e) => {
                        setArgs(e.target.value);
                        if (validationErrors.args) {
                          setValidationErrors({
                            ...validationErrors,
                            args: undefined,
                          });
                        }
                      }}
                      placeholder="-y @modelcontextprotocol/server-puppeteer"
                      className={
                        validationErrors.args ? "border-destructive" : ""
                      }
                    />
                    {validationErrors.args ? (
                      <p className="text-xs text-destructive">
                        {validationErrors.args}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {t("manual.argsHelp")}
                      </p>
                    )}
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Label>{t("serverDetails.environmentVariables")}</Label>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addEnvVar}
                        className="h-8"
                      >
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        {t("serverDetails.addEnvironmentVariable")}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {envVars.map((envVar, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            className="flex-1"
                            placeholder={t("serverDetails.key")}
                            value={envVar.key}
                            onChange={(e) =>
                              updateEnvVar(index, "key", e.target.value)
                            }
                          />
                          <Input
                            className="flex-1"
                            placeholder={t("serverDetails.value")}
                            value={envVar.value}
                            onChange={(e) =>
                              updateEnvVar(index, "value", e.target.value)
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEnvVar(index)}
                            className="h-9 w-9"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto-start-local"
                      checked={autoStart}
                      onCheckedChange={(checked) => setAutoStart(!!checked)}
                    />
                    <Label htmlFor="auto-start-local">
                      {t("manual.autoStart")}
                    </Label>
                  </div>

                  <Button
                    onClick={handleManualCreate}
                    disabled={isLoadingManual}
                    className="flex items-center justify-center gap-2 mt-4 w-full"
                  >
                    {isLoadingManual ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        {t("common.loading")}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        {t("manual.create")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Remote Server Configuration Section */}
        <TabsContent value="remote">
          <Card className="w-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div>
                  <CardTitle className="text-lg font-medium">
                    <Globe className="h-5 w-5 inline-block mr-2" />
                    {t("manual.remote.name")}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t("manual.remote.description")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-4">
              <div className="flex flex-col space-y-4">
                <div className="space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="remote-server-name"
                        className="text-right"
                      >
                        {t("manual.serverName")}{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                    </div>
                    <Input
                      id="remote-server-name"
                      value={remoteServerName}
                      onChange={(e) => {
                        setRemoteServerName(e.target.value);
                        if (remoteValidationErrors.serverName) {
                          setRemoteValidationErrors({
                            ...remoteValidationErrors,
                            serverName: undefined,
                          });
                        }
                      }}
                      placeholder="remote-mcp"
                      className={
                        remoteValidationErrors.serverName
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {remoteValidationErrors.serverName && (
                      <p className="text-xs text-destructive">
                        {remoteValidationErrors.serverName}
                      </p>
                    )}
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="remote-server-url" className="text-right">
                        {t("manual.remote.serverUrl")}{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                    </div>
                    <Input
                      id="remote-server-url"
                      value={remoteServerUrl}
                      onChange={(e) => {
                        setRemoteServerUrl(e.target.value);
                        if (remoteValidationErrors.serverUrl) {
                          setRemoteValidationErrors({
                            ...remoteValidationErrors,
                            serverUrl: undefined,
                          });
                        }
                      }}
                      placeholder="https://example.com/mcp"
                      className={
                        remoteValidationErrors.serverUrl
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {remoteValidationErrors.serverUrl && (
                      <p className="text-xs text-destructive">
                        {remoteValidationErrors.serverUrl}
                      </p>
                    )}
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="bearer-token" className="text-right">
                        {t("manual.remote.bearerToken")}
                      </Label>
                    </div>
                    <Input
                      id="bearer-token"
                      type="password"
                      value={bearerToken}
                      onChange={(e) => setBearerToken(e.target.value)}
                      placeholder="sk-xxxxxxxxxxxxxxxx"
                    />
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <Label className="text-right">
                      {t("manual.remote.transportType")}
                    </Label>
                    <RadioGroup
                      value={remoteServerType}
                      onValueChange={(value: "remote" | "remote-streamable") =>
                        setRemoteServerType(value)
                      }
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="remote" id="remote-sse" />
                        <Label htmlFor="remote-sse" className="cursor-pointer">
                          {t("manual.remote.transportSSE")}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="remote-streamable"
                          id="remote-streamable"
                        />
                        <Label
                          htmlFor="remote-streamable"
                          className="cursor-pointer"
                        >
                          {t("manual.remote.transportStreamable")}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto-start-remote"
                      checked={autoStart}
                      onCheckedChange={(checked) => setAutoStart(!!checked)}
                    />
                    <Label htmlFor="auto-start-remote">
                      {t("manual.autoStart")}
                    </Label>
                  </div>

                  <Button
                    onClick={connectToRemoteServer}
                    disabled={isLoadingRemote}
                    className="flex items-center justify-center gap-2 mt-4 w-full"
                  >
                    {isLoadingRemote ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        {t("common.loading")}
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4" />
                        {t("manual.remote.connect")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Manual;
