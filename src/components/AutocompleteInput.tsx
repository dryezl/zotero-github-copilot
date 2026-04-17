import React from "react";

export function AutocompleteInput(props: {
  value: string;
  options: string[];
  onChange(value: string): void;
}) {
  const listId = "zotero-copilot-autocomplete-options";
  return (
    <>
      <input
        list={listId}
        value={props.value}
        onChange={(event) => props.onChange(event.currentTarget.value)}
      />
      <datalist id={listId}>
        {props.options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
}
