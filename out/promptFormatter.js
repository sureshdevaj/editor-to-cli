"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPrompt = formatPrompt;
/**
 * Builds a minimal reference string from a SelectionContext.
 *
 * Output format:
 * --------------------------------------------------
 * <relative_path>#L<start>-<end>
 * --------------------------------------------------
 */
function formatPrompt(ctx) {
    const { relativePath, startLine, endLine } = ctx;
    return `${relativePath}#L${startLine}-${endLine}`;
}
//# sourceMappingURL=promptFormatter.js.map