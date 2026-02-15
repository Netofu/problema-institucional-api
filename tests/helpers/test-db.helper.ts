import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

export const setupTestDatabase = async () => {
  try {
    // Usar banco de dados de teste
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    
    // Executar migrações
    await execAsync('npx prisma migrate reset --force');
    
    console.log('Test database setup completed');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
};

export const teardownTestDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('Test database teardown completed');
  } catch (error) {
    console.error('Error tearing down test database:', error);
    throw error;
  }
};

export const clearDatabase = async () => {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
        );
      } catch (error) {
        console.log({ error });
      }
    }
  }
};

export const createTransaction = async <T>(
  callback: (tx: any) => Promise<T>
): Promise<T> => {
  return await prisma.$transaction(async (tx) => {
    return await callback(tx);
  });
};
