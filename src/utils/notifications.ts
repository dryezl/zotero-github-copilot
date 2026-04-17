export function showZoteroNotice(message: string): void {
  const notifier = (globalThis as any).Zotero?.Notifier;
  if (notifier?.trigger) {
    notifier.trigger("refresh", "item", [], { message });
    return;
  }
  if (typeof console !== "undefined") {
    console.log(`[zotero-github-copilot] ${message}`);
  }
}
