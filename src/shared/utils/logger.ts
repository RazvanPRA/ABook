const PREFIX = '[abook]';

/**
 * The app's only logging entry point. Silent in release builds (the app is offline, so nothing is
 * reported anywhere); in development it goes to the Metro console.
 */
export const logger = {
  warn(message: string, details?: unknown): void {
    if (__DEV__) {
      console.warn(`${PREFIX} ${message}`, details);
    }
  },
};
