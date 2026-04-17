import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import type { ChatMessage } from "../types";

export function Message({ message }: { message: ChatMessage }) {
  return (
    <div className={`zotero-copilot-message role-${message.role}`}>
      <ReactMarkdown
        components={{
          code(props) {
            const { children, className } = props;
            const language =
              (className || "").replace("language-", "") || "text";
            return (
              <SyntaxHighlighter language={language}>
                {String(children)}
              </SyntaxHighlighter>
            );
          },
        }}
      >
        {message.content}
      </ReactMarkdown>
    </div>
  );
}
