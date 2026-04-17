import React, { useContext } from "react";
import { useChatStore } from "../store/chatStore";
import { Message } from "./Message";
import { Input } from "./Input";
import { ModelPicker } from "./ModelPicker";
import { ChatLayout } from "../layouts/ChatLayout";
import { PluginContext } from "./PluginContext";

export function Chat() {
  const messages = useChatStore((state) => state.messages);
  const { invertEnterSendBehavior } = useContext(PluginContext);

  return (
    <ChatLayout>
      <ModelPicker />
      <div>
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
      </div>
      <div>
        <small>
          Send shortcut: {invertEnterSendBehavior ? "Shift+Enter" : "Enter"}
        </small>
      </div>
      <Input />
    </ChatLayout>
  );
}
