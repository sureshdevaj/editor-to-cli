import * as vscode from 'vscode';
import { collectSelectionContext } from './contextCollector';
import { formatPrompt } from './promptFormatter';
import { readTransportConfig, sendPrompt } from './transport';

/**
 * Extension entry point – called by VS Code when the extension is activated.
 *
 * Registers the `codeToCli.attachSelection` command and pushes the disposable
 * into the extension context so it is cleaned up on deactivation.
 */
export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'editorToCli.attachSelection',
    handleAttachSelection
  );

  context.subscriptions.push(disposable);
}

/**
 * Command handler for `codeToCli.attachSelection`.
 *
 * Orchestrates the full pipeline:
 *   1. Collect selection context from the active editor.
 *   2. Format a structured AI-friendly prompt.
 *   3. Transport the prompt to the configured destination.
 *   4. Show a status message to the user.
 */
async function handleAttachSelection(): Promise<void> {
  // ── Step 1: Collect context ───────────────────────────────────────────────
  const collectionResult = collectSelectionContext();

  if (!collectionResult.ok) {
    vscode.window.showInformationMessage(
      `Editor to CLI: ${collectionResult.error.message}`
    );
    return;
  }

  const { context } = collectionResult;

  // ── Step 2: Format prompt ─────────────────────────────────────────────────
  const prompt = formatPrompt(context);

  // ── Step 3: Transport ─────────────────────────────────────────────────────
  const config = readTransportConfig();
  const result = await sendPrompt(prompt, config);

  // ── Step 4: Notify user ───────────────────────────────────────────────────
  if (result.success) {
    vscode.window.showInformationMessage(`Editor to CLI: ${result.message}`);
  } else {
    vscode.window.showWarningMessage(`Editor to CLI: ${result.message}`);
  }
}

/**
 * Called by VS Code when the extension is deactivated.
 * No explicit cleanup is required beyond the subscription disposables.
 */
export function deactivate(): void {
  // Intentionally empty – subscriptions are disposed automatically.
}
