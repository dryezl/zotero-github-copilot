import { logger } from "./Logger";

function getNodeRequire(): ((name: string) => any) | undefined {
  const maybeRequire = (globalThis as any).require;
  return typeof maybeRequire === "function" ? maybeRequire : undefined;
}

export function testNodePath(path: string): {
  valid: boolean;
  version: string | null;
} {
  if (!path?.trim()) {
    return { valid: false, version: null };
  }

  const nodeRequire = getNodeRequire();
  if (!nodeRequire) {
    return { valid: false, version: null };
  }

  try {
    const { spawnSync } = nodeRequire("node:child_process");
    const result = spawnSync(path, ["--version"], { encoding: "utf8" });
    const version = String(result.stdout || "")
      .trim()
      .replace(/^v/, "");
    const major = Number(version.split(".")[0] || "0");
    return { valid: result.status === 0 && major >= 20, version };
  } catch (error) {
    logger.debug("Node path validation failed", error);
    return { valid: false, version: null };
  }
}
