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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const contextCollector_1 = require("./contextCollector");
const promptFormatter_1 = require("./promptFormatter");
const transport_1 = require("./transport");
/**
 * Extension entry point – called by VS Code when the extension is activated.
 *
 * Registers the `codeToCli.attachSelection` command and pushes the disposable
 * into the extension context so it is cleaned up on deactivation.
 */
function activate(context) {
    const disposable = vscode.commands.registerCommand('editorToCli.attachSelection', handleAttachSelection);
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
async function handleAttachSelection() {
    // ── Step 1: Collect context ───────────────────────────────────────────────
    const collectionResult = (0, contextCollector_1.collectSelectionContext)();
    if (!collectionResult.ok) {
        vscode.window.showInformationMessage(`Editor to CLI: ${collectionResult.error.message}`);
        return;
    }
    const { context } = collectionResult;
    // ── Step 2: Format prompt ─────────────────────────────────────────────────
    const prompt = (0, promptFormatter_1.formatPrompt)(context);
    // ── Step 3: Transport ─────────────────────────────────────────────────────
    const config = (0, transport_1.readTransportConfig)();
    const result = await (0, transport_1.sendPrompt)(prompt, config);
    // ── Step 4: Notify user ───────────────────────────────────────────────────
    if (result.success) {
        vscode.window.showInformationMessage(`Editor to CLI: ${result.message}`);
    }
    else {
        vscode.window.showWarningMessage(`Editor to CLI: ${result.message}`);
    }
}
/**
 * Called by VS Code when the extension is deactivated.
 * No explicit cleanup is required beyond the subscription disposables.
 */
function deactivate() {
    // Intentionally empty – subscriptions are disposed automatically.
}
//# sourceMappingURL=extension.js.map