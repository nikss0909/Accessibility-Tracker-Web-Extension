const levels = {
  info: "info",
  warn: "warn",
  error: "error"
};

function write(level, message, meta = {}) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(typeof meta === "object" && meta !== null ? meta : { meta })
  };

  const line = JSON.stringify(entry);
  if (level === levels.error) {
    console.error(line);
  } else if (level === levels.warn) {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message, meta) => write(levels.info, message, meta),
  warn: (message, meta) => write(levels.warn, message, meta),
  error: (message, meta) => write(levels.error, message, meta),
  stream: {
    write: (message) => write(levels.info, message.trim())
  }
};
