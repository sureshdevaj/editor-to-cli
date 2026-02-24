import { SelectionContext } from './contextCollector';

/**
 * Builds a minimal reference string from a SelectionContext.
 *
 * Output format:
 * --------------------------------------------------
 * <relative_path>#L<start>-<end>
 * --------------------------------------------------
 */
export function formatPrompt(ctx: SelectionContext): string {
  const { relativePath, startLine, endLine } = ctx;
  return `${relativePath}#L${startLine}-${endLine}`;
}
