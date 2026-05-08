const levels = ["debug", "info", "warn", "error"] as const;
type Level = (typeof levels)[number];

const levelValues: Record<Level, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getLevel(): Level {
  return (process.env.LOG_LEVEL as Level) ?? "info";
}

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  if (levelValues[level] < levelValues[getLevel()]) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
};
