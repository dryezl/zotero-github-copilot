import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { File } from "../helpers/File";
import { parseJson, stringifyJson } from "../helpers/Json";
import { logger } from "../helpers/Logger";
import { testNodePath } from "../helpers/Node";

export interface ZoteroCopilotSettings {
  nodePath: string;
  nodePathUpdatedToNode20: boolean;
  enabled: boolean;
  suggestionDelay: number;
  debug: boolean;
  proxy: string;
  useDeviceSpecificSettings: boolean;
  deviceSpecificSettings: string[];
  systemPrompt: string;
  invertEnterSendBehavior: boolean;
  onlyOnHotkey: boolean;
  chatSettings: {
    deviceCode: string | null;
    pat: string | null;
    accessToken: { token: string | null; expiresAt: number | null };
    selectedModel?: { label: string; value: string };
  };
}

export interface SettingsObserver {
  onSettingsUpdate(settings: ZoteroCopilotSettings): void;
}

export const DEFAULT_SETTINGS: ZoteroCopilotSettings = {
  nodePath: "",
  nodePathUpdatedToNode20: false,
  enabled: true,
  suggestionDelay: 500,
  debug: false,
  proxy: "",
  useDeviceSpecificSettings: false,
  deviceSpecificSettings: ["nodePath"],
  systemPrompt:
    "You are GitHub Copilot integrated in Zotero. Use concise, actionable answers grounded in library context.",
  invertEnterSendBehavior: false,
  onlyOnHotkey: false,
  chatSettings: {
    deviceCode: null,
    pat: null,
    accessToken: { token: null, expiresAt: null },
    selectedModel: { label: "GPT-4o", value: "gpt-4o" },
  },
};

const PREF_KEY = "extensions.zotero.githubcopilot.settings";

function getPrefBranch() {
  const prefs = (globalThis as any).Zotero?.Prefs;
  return prefs ?? null;
}

function getNotificationCenter() {
  return (globalThis as any).Zotero?.Notifier ?? null;
}

function deepMerge<T>(base: T, patch: Partial<T>): T {
  if (Array.isArray(base) || Array.isArray(patch)) {
    if (Array.isArray(base) && Array.isArray(patch)) {
      return [...patch] as T;
    }
    return (patch ?? base) as T;
  }

  const clone: any = Array.isArray(base) ? [...(base as any)] : { ...base };
  for (const [key, value] of Object.entries(patch || {})) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof (clone as any)[key] === "object"
    ) {
      (clone as any)[key] = deepMerge((clone as any)[key], value as any);
    } else {
      (clone as any)[key] = value;
    }
  }
  return clone as T;
}

function debounce<T extends (...args: any[]) => void>(fn: T, waitMs = 1000): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), waitMs);
  }) as T;
}

export class SettingTab {
  private settings: ZoteroCopilotSettings = { ...DEFAULT_SETTINGS };
  private observers = new Set<SettingsObserver>();
  private root: Root | null = null;
  private readonly settingsFilePath = File.join(
    File.getProfileDir(),
    "zotero-github-copilot",
    "settings.json",
  );
  private readonly deviceFilePath = File.join(
    File.getProfileDir(),
    "zotero-github-copilot",
    "device_data.json",
  );

  registerObserver(observer: SettingsObserver): void {
    this.observers.add(observer);
  }

  unregisterObserver(observer: SettingsObserver): void {
    this.observers.delete(observer);
  }

  notifyObservers(): void {
    for (const observer of this.observers) {
      observer.onSettingsUpdate(this.settings);
    }
  }

  async loadSettings(): Promise<ZoteroCopilotSettings> {
    const prefs = getPrefBranch();
    const fromPref = prefs?.getString ? prefs.getString(PREF_KEY, "") : "";
    const fromFile = File.readFileSync(this.settingsFilePath) || "";
    const parsed = parseJson<Partial<ZoteroCopilotSettings>>(
      fromPref || fromFile || "{}",
      {},
    );

    const deviceRaw = File.readFileSync(this.deviceFilePath) || "{}";
    const deviceSettings = parseJson<Record<string, unknown>>(deviceRaw, {});

    const merged = deepMerge(DEFAULT_SETTINGS, parsed);
    if (merged.useDeviceSpecificSettings) {
      for (const key of merged.deviceSpecificSettings) {
        if (key in deviceSettings) {
          (merged as any)[key] = deviceSettings[key];
        }
      }
    }

    this.settings = merged;
    return this.settings;
  }

  getSettings(): ZoteroCopilotSettings {
    return this.settings;
  }

  private saveDebounced = debounce(async () => {
    await this.persistSettings();
    this.notifyObservers();
  }, 1000);

  async saveSettings(next: Partial<ZoteroCopilotSettings>): Promise<void> {
    this.settings = deepMerge(this.settings, next);
    this.saveDebounced();
  }

