export function env(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function envInt(name: string, defaultValue?: number): number {
  const value = process.env[name];
  if (!value) return defaultValue ?? 0;
  const n = parseInt(value, 10);
  if (isNaN(n)) throw new Error(`Invalid integer for ${name}: ${value}`);
  return n;
}

export function envBool(name: string, defaultValue?: boolean): boolean {
  const value = process.env[name];
  if (!value) return defaultValue ?? false;
  return value === "true" || value === "1";
}
