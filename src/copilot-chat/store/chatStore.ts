import { create } from "zustand";
import type { ChatMessage, ChatModel } from "../types";
import { DEFAULT_MODELS } from "../types";

interface ChatState {
  messages: ChatMessage[];
  selectedModel: ChatModel;
  availableModels: ChatModel[];
  addMessage(message: ChatMessage): void;
  setSelectedModel(model: ChatModel): void;
  clear(): void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  selectedModel: DEFAULT_MODELS[0],
  availableModels: DEFAULT_MODELS,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  clear: () => set({ messages: [] }),
}));
