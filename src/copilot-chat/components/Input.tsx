import React, { useContext, useState } from "react";
import { PluginContext } from "./PluginContext";
import { useChatStore } from "../store/chatStore";
import { useLinkedItems } from "../hooks/useLinkedItems";

export function Input() {
  const [text, setText] = useState("");
  const { sendMessage, invertEnterSendBehavior } = useContext(PluginContext);
  const addMessage = useChatStore((state) => state.addMessage);
  const selectedModel = useChatStore((state) => state.selectedModel);

  const send = async () => {
    const content = text.trim();
    if (!content) return;

    const linkedItems = useLinkedItems(content);
    const enriched = linkedItems.length
      ? `${content}\n\nLinked Zotero items: ${linkedItems.join(", ")}`
      : content;

    const userMessage = {
      id: `${Date.now()}-user`,
      role: "user" as const,
      content,
      createdAt: Date.now(),
    };

    addMessage(userMessage);
    setText("");

    const response = await sendMessage(enriched, selectedModel.value);
    addMessage({
      id: `${Date.now()}-assistant`,
      role: "assistant",
      content: response,
      createdAt: Date.now(),
    });
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        onKeyDown={(e) => {
          const sendWithEnter = !invertEnterSendBehavior;
          if (sendWithEnter && e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void send();
          }
          if (!sendWithEnter && e.key === "Enter" && e.shiftKey) {
            e.preventDefault();
            void send();
          }
        }}
      />
      <button type="button" onClick={() => void send()}>
        Send
      </button>
    </div>
  );
}
