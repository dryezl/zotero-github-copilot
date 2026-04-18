import { CopilotAgent } from "./copilot/CopilotAgent";
import { CopilotChatApi } from "./copilot-chat/api/CopilotChatApi";
import { ChatView } from "./copilot-chat/views/ChatView";
import { EventManager } from "./events/EventManager";
import { File } from "./helpers/File";
import { logger } from "./helpers/Logger";
import { testNodePath } from "./helpers/Node";
import { AuthModal } from "./modal/AuthModal";
import {
  DEFAULT_SETTINGS,
  SettingTab,
  type SettingsObserver,
} from "./settings/SettingTab";
import { StatusBar } from "./status/StatusBar";
import { showZoteroNotice } from "./utils/notifications";

let settingsTab: SettingTab | null = null;
let statusBar: StatusBar | null = null;
let eventManager: EventManager | null = null;
let chatView: ChatView | null = null;
let copilotAgent: CopilotAgent | null = null;
let authModal: AuthModal | null = null;
let chatContainer: HTMLElement | null = null;
const PREFERENCE_PANE_ID = "zotero-github-copilot-preferences";
const PREFERENCE_CONTAINER_ID = "zotero-github-copilot-table-container";
const ADDON_ID = "zotero-github-copilot@dryezl.com";

const settingsObserver: SettingsObserver = {
  onSettingsUpdate(settings) {
    logger.setDebugMode(settings.debug);
  },
};

async function registerPreferencePane(
  addonID: string,
  rootURI?: string,
): Promise<void> {
  const preferencePanes = (globalThis as any).Zotero?.PreferencePanes;
  if (!preferencePanes?.register || !rootURI) return;

  await preferencePanes.register({
    pluginID: addonID,
    id: PREFERENCE_PANE_ID,
    label: "Zotero GitHub Copilot",
    src: `${rootURI}content/preferences.xhtml`,
  });
}

function getRuntimeRootURI(rootURI?: string): string | undefined {
  return (
    rootURI ||
    (globalThis as any).rootURI ||
    (globalThis as any)._globalThis?.rootURI
  );
}

function getRuntimeAddonID(addonID?: string): string {
  return addonID || ADDON_ID;
}

function openPreferencePane(): boolean {
  const openPreferences = (globalThis as any).Zotero?.Utilities?.Internal
    ?.openPreferences;
  if (typeof openPreferences !== "function") return false;
  openPreferences(PREFERENCE_PANE_ID);
  return true;
}

function ensureAgentAssets(rootURI?: string): void {
  const profileDir = File.getProfileDir();
  const copilotDir = File.join(profileDir, "zotero-github-copilot", "agent");
  File.createFolder(copilotDir);
  File.createFile(
    File.join(copilotDir, "README.txt"),
    [
      "This folder stores extracted/copied GitHub Copilot agent assets for Zotero.",
      `Source bundle root: ${rootURI || "unknown"}`,
      "It is safe to delete this folder; it will be recreated on next startup.",
    ].join("\n"),
  );
}

function ensureChatPanel(): HTMLElement | null {
  const win = (globalThis as any).window;
  const doc = win?.document;
  if (!doc) return null;

  let panel = doc.getElementById("zotero-github-copilot-chat-panel");
  if (!panel) {
    panel = doc.createElement("div");
    panel.id = "zotero-github-copilot-chat-panel";
    panel.style.width = "360px";
    panel.style.borderLeft = "1px solid var(--color-border, #ccc)";
    panel.style.padding = "8px";
    (doc.getElementById("zotero-pane") || doc.body).appendChild(panel);
  }
  return panel as HTMLElement;
}

export async function startup({
  id,
  version,
  rootURI,
}: any = {}): Promise<void> {
  logger.log("startup", { id, version });
  const runtimeRootURI = getRuntimeRootURI(rootURI);
  const runtimeAddonID = getRuntimeAddonID(id);

  settingsTab = new SettingTab();
  settingsTab.registerObserver(settingsObserver);
  const settings = await settingsTab.loadSettings();
  await registerPreferencePane(runtimeAddonID, runtimeRootURI);

  statusBar = new StatusBar();
  statusBar.init(() => {
    if (!openPreferencePane()) {
      showZoteroNotice("Open Zotero GitHub Copilot settings from Preferences");
    }
  });

  logger.setDebugMode(settings.debug);

  ensureAgentAssets(runtimeRootURI);

  copilotAgent = new CopilotAgent(
    () => settingsTab?.getSettings() || DEFAULT_SETTINGS,
  );
  if (settings.enabled && testNodePath(settings.nodePath).valid) {
    await copilotAgent.setup();
  } else if (!settings.nodePath) {
    showZoteroNotice("Configure Node.js path (>=20) to enable inline Copilot");
  }

  eventManager = new EventManager();
  eventManager.register();

  chatView = new ChatView();
  chatContainer = ensureChatPanel();
  if (chatContainer && copilotAgent) {
    const api = new CopilotChatApi(copilotAgent);
    chatView.mount({
      host: chatContainer,
      sendMessage: (message, model) => api.sendMessage(message, model),
      invertEnterSendBehavior: settings.invertEnterSendBehavior,
    });
  }

  if (statusBar) {
    statusBar.setState(
      settings.chatSettings.accessToken.token
        ? "authenticated"
        : "not-authenticated",
    );
  }

  if (copilotAgent && settings.chatSettings.accessToken.token === null) {
    authModal = new AuthModal(copilotAgent, settingsTab);
  }
}

export function shutdown(): void {
  copilotAgent?.stopAgent();
  chatView?.unmount();
  chatContainer?.remove();
  chatContainer = null;
  eventManager?.unregister();
  statusBar?.destroy();
  settingsTab?.unmount();

  authModal = null;
  chatView = null;
  eventManager = null;
  statusBar = null;
  settingsTab = null;
  copilotAgent = null;
}

export function install(): void {
  logger.log("install");
}

export function uninstall(): void {
  logger.log("uninstall");
}

export function onPrefsEvent(event: string, { window }: any): void {
  if (event !== "load" || !settingsTab || !window?.document) return;
  const container = window.document.getElementById(PREFERENCE_CONTAINER_ID);
  if (!container) return;
  settingsTab.render(container);
}

export { SettingTab, DEFAULT_SETTINGS } from "./settings/SettingTab";
