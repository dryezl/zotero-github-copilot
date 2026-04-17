import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { Chat } from "../components/Chat";
import { PluginContext } from "../components/PluginContext";

export class ChatView {
  private root: Root | null = null;
  private container: HTMLElement | null = null;

  mount(options: {
    host: HTMLElement;
    sendMessage(message: string, model?: string): Promise<string>;
    invertEnterSendBehavior: boolean;
  }): void {
    this.container = options.host;
    this.root = createRoot(options.host);
    this.root.render(
      <PluginContext.Provider
        value={{
          sendMessage: options.sendMessage,
          invertEnterSendBehavior: options.invertEnterSendBehavior,
        }}
      >
        <Chat />
      </PluginContext.Provider>,
    );
  }

  unmount(): void {
    this.root?.unmount();
    this.root = null;
    this.container = null;
  }
}
