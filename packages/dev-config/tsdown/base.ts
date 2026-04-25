import type { InlineConfig, UserConfig } from "tsdown";

type TsdownLogger = NonNullable<UserConfig["customLogger"]>;

function formatLogMessages(messages: unknown[]): string {
  return messages.filter((message) => message !== undefined && message !== false).join(" ");
}

function getLogMessages(messages: unknown[]): unknown[] {
  return messages.filter((message) => message !== undefined && message !== false);
}

const quietWatchLogger: TsdownLogger = {
  level: "info",
  info: () => {},
  warn: () => {},
  warnOnce: () => {},
  error: (...messages: unknown[]) => {
    console.error(...getLogMessages(messages));
  },
  success: (...messages: unknown[]) => {
    console.log(formatLogMessages(messages));
  },
};

function baseTsdownConfig(inlineConfig?: InlineConfig): UserConfig {
  const isWatch = !!inlineConfig?.watch;
  return {
    format: "esm",
    dts: true,
    clean: !isWatch,
    report: !isWatch,
    customLogger: isWatch ? quietWatchLogger : undefined,
    outDir: "dist",
    unbundle: true,
    minify: !isWatch,
    fixedExtension: true,
    platform: "neutral",
    skipNodeModulesBundle: true,
  };
}

export { baseTsdownConfig };
