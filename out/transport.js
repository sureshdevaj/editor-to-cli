"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.readTransportConfig = readTransportConfig;
exports.sendPrompt = sendPrompt;
const vscode = __importStar(require("vscode"));
/**
 * Reads the transport-related settings from VS Code configuration and returns
 * a strongly-typed config object.
 */
function readTransportConfig() {
    const cfg = vscode.workspace.getConfiguration('editorToCli');
    const transport = cfg.get('transport', 'auto');
    const terminalMatch = cfg.get('terminalMatch', 'claude');
    const autoEnter = cfg.get('autoEnter', false);
    return { transport, terminalMatch, autoEnter };
}
/**
 * Sends `prompt` to the appropriate destination based on `config`.
 *
 * "terminal"  → always inject into the active terminal.
 * "clipboard" → always copy to clipboard.
 * "auto"      → inject if a matching terminal exists, otherwise clipboard.
 */
async function sendPrompt(prompt, config) {
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
function sendToTerminal(prompt, autoEnter) {
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
async function sendToClipboard(prompt) {
    try {
        await vscode.env.clipboard.writeText(prompt);
        return {
            success: true,
            message: 'Copied to clipboard (external terminal mode).',
        };
    }
    catch {
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
async function sendAuto(prompt, config) {
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
function findMatchingTerminal(matchString) {
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
//# sourceMappingURL=transport.js.map