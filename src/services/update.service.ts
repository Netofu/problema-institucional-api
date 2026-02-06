import prisma from '../config/database';
import { NotFoundError } from '../utils/apiError';
import { logger } from '../utils/logger';

export class UpdateService {
  static async createUpdate(
    reportId: number,
    data: { comment: string; updatedBy: string }
  ) {
    try {
      // Verificar se a denúncia existe
      const report = await prisma.report.findUnique({
        where: { id: reportId }
      });

      if (!report) {
        throw new NotFoundError('Denúncia não encontrada');
      }

      const update = await prisma.update.create({
        data: {
          reportId,
          comment: data.comment,
          updatedBy: data.updatedBy
        }
      });

      logger.info('Atualização registrada', {
        reportId,
        updateId: update.id
      });

      return update;
    } catch (error) {
      logger.error('Erro ao registrar atualização', { reportId, error });
      throw error;
    }
  }

  static async getUpdatesByReportId(
    reportId: number,
    pagination: { page: number; limit: number; skip: number }
  ) {
    try {
      const [updates, total] = await Promise.all([
        prisma.update.findMany({
          where: { reportId },
          select: {
            id: true,
            comment: true,
            updatedBy: true,
            statusOld: true,
            statusNew: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          skip: pagination.skip,
          take: pagination.limit
        }),
        prisma.update.count({ where: { reportId } })
      ]);

      return {
        data: updates,
        total
      };
    } catch (error) {
      logger.error('Erro ao listar atualizações', { reportId, error });
      throw error;
    }
  }
}
