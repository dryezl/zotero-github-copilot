import React from "react";
import { useChatStore } from "../store/chatStore";

export function ModelPicker() {
  const availableModels = useChatStore((state) => state.availableModels);
  const selectedModel = useChatStore((state) => state.selectedModel);
  const setSelectedModel = useChatStore((state) => state.setSelectedModel);

  return (
    <label>
      Model
      <select
        value={selectedModel.value}
        onChange={(event) => {
          const model = availableModels.find(
            (item) => item.value === event.currentTarget.value,
          );
          if (model) {
            setSelectedModel(model);
          }
        }}
      >
        {availableModels.map((model) => (
          <option key={model.value} value={model.value}>
            {model.label}
          </option>
        ))}
      </select>
    </label>
  );
}
