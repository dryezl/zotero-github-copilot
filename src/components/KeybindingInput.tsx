import React from "react";

export function KeybindingInput(props: {
  value: string;
  onChange(value: string): void;
}) {
  return (
    <input
      type="text"
      value={props.value}
      onChange={(event) => props.onChange(event.currentTarget.value)}
    />
  );
}
