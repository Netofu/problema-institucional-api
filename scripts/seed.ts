import prisma from '../src/config/database';
import { logger } from '../src/utils/logger';

async function seed() {
  try {
    logger.info('Iniciando seed do banco de dados...');

    // Categorias iniciais
    const categories = [
      {
        name: 'Infraestrutura',
        description: 'Problemas relacionados à infraestrutura física'
      },
      {
        name: 'Aulas',
        description: 'Problemas relacionados a aulas e ensino'
      },
      {
        name: 'Eventos',
        description: 'Problemas relacionados a eventos institucionais'
      },
      {
        name: 'Segurança',
        description: 'Problemas relacionados à segurança'
      },
      {
        name: 'Limpeza',
        description: 'Problemas relacionados à limpeza e conservação'
      }
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category
      });
    }

    logger.info('Seed concluído com sucesso!');
  } catch (error) {
    logger.error('Erro durante o seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
