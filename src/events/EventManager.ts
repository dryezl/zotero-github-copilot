import { logger } from "../helpers/Logger";

export class EventManager {
  private notifierId: string | number | null = null;

  register(): void {
    const notifier = (globalThis as any).Zotero?.Notifier;
    if (!notifier?.registerObserver) {
      return;
    }

    this.notifierId = notifier.registerObserver(
      {
        notify: (event: string, type: string, ids: Array<string | number>) => {
          logger.debug("Notifier event", { event, type, ids });
        },
      },
      ["item", "collection", "library"],
      "zotero-github-copilot",
    );
  }

  unregister(): void {
    const notifier = (globalThis as any).Zotero?.Notifier;
    if (this.notifierId !== null && notifier?.unregisterObserver) {
      notifier.unregisterObserver(this.notifierId);
      this.notifierId = null;
    }
  }
}
