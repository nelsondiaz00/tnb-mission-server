import winston from 'winston';
import { threadId } from 'worker_threads';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      const threadInfo = threadId ? ` (Thread: ${threadId})` : '';
      return `${timestamp} [${level}]${threadInfo}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

export default logger;