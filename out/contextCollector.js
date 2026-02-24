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
exports.collectSelectionContext = collectSelectionContext;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
/**
 * Collects all relevant context from the currently active editor and its selection.
 *
 * Returns a discriminated union so the caller can handle errors without exceptions.
 */
function collectSelectionContext() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return {
            ok: false,
            error: { message: 'No active editor found. Open a file and select some code first.' },
        };
    }
    const selection = editor.selection;
    if (selection.isEmpty) {
        return {
            ok: false,
            error: { message: 'No text selected. Please highlight some code before using this command.' },
        };
    }
    const document = editor.document;
    const selectedText = document.getText(selection);
    // Resolve a workspace-relative path; fall back to the absolute path when the
    // file lives outside any open workspace folder.
    const relativePath = resolveRelativePath(document.uri);
    // VS Code selections are 0-based; convert to 1-based for human readability.
    const startLine = selection.start.line + 1;
    const endLine = selection.end.line + 1;
    return {
        ok: true,
        context: {
            relativePath,
            startLine,
            endLine,
            selectedText,
            languageId: document.languageId,
        },
    };
}
/**
 * Returns a path relative to the workspace root when possible.
 * If the file is outside every workspace folder, returns the absolute fsPath.
 */
function resolveRelativePath(uri) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        // Pick the workspace folder that is the longest matching prefix of the file
        // URI – this handles multi-root workspaces correctly.
        let bestFolder;
        let bestLength = -1;
        for (const folder of workspaceFolders) {
            const folderPath = folder.uri.fsPath;
            if (uri.fsPath.startsWith(folderPath) &&
                folderPath.length > bestLength) {
                bestFolder = folder;
                bestLength = folderPath.length;
            }
        }
        if (bestFolder) {
            // path.relative uses the OS separator; normalise to forward-slashes for
            // cross-platform consistency in the prompt output.
            const rel = path.relative(bestFolder.uri.fsPath, uri.fsPath);
            return rel.split(path.sep).join('/');
        }
    }
    // Outside workspace – use the absolute path.
    return uri.fsPath;
}
//# sourceMappingURL=contextCollector.js.map