import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' }
  ]
});

prisma.$on('query', (e) => {
  logger.debug(`Query: ${e.query}`, { duration: e.duration });
});

prisma.$on('error', (e) => {
  logger.error(`Database error: ${e.message}`);
});

prisma.$on('info', (e) => {
  logger.info(`Database info: ${e.message}`);
});

prisma.$on('warn', (e) => {
  logger.warn(`Database warning: ${e.message}`);
});

export default prisma;
