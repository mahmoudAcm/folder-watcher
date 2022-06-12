import winston, { format } from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.json(),
    format.timestamp({
      format: () => new Date().toLocaleString('en'),
    }),
    format.prettyPrint(),
  ),
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({
      filename: 'error.log',
      dirname: 'build/logs',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'combined.log',
      dirname: 'build/logs',
    }),
  ],
});

export default logger;
