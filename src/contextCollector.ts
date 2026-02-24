import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Represents the structured context extracted from the active editor selection.
 */
export interface SelectionContext {
  /** Relative path to the file from the workspace root (or absolute if outside workspace). */
  relativePath: string;
  /** 1-based start line number of the selection. */
  startLine: number;
  /** 1-based end line number of the selection. */
  endLine: number;
  /** The raw selected text. */
  selectedText: string;
  /** VS Code language identifier (e.g. "typescript", "python"). */
  languageId: string;
}

/**
 * Describes a recoverable failure during context collection.
 */
export interface CollectionError {
  message: string;
}

export type CollectionResult =
  | { ok: true; context: SelectionContext }
  | { ok: false; error: CollectionError };

/**
 * Collects all relevant context from the currently active editor and its selection.
 *
 * Returns a discriminated union so the caller can handle errors without exceptions.
 */
export function collectSelectionContext(): CollectionResult {
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
function resolveRelativePath(uri: vscode.Uri): string {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (workspaceFolders && workspaceFolders.length > 0) {
    // Pick the workspace folder that is the longest matching prefix of the file
    // URI – this handles multi-root workspaces correctly.
    let bestFolder: vscode.WorkspaceFolder | undefined;
    let bestLength = -1;

    for (const folder of workspaceFolders) {
      const folderPath = folder.uri.fsPath;
      if (
        uri.fsPath.startsWith(folderPath) &&
        folderPath.length > bestLength
      ) {
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
