import React from "react";

export interface PluginContextType {
  sendMessage(message: string, model?: string): Promise<string>;
  invertEnterSendBehavior: boolean;
}

export const PluginContext = React.createContext<PluginContextType>({
  sendMessage: async () => "",
  invertEnterSendBehavior: false,
});
