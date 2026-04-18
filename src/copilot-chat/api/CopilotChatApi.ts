import type { CopilotAgent } from "../../copilot/CopilotAgent";

export class CopilotChatApi {
  constructor(private readonly agent: CopilotAgent) {}

  async sendMessage(message: string, model?: string): Promise<string> {
    return this.agent.getClient().sendChatMessage(message, model);
  }
}
