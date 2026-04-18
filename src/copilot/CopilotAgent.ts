import type { ZoteroCopilotSettings } from "../settings/SettingTab";
import { logger } from "../helpers/Logger";
import { testNodePath } from "../helpers/Node";

export type CopilotClient = {
  initiateSignIn(): Promise<{ userCode: string; verificationUri: string }>;
  signOut(): Promise<void>;
  getCompletions(prompt: string): Promise<string[]>;
  sendChatMessage(message: string, model?: string): Promise<string>;
};

function getNodeRequire(): ((name: string) => any) | undefined {
  const maybeRequire = (globalThis as any).require;
  return typeof maybeRequire === "function" ? maybeRequire : undefined;
}

export class CopilotAgent {
  private process: any = null;
  private client: CopilotClient;

  constructor(private readonly settingsProvider: () => ZoteroCopilotSettings) {
    this.client = {
      initiateSignIn: async () => ({
        userCode: "",
        verificationUri: "https://github.com/login/device",
      }),
      signOut: async () => undefined,
      getCompletions: async () => [],
      sendChatMessage: async (message: string) => `Echo: ${message}`,
    };
  }

  async setup(): Promise<boolean> {
    const settings = this.settingsProvider();
    const nodeValidation = testNodePath(settings.nodePath);
    if (!settings.enabled || !nodeValidation.valid) {
      logger.debug("Copilot agent setup skipped", {
        enabled: settings.enabled,
        nodePathValid: nodeValidation.valid,
      });
      return false;
    }

    const nodeRequire = getNodeRequire();
    if (!nodeRequire) {
      logger.debug(
        "No node require available; running without spawned process",
      );
      return true;
    }

    try {
      const { spawn } = nodeRequire("node:child_process");
      const profileDir =
        (globalThis as any).Zotero?.Profile?.dir ?? process.cwd();
      this.process = spawn(settings.nodePath, ["--version"], {
        cwd: profileDir,
        stdio: "ignore",
      });
      logger.debug("Copilot agent process started");
      return true;
    } catch (error) {
      logger.error("Failed to spawn Copilot agent", error);
      return false;
    }
  }

  stopAgent(): void {
    if (this.process?.kill) {
      this.process.kill();
    }
    this.process = null;
  }

  getClient(): CopilotClient {
    return this.client;
  }
}
