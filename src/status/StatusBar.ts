export type StatusState = "authenticated" | "not-authenticated" | "error";

export class StatusBar {
  private element: HTMLElement | null = null;

  init(onClick: () => void): void {
    const win = (globalThis as any).window;
    const doc = win?.document;
    if (!doc) return;

    const container =
      doc.getElementById("zotero-status-bar") ||
      doc.getElementById("status-bar") ||
      doc.body;

    if (!container) return;

    const el = doc.createElement("button");
    el.id = "zotero-github-copilot-status";
    el.textContent = "Copilot: Not signed in";
    el.addEventListener("click", onClick);
    container.appendChild(el);
    this.element = el;
  }

  setState(state: StatusState): void {
    if (!this.element) return;

    switch (state) {
      case "authenticated":
        this.element.textContent = "Copilot: Signed in";
        break;
      case "error":
        this.element.textContent = "Copilot: Error";
        break;
      default:
        this.element.textContent = "Copilot: Not signed in";
    }
  }

  destroy(): void {
    this.element?.remove();
    this.element = null;
  }
}
