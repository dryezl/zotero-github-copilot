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

const settingsObserver: SettingsObserver = {
  onSettingsUpdate(settings) {
    logger.setDebugMode(settings.debug);
  },
};

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

export async function startup({ id, version, rootURI }: any): Promise<void> {
  logger.log("startup", { id, version });

  settingsTab = new SettingTab();
  settingsTab.registerObserver(settingsObserver);
  const settings = await settingsTab.loadSettings();

  statusBar = new StatusBar();
  statusBar.init(() => {
    showZoteroNotice("Open Zotero GitHub Copilot settings from Preferences");
  });

  logger.setDebugMode(settings.debug);

  ensureAgentAssets(rootURI);

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

export { SettingTab, DEFAULT_SETTINGS } from "./settings/SettingTab";
