import React, { useState } from "react";
import ServerDetailsRemoveDialog from "@/renderer/components/mcp/server/server-details/ServerDetailsRemoveDialog";
import { MCPServer } from "@mcp_router/shared";
import { ScrollArea } from "@mcp_router/ui";
import {
  IconSearch,
  IconServer,
  IconPlus,
  IconRefresh,
  IconDownload,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useServerStore,
  useWorkspaceStore,
  useAuthStore,
} from "../stores";
import { showServerError } from "@/renderer/components/common";

// Import components
import { ServerErrorModal } from "@/renderer/components/common/ServerErrorModal";
import { ServerCardCompact } from "@/renderer/components/mcp/server/ServerCardCompact";
import { Link } from "react-router-dom";
import { Button } from "@mcp_router/ui";
import { LoginScreen } from "@/renderer/components/auth/LoginScreen";
import ServerDetailsAdvancedSheet from "@/renderer/components/mcp/server/server-details/ServerDetailsAdvancedSheet";
import { useServerEditingStore } from "@/renderer/stores";

const Home: React.FC = () => {
  const { t } = useTranslation();

  // Zustand stores
  const {
    servers,
    searchQuery,
    setSearchQuery,
    expandedServerId,
    startServer,
    stopServer,
    deleteServer,
    refreshServers,
    updateServerConfig,
  } = useServerStore();

  // Get workspace and auth state
  const { currentWorkspace } = useWorkspaceStore();
  const { isAuthenticated, login } = useAuthStore();

  // Filter servers based on search query and sort them
  const filteredServers = servers
    .filter((server) =>
      server.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  // State for server removal dialog (keeping local for now)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [serverToRemove, setServerToRemove] = useState<MCPServer | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // State for error modal
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorServer, setErrorServer] = useState<MCPServer | null>(null);

  // State for refresh
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for Advanced Settings
  const [advancedSettingsServer, setAdvancedSettingsServer] =
    useState<MCPServer | null>(null);
  const { initializeFromServer, setIsAdvancedEditing } =
    useServerEditingStore();

  // Toggle expanded server details - open settings
  const toggleServerExpand = (serverId: string) => {
    const server = servers.find((s) => s.id === serverId);
    if (server) {
      initializeFromServer(server);
      setAdvancedSettingsServer(server);
      setIsAdvancedEditing(true);
    }
  };

  // Handle opening remove dialog
  const openRemoveDialog = (server: MCPServer, e: React.MouseEvent) => {
    e.stopPropagation();
    setServerToRemove(server);
    setIsRemoveDialogOpen(true);
  };

  // Handle opening error modal
  const openErrorModal = (server: MCPServer, e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorServer(server);
    setErrorModalOpen(true);
  };

  // Handle server removal
  const handleRemoveServer = async () => {
    if (serverToRemove) {
      setIsRemoving(true);
      try {
        await deleteServer(serverToRemove.id);
        toast.success(t("serverDetails.removeSuccess"));
      } catch {
        toast.error(t("serverDetails.removeFailed"));
      } finally {
        setIsRemoveDialogOpen(false);
        setIsRemoving(false);
      }
    }
  };

  // Handle refresh servers
  const handleRefreshServers = async () => {
    setIsRefreshing(true);
    await refreshServers();
    setIsRefreshing(false);
  };

  // Handle export servers
  const handleExportServers = () => {
    // Convert servers array to mcpServers object format
    const mcpServers: Record<string, any> = {};

    servers.forEach((server) => {
      mcpServers[server.name] = {
        command: server.command,
        args: server.args || [],
        env: server.env || {},
      };
    });

    const exportData = {
      mcpServers: mcpServers,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `mcp-servers-${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // Show login screen for remote workspaces if not authenticated
  if (currentWorkspace?.type === "remote" && !isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("common.search")}
            className="w-full bg-background border border-border rounded-md py-1.5 px-3 pl-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <IconSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshServers}
          disabled={isRefreshing}
          className="gap-1"
          title={"Refresh Servers"}
        >
          <IconRefresh />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportServers}
          className="gap-1"
          title={"Export Servers"}
        >
          <IconDownload className="h-4 w-4" />
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-1">
          <Link to="/servers/add">
            <IconPlus className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden flex-1 mb-8">
        {filteredServers.length === 0 && searchQuery === "" ? (
          <div className="p-4 flex items-center justify-center">
            <div className="text-center">
              <IconServer className="w-16 h-16 mx-auto mb-4 opacity-40" />
              <div className="text-base font-medium mb-2">
                {t("serverList.noServers")}
              </div>
              <div className="text-sm opacity-75">
                <Link to="/servers/add">{t("serverList.addServer")}</Link>
              </div>
            </div>
          </div>
        ) : filteredServers.length === 0 && searchQuery !== "" ? (
          <div className="p-4 flex items-center justify-center">
            <div className="text-center">
              <IconSearch className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <div className="text-base font-medium mb-2">
                {t("common.search")}
              </div>
              <div className="text-sm opacity-75">
                {t("serverList.noServers")}
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredServers.map((server) => {
                const isExpanded = expandedServerId === server.id;

                return (
                  <React.Fragment key={server.id}>
                    <ServerCardCompact
                      server={server}
                      isExpanded={isExpanded}
                      onClick={() => toggleServerExpand(server.id)}
                      onToggle={async (checked) => {
                        try {
                          if (checked) {
                            await startServer(server.id);
                            toast.success(t("serverList.serverStarted"));
                          } else {
                            await stopServer(server.id);
                            toast.success(t("serverList.serverStopped"));
                          }
                        } catch (error) {
                          console.error("Server operation failed:", error);
                          showServerError(
                            error instanceof Error
                              ? error
                              : new Error(String(error)),
                            server.name,
                          );
                        }
                      }}
                      onRemove={() => {
                        setServerToRemove(server);
                        setIsRemoveDialogOpen(true);
                      }}
                      onError={() => {
                        setErrorServer(server);
                        setErrorModalOpen(true);
                      }}
                    />
                  </React.Fragment>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Server Remove Confirmation Dialog */}
      {serverToRemove && (
        <ServerDetailsRemoveDialog
          server={serverToRemove}
          isOpen={isRemoveDialogOpen}
          isLoading={isRemoving}
          setIsOpen={setIsRemoveDialogOpen}
          handleRemove={handleRemoveServer}
        />
      )}

      {/* Error Details Modal */}
      {errorServer && (
        <ServerErrorModal
          isOpen={errorModalOpen}
          onClose={() => setErrorModalOpen(false)}
          serverName={errorServer.name}
          errorMessage={errorServer.errorMessage}
        />
      )}

      {/* Advanced Settings Sheet */}
      {advancedSettingsServer && (
        <ServerDetailsAdvancedSheet
          server={advancedSettingsServer}
          handleSave={async (updatedInputParams?: any, editedName?: string) => {
            try {
              const {
                editedCommand,
                editedArgs,
                editedBearerToken,
                editedAutoStart,
                envPairs,
              } = useServerEditingStore.getState();

              const envObj: Record<string, string> = {};
              envPairs.forEach((pair) => {
                if (pair.key.trim()) {
                  envObj[pair.key.trim()] = pair.value;
                }
              });

              // inputParamsのdefault値をenvに反映
              const finalInputParams =
                updatedInputParams || advancedSettingsServer.inputParams;
              if (finalInputParams) {
                Object.entries(finalInputParams).forEach(
                  ([key, param]: [string, any]) => {
                    // envに値が設定されていない場合、default値を設定
                    if (
                      !envObj[key] &&
                      param.default !== undefined &&
                      param.default !== null &&
                      String(param.default).trim() !== ""
                    ) {
                      envObj[key] = String(param.default);
                    }
                  },
                );
              }

              const updatedConfig: any = {
                name: editedName || advancedSettingsServer.name,
                command: editedCommand,
                args: editedArgs,
                env: envObj,
                autoStart: editedAutoStart,
                inputParams: finalInputParams,
              };

              if (advancedSettingsServer.serverType !== "local") {
                updatedConfig.bearerToken = editedBearerToken;
              }

              await updateServerConfig(
                advancedSettingsServer.id,
                updatedConfig,
              );
              setIsAdvancedEditing(false);
              setAdvancedSettingsServer(null);
              toast.success(t("serverDetails.updateSuccess"));
            } catch (error) {
              console.error("Failed to update server:", error);
              toast.error(t("serverDetails.updateFailed"));
            }
          }}
        />
      )}
    </div>
  );
};

export default Home;
