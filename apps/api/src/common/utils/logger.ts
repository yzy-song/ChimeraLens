import { LoggerService, Injectable, Scope } from '@nestjs/common';
import { createLogger, format, transports, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { type TransformableInfo } from 'logform';

const { combine, timestamp, json, errors, colorize, printf } = format;

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private logger: Logger;
  private context?: string;

  constructor() {
    const consoleFormat = combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      printf((info: TransformableInfo) => {
        const { timestamp, level, message, context, trace } = info;

        const messageStr = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
        const contextStr = context
          ? `[${typeof context === 'object' ? JSON.stringify(context) : String(context)}]`
          : '';
        const traceStr = trace ? `\n${typeof trace === 'object' ? JSON.stringify(trace, null, 2) : String(trace)}` : '';
        const ts = String(timestamp).slice(0, 19).replace('T', ' ');

        return `${ts} ${level}: ${contextStr} ${messageStr}${traceStr}`;
      }),
    );

    const fileFormat = combine(timestamp(), errors({ stack: true }), json());

    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      defaultMeta: { service: 'nail-salon' },
      transports: [
        new transports.Console({
          format: consoleFormat,
        }),
        new DailyRotateFile({
          format: fileFormat,
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '100m',
          maxFiles: '30d',
          zippedArchive: true,
        }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    const logContext = context || this.context;
    this.logger.info(message, { context: logContext });
  }

  error(message: any, trace?: string, context?: string) {
    const logContext = context || this.context;
    this.logger.error(message, { trace, context: logContext });
  }

  warn(message: any, context?: string) {
    const logContext = context || this.context;
    this.logger.warn(message, { context: logContext });
  }

  debug(message: any, context?: string) {
    const logContext = context || this.context;
    this.logger.debug(message, { context: logContext });
  }

  verbose(message: any, context?: string) {
    const logContext = context || this.context;
    this.logger.verbose(message, { context: logContext });
  }
}
