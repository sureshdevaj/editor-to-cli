# Editor to CLI

Attach selected code to AI CLI tools like Claude directly from VS Code — via terminal injection or clipboard — without leaving your editor.

**Repository:** [https://github.com/sureshdevaj/editor-to-cli](https://github.com/sureshdevaj/editor-to-cli)

---

## Features

- **Attach selected code to AI CLI** — one shortcut captures your selection with file and line context
- **Terminal-first transport** — inject the prompt directly into a named terminal (e.g. a running `claude` session)
- **Clipboard fallback** — automatically falls back to clipboard when no matching terminal is found
- **Configurable settings** — control transport mode, terminal name matching, and auto-enter behaviour
- **No telemetry** — zero data collection, no network calls, no tracking of any kind

---

## Usage

1. Open any source file in VS Code
2. **Select the code** you want to send to your AI CLI
3. Press **`Cmd+Shift+.`** (Mac) or **`Ctrl+Shift+.`** (Windows / Linux)

The extension will format your selection and deliver it to the configured destination.

---

## Keyboard Shortcut

| Platform | Shortcut |
|---|---|
| macOS | `Cmd + Shift + .` |
| Windows / Linux | `Ctrl + Shift + .` |

> Condition: only active when the editor is focused and text is selected.

---

## Transport Modes

| Mode | Behaviour |
|---|---|
| `auto` *(default)* | Looks for a terminal whose name contains `terminalMatch`. Injects if found, otherwise copies to clipboard. |
| `terminal` | Always injects into the currently active terminal. |
| `clipboard` | Always copies to clipboard — useful when your AI CLI runs outside VS Code. |

---

## Configuration

Open **Settings** (`Cmd+,` / `Ctrl+,`) and search for **Editor to CLI**, or edit your `settings.json` directly:

```json
{
  "editorToCli.transport": "auto",
  "editorToCli.terminalMatch": "claude",
  "editorToCli.autoEnter": false
}
```

| Setting | Type | Default | Description |
|---|---|---|---|
| `editorToCli.transport` | `"auto"` \| `"terminal"` \| `"clipboard"` | `"auto"` | How to deliver the prompt |
| `editorToCli.terminalMatch` | `string` | `"claude"` | Substring matched (case-insensitive) against terminal names in `auto` mode |
| `editorToCli.autoEnter` | `boolean` | `false` | Press Enter automatically after injecting into the terminal |

---

## No Telemetry

This extension does **not** collect any usage data, does not make any network requests, and does not use any external dependencies. It uses only the VS Code API.

---

## License

MIT