  async persistSettings(): Promise<void> {
    const prefs = getPrefBranch();
    const payload: Record<string, unknown> = { ...this.settings };

    const deviceData: Record<string, unknown> = {};
    if (this.settings.useDeviceSpecificSettings) {
      for (const key of this.settings.deviceSpecificSettings) {
        deviceData[key] = payload[key];
        delete payload[key];
      }
      File.createFolder(
        File.join(File.getProfileDir(), "zotero-github-copilot"),
      );
      await File.writeFile(this.deviceFilePath, stringifyJson(deviceData));
    }

    const serialized = stringifyJson(payload);
    if (prefs?.set) {
      prefs.set(PREF_KEY, serialized);
    }
    File.createFolder(File.join(File.getProfileDir(), "zotero-github-copilot"));
    await File.writeFile(this.settingsFilePath, serialized);

    this.showSaveNotice();
  }

  async testNodePath(path: string): Promise<boolean> {
    const result = testNodePath(path);
    const message = result.valid
      ? `Node path is valid (${result.version})`
      : "Node path is invalid or Node < 20";
    this.showNotice(message);
    return result.valid;
  }

  showSaveNotice(): void {
    this.showNotice("GitHub Copilot settings saved");
  }

  private showNotice(message: string): void {
    const notifier = getNotificationCenter();
    if (notifier?.trigger) {
      notifier.trigger("refresh", "item", [], { message });
      return;
    }
    logger.log(message);
  }

  render(container: HTMLElement): void {
    this.root?.unmount();
    this.root = createRoot(container);
    this.root.render(
      <SettingsPanel
        settings={this.settings}
        onChange={(update) => {
          void this.saveSettings(update);
        }}
        onTestNodePath={(path) => {
          void this.testNodePath(path);
        }}
      />,
    );
  }

  unmount(): void {
    this.root?.unmount();
    this.root = null;
  }
}

function SettingsPanel(props: {
  settings: ZoteroCopilotSettings;
  onChange(update: Partial<ZoteroCopilotSettings>): void;
  onTestNodePath(path: string): void;
}) {
  const { settings, onChange, onTestNodePath } = props;
  return (
    <div>
      <h2>Inline Copilot Settings</h2>
      <label>
        Enable
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => onChange({ enabled: e.currentTarget.checked })}
        />
      </label>
      <label>
        Node binary path
        <input
          type="text"
          value={settings.nodePath}
          onChange={(e) => onChange({ nodePath: e.currentTarget.value })}
        />
        <button type="button" onClick={() => onTestNodePath(settings.nodePath)}>
          Test the path
        </button>
      </label>
      <label>
        Suggestion delay (ms)
        <input
          type="number"
          min={0}
          value={settings.suggestionDelay}
          onChange={(e) =>
            onChange({ suggestionDelay: Number(e.currentTarget.value) })
          }
        />
      </label>
      <label>
        Only on hotkey
        <input
          type="checkbox"
          checked={settings.onlyOnHotkey}
          onChange={(e) => onChange({ onlyOnHotkey: e.currentTarget.checked })}
        />
      </label>
      <label>
        Use device-specific settings
        <input
          type="checkbox"
          checked={settings.useDeviceSpecificSettings}
          onChange={(e) =>
            onChange({ useDeviceSpecificSettings: e.currentTarget.checked })
          }
        />
      </label>
      <label>
        Proxy URL
        <input
          type="text"
          value={settings.proxy}
          onChange={(e) => onChange({ proxy: e.currentTarget.value })}
        />
      </label>
      <label>
        Debug mode
        <input
          type="checkbox"
          checked={settings.debug}
          onChange={(e) => onChange({ debug: e.currentTarget.checked })}
        />
      </label>
      <button
        type="button"
        onClick={() =>
          onChange({
            chatSettings: { ...settings.chatSettings, deviceCode: null },
          })
        }
      >
        Restart sign-in
      </button>
      <button
        type="button"
        onClick={() =>
          onChange({
            chatSettings: {
              ...settings.chatSettings,
              pat: null,
              accessToken: { token: null, expiresAt: null },
            },
          })
        }
      >
        Sign out
      </button>

      <h2>Copilot Chat Settings</h2>
      <label>
        Invert Enter/Shift+Enter behavior
        <input
          type="checkbox"
          checked={settings.invertEnterSendBehavior}
          onChange={(e) =>
            onChange({ invertEnterSendBehavior: e.currentTarget.checked })
          }
        />
      </label>
      <label>
        System prompt
        <textarea
          value={settings.systemPrompt}
          onChange={(e) => onChange({ systemPrompt: e.currentTarget.value })}
        />
      </label>
    </div>
  );
}
