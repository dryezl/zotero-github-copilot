import { logger } from "./Logger";

function getNodeRequire(): ((name: string) => any) | undefined {
  const maybeRequire = (globalThis as any).require;
  return typeof maybeRequire === "function" ? maybeRequire : undefined;
}

function toPathParts(path: string): string[] {
  return path.split(/[\\/]/).filter(Boolean);
}

function getOSFile() {
  return (globalThis as any).OS?.File;
}

export class File {
  static createFolder(path: string): void {
    const osFile = getOSFile();
    if (osFile?.makeDir) {
      void osFile.makeDir(path, { from: "/" });
      return;
    }

    const nodeRequire = getNodeRequire();
    if (!nodeRequire) return;
    const fs = nodeRequire("node:fs");
    fs.mkdirSync(path, { recursive: true });
  }

  static createFile(path: string, content = ""): void {
    const existing = File.readFileSync(path);
    if (existing !== null) return;
    void File.writeFile(path, content);
  }

  static readFileSync(path: string): string | null {
    const osFile = getOSFile();
    if (osFile?.read) {
      try {
        const bytes = osFile.read(path);
        const decoder = new TextDecoder();
        return decoder.decode(bytes);
      } catch {
        return null;
      }
    }

    const nodeRequire = getNodeRequire();
    if (!nodeRequire) return null;
    const fs = nodeRequire("node:fs");
    if (!fs.existsSync(path)) {
      return null;
    }
    return fs.readFileSync(path, "utf8");
  }

  static async writeFile(path: string, content: string): Promise<void> {
    const osFile = getOSFile();
    if (osFile?.writeAtomic) {
      const encoder = new TextEncoder();
      await osFile.writeAtomic(path, encoder.encode(content));
      return;
    }

    const nodeRequire = getNodeRequire();
    if (!nodeRequire) return;
    const fs = nodeRequire("node:fs/promises");
    await fs.mkdir(path.split(/[\\/]/).slice(0, -1).join("/") || ".", {
      recursive: true,
    });
    await fs.writeFile(path, content, "utf8");
  }

  static join(...parts: string[]): string {
    const joined = parts
      .flatMap((part) => toPathParts(part))
      .join("/")
      .replace(/\/\/+/, "/");
    return parts[0]?.startsWith("/") ? `/${joined}` : joined;
  }

  static getProfileDir(): string {
    if ((globalThis as any).Zotero?.Profile?.dir) {
      return (globalThis as any).Zotero.Profile.dir;
    }
    return process.cwd();
  }

  static async extractZip(
    _source: string,
    _destination: string,
  ): Promise<void> {
    const nodeRequire = getNodeRequire();
    if (!nodeRequire) return;
    try {
      const extract = nodeRequire("extract-zip");
      await extract(_source, { dir: _destination });
    } catch (error) {
      logger.debug("extractZip skipped", error);
    }
  }
}
