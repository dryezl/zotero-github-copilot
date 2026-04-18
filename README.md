# Zotero GitHub Copilot Plugin

A Zotero 9 bootstrap plugin that integrates GitHub Copilot-style assistance into Zotero.

## What this plugin provides

- Copilot chat sidebar mounted inside Zotero
- Typed settings panel with persisted preferences
- Device-specific settings support (`device_data.json`)
- Copilot agent process wrapper and auth modal scaffolding
- Status indicator and Zotero event integration

## Install in Zotero

### Option A: Install from a release (recommended)

1. Download the latest `.xpi` from this repository's **Releases** page.
2. Open Zotero.
3. Go to **Tools → Plugins** (or **Tools → Add-ons** depending on Zotero build).
4. Click the gear icon and choose **Install Add-on From File...**
5. Select the downloaded `.xpi`.
6. Restart Zotero if prompted.

### Option B: Example developer flow

```sh
npm install
npm run build
```

This creates `build/bootstrap.js` for the plugin runtime bundle.

## Configure in Zotero

After installing and launching Zotero:

1. Open plugin preferences for **Zotero GitHub Copilot**.
2. Set **Node binary path** to a Node.js 20+ executable.
3. Optional: set proxy URL and enable debug mode.
4. Use **Restart sign-in** to start device-code authentication.
5. Configure chat behavior (system prompt, Enter/Shift+Enter behavior).

## Usage in Zotero

### Example 1: Start a chat session

1. Open the Copilot chat sidebar.
2. Choose a model from the model picker.
3. Ask a question, for example:
   - `Summarize the key claims of [[My Paper Title]]`
4. Send the message and review the response in the chat stream.

### Example 2: Include Zotero item context

Use `[[item title]]` syntax in your prompt. The chat pipeline can resolve linked item titles and include related item context in the request flow.

### Example 3: Tune response behavior

- Set a custom **System prompt** in plugin settings.
- Toggle **Invert Enter/Shift+Enter behavior** to match your preferred send shortcut.

## Project structure

```text
src/
  main.ts
  settings/SettingTab.tsx
  copilot-chat/
  copilot/CopilotAgent.ts
  modal/AuthModal.tsx
  status/StatusBar.ts
  events/EventManager.ts
  helpers/
  components/
```

## Development commands

```sh
npm run lint:check
npm run build
npm test
```

## Notes

- This repository is focused on the Zotero GitHub Copilot plugin implementation.
- Template/demo content from the original scaffold has been removed from this README.
