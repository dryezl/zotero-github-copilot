export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

export interface ChatModel {
  label: string;
  value: string;
}

export const DEFAULT_MODELS: ChatModel[] = [
  { label: "GPT-4o", value: "gpt-4o" },
  { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet" },
];
