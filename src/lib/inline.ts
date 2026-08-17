const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Renders a prose string from the JSON data files as HTML.
 * Supports `**bold**` and nothing else. Everything is escaped first, so
 * content files can't inject markup.
 */
export function renderInline(input: string): string {
  return input
    .replace(/[&<>"']/g, (c) => ESCAPES[c]!)
    .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
}
