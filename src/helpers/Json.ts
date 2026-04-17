export function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function stringifyJson(value: unknown, spacing = 2): string {
  return JSON.stringify(value, null, spacing);
}
