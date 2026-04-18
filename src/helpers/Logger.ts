export class Logger {
  private static instance: Logger;
  private debugMode = false;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setDebugMode(debugMode: boolean) {
    this.debugMode = debugMode;
  }

  debug(...args: unknown[]) {
    if (this.debugMode) {
      this.log("[debug]", ...args);
    }
  }

  log(...args: unknown[]) {
    if (typeof console !== "undefined") {
      console.log("[zotero-github-copilot]", ...args);
    }
  }

  error(...args: unknown[]) {
    if (typeof console !== "undefined") {
      console.error("[zotero-github-copilot]", ...args);
    }
  }
}

export const logger = Logger.getInstance();
