import type { CopilotAgent } from "../copilot/CopilotAgent";
import type { SettingTab } from "../settings/SettingTab";

export class AuthModal {
  constructor(
    private readonly agent: CopilotAgent,
    private readonly settings: SettingTab,
  ) {}

  async open(): Promise<void> {
    const client = this.agent.getClient();
    const auth = await client.initiateSignIn();
    this.showDeviceCodePrompt(auth.userCode, auth.verificationUri);
    await this.settings.saveSettings({
      chatSettings: {
        ...this.settings.getSettings().chatSettings,
        deviceCode: auth.userCode,
      },
    });
  }

  private showDeviceCodePrompt(
    userCode: string,
    verificationUri: string,
  ): void {
    const prompt = `GitHub Sign-in\nCode: ${userCode}\nOpen: ${verificationUri}`;
    (globalThis as any).Zotero?.alert?.(null, "GitHub Copilot", prompt);
  }
}
