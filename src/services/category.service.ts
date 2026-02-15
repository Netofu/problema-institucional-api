import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../utils/apiError';
import { logger } from '../utils/logger';

export class CategoryService {
  static async createCategory(data: { name: string; description?: string }) {
    try {
      // Verificar se já existe categoria com mesmo nome
      const existingCategory = await prisma.category.findUnique({
        where: { name: data.name }
      });

      if (existingCategory) {
        throw new ConflictError('Já existe uma categoria com este nome');
      }

      const category = await prisma.category.create({
        data: {
          name: data.name,
          description: data.description
        }
      });

      logger.info('Categoria criada', { categoryId: category.id });
      return category;
    } catch (error) {
      logger.error('Erro ao criar categoria', { error });
      throw error;
    }
  }

  static async getCategories(
    filters: { isActive?: boolean } = {},
    pagination: { page: number; limit: number; skip: number }
  ) {
    try {
      const where = filters.isActive !== undefined ? { isActive: filters.isActive } : {};

      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          where,
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { name: 'asc' },
          skip: pagination.skip,
          take: pagination.limit
        }),
        prisma.category.count({ where })
      ]);

      return {
        data: categories,
        total
      };
    } catch (error) {
      logger.error('Erro ao listar categorias', { error });
      throw error;
    }
  }

  static async getCategoryById(id: number) {
    try {
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          reports: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      if (!category) {
        throw new NotFoundError('Categoria não encontrada');
      }

      return category;
    } catch (error) {
      logger.error('Erro ao buscar categoria', { categoryId: id, error });
      throw error;
    }
  }

  static async updateCategory(
    id: number,
    data: { name?: string; description?: string; isActive?: boolean }
  ) {
    try {
      // Verificar se a categoria existe
      const existingCategory = await prisma.category.findUnique({
        where: { id }
      });

      if (!existingCategory) {
        throw new NotFoundError('Categoria não encontrada');
      }

      // Verificar conflito de nome
      if (data.name && data.name !== existingCategory.name) {
        const nameConflict = await prisma.category.findUnique({
          where: { name: data.name }
        });

        if (nameConflict) {
          throw new ConflictError('Já existe uma categoria com este nome');
        }
      }

      const category = await prisma.category.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          isActive: data.isActive
        }
      });

      logger.info('Categoria atualizada', { categoryId: id });
      return category;
    } catch (error) {
      logger.error('Erro ao atualizar categoria', { categoryId: id, error });
      throw error;
    }
  }

  static async deleteCategory(id: number) {
    try {
      // Verificar se a categoria existe
      const category = await prisma.category.findUnique({
        where: { id },
        include: { reports: true }
      });

      if (!category) {
        throw new NotFoundError('Categoria não encontrada');
      }

      // Verificar se há denúncias associadas
      if (category.reports.length > 0) {
        throw new ConflictError(
          'Não é possível excluir categoria com denúncias associadas'
        );
      }

      await prisma.category.delete({
        where: { id }
      });

      logger.info('Categoria excluída', { categoryId: id });
      return { message: 'Categoria excluída com sucesso' };
    } catch (error) {
      logger.error('Erro ao excluir categoria', { categoryId: id, error });
      throw error;
    }
  }
}
