import { api } from "../services/api";

type LogType = 'info' | 'warn' | 'error';

export const Logger = {
  log: (type: LogType, message: string, context?: any) => {
    // In production, this would send to an external service like Sentry, Datadog
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      context,
      url: window.location.href,
    };
    
    console[type](`[RetailOS-${type.toUpperCase()}]:`, logEntry);
    
    // Optional: Persist critical errors to backend
    if (type === 'error') {
      api.logError(logEntry).catch(() => {});
    }
  },
  
  info: (message: string, context?: any) => Logger.log('info', message, context),
  warn: (message: string, context?: any) => Logger.log('warn', message, context),
  error: (message: string, context?: any) => Logger.log('error', message, context),
};
