type LogLevel = "info" | "warn" | "error" | "debug";

class StructuredLogger {
  private formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const logObj = {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: process.env.NODE_ENV || "development",
      ...meta,
    };

    if (process.env.NODE_ENV === "production") {
      return JSON.stringify(logObj);
    } else {
      // Colorized logs for developer readability in development
      const colors = {
        info: "\x1b[36m[INFO]\x1b[0m",
        warn: "\x1b[33m[WARN]\x1b[0m",
        error: "\x1b[31m[ERROR]\x1b[0m",
        debug: "\x1b[35m[DEBUG]\x1b[0m",
      };
      return `${logObj.timestamp} ${colors[level]} ${message} ${meta ? JSON.stringify(meta) : ""}`;
    }
  }

  public info(message: string, meta?: Record<string, unknown>) {
    console.log(this.formatLog("info", message, meta));
  }

  public warn(message: string, meta?: Record<string, unknown>) {
    console.warn(this.formatLog("warn", message, meta));
  }

  public error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    const errorDetails = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { rawError: error };

    console.error(
      this.formatLog("error", message, {
        ...errorDetails,
        ...meta,
      })
    );
  }

  public debug(message: string, meta?: Record<string, unknown>) {
    console.log(this.formatLog("debug", message, meta));
  }

  /**
   * Tracks execution speed of synchronous or asynchronous operations.
   */
  public async track<T>(label: string, action: () => Promise<T> | T): Promise<T> {
    const start = performance.now();
    try {
      const result = await action();
      const duration = (performance.now() - start).toFixed(2);
      this.info(`${label} completed`, { durationMs: parseFloat(duration) });
      return result;
    } catch (err) {
      const duration = (performance.now() - start).toFixed(2);
      this.error(`${label} failed`, err, { durationMs: parseFloat(duration) });
      throw err;
    }
  }
}

export const logger = new StructuredLogger();
