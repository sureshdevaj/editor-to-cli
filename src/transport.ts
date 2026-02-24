import * as vscode from 'vscode';

/** Resolved configuration values used by the transport layer. */
export interface TransportConfig {
  transport: 'auto' | 'terminal' | 'clipboard';
  terminalMatch: string;
  autoEnter: boolean;
}

/** Result of a transport operation. */
export interface TransportResult {
  /** True when the prompt was delivered successfully. */
  success: boolean;
  /** Human-readable status message to show the user. */
  message: string;
}

/**
 * Reads the transport-related settings from VS Code configuration and returns
 * a strongly-typed config object.
 */
export function readTransportConfig(): TransportConfig {
  const cfg = vscode.workspace.getConfiguration('editorToCli');

  const transport = cfg.get<'auto' | 'terminal' | 'clipboard'>('transport', 'auto');
  const terminalMatch = cfg.get<string>('terminalMatch', 'claude');
  const autoEnter = cfg.get<boolean>('autoEnter', false);

  return { transport, terminalMatch, autoEnter };
}

/**
 * Sends `prompt` to the appropriate destination based on `config`.
 *
 * "terminal"  → always inject into the active terminal.
 * "clipboard" → always copy to clipboard.
 * "auto"      → inject if a matching terminal exists, otherwise clipboard.
 */
export async function sendPrompt(
  prompt: string,
  config: TransportConfig
): Promise<TransportResult> {
  switch (config.transport) {
    case 'terminal':
      return sendToTerminal(prompt, config.autoEnter);

    case 'clipboard':
      return sendToClipboard(prompt);

    case 'auto':
    default:
      return sendAuto(prompt, config);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Injects `prompt` into the currently active terminal.
 *
 * Returns an error result when no active terminal is available – the caller
 * should decide whether to fall back to the clipboard.
 */
function sendToTerminal(
  prompt: string,
  autoEnter: boolean
): TransportResult {
  const terminal = vscode.window.activeTerminal;

  if (!terminal) {
    return {
      success: false,
      message: 'No active terminal found. Open a terminal and try again.',
    };
  }

  terminal.show(/* preserveFocus */ true);
  terminal.sendText(prompt, /* addNewLine */ autoEnter);

  const enterNote = autoEnter ? ' (Enter pressed automatically)' : '';
  return {
    success: true,
    message: `Prompt sent to terminal "${terminal.name}"${enterNote}.`,
  };
}

/** Copies `prompt` to the system clipboard. */
async function sendToClipboard(prompt: string): Promise<TransportResult> {
  try {
    await vscode.env.clipboard.writeText(prompt);
    return {
      success: true,
      message: 'Copied to clipboard (external terminal mode).',
    };
  } catch {
    return {
      success: false,
      message: 'Failed to write to clipboard. Please try again.',
    };
  }
}

/**
 * Auto-mode strategy:
 *   1. Find any terminal whose name contains `config.terminalMatch` (case-insensitive).
 *   2. If found → inject into that terminal (activating it first).
 *   3. Otherwise → copy to clipboard.
 */
async function sendAuto(
  prompt: string,
  config: TransportConfig
): Promise<TransportResult> {
  const matchingTerminal = findMatchingTerminal(config.terminalMatch);

  if (matchingTerminal) {
    matchingTerminal.show(/* preserveFocus */ true);
    matchingTerminal.sendText(prompt, /* addNewLine */ config.autoEnter);

    const enterNote = config.autoEnter ? ' (Enter pressed automatically)' : '';
    return {
      success: true,
      message: `Prompt sent to terminal "${matchingTerminal.name}"${enterNote}.`,
    };
  }

  // No matching terminal → fall back to clipboard.
  const clipboardResult = await sendToClipboard(prompt);
  if (clipboardResult.success) {
    return {
      success: true,
      message: `No terminal matching "${config.terminalMatch}" found. Copied to clipboard instead.`,
    };
  }

  return clipboardResult;
}

/**
 * Searches `vscode.window.terminals` for the first terminal whose name
 * contains `matchString` (case-insensitive).
 *
 * Returns `undefined` when there are no terminals or none match.
 */
function findMatchingTerminal(matchString: string): vscode.Terminal | undefined {
  const terminals = vscode.window.terminals;

  if (!terminals || terminals.length === 0) {
    return undefined;
  }

  const lower = matchString.toLowerCase();

  // Prefer the currently active terminal if it already matches.
  const active = vscode.window.activeTerminal;
  if (active && active.name.toLowerCase().includes(lower)) {
    return active;
  }

  // Otherwise scan all open terminals.
  return terminals.find((t) => t.name.toLowerCase().includes(lower));
}
