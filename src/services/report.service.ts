import prisma from '../config/database';
import {
  ApiError,
  NotFoundError,
  ValidationError,
  ConflictError
} from '../utils/apiError';
import { STATUS_TRANSITIONS } from '../utils/constants';
import { logger } from '../utils/logger';

export class ReportService {
  static async createReport(data: {
    title: string;
    description: string;
    categoryId: number;
    location: string;
    priority: string;
    reporterName?: string;
  }) {
    try {
      // Verificar se a categoria existe e está ativa
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId, isActive: true }
      });

      if (!category) {
        throw new ValidationError('Categoria inválida ou inativa');
      }

      const report = await prisma.$transaction(async (tx) => {
        const report = await tx.report.create({
          data: {
            title: data.title,
            description: data.description,
            categoryId: data.categoryId,
            location: data.location,
            priority: data.priority,
            reporterName: data.reporterName
          }
        });

        // Criar registro inicial no histórico
        await tx.update.create({
          data: {
            reportId: report.id,
            comment: 'Registro inicial da denúncia',
            updatedBy: data.reporterName || 'Sistema',
            statusNew: 'ABERTA'
          }
        });

        return report;
      });

      logger.info('Denúncia criada', { reportId: report.id });
      return report;
    } catch (error) {
      logger.error('Erro ao criar denúncia', { error });
      throw error;
    }
  }

  static async getReports(
    filters: {
      categoryId?: number;
      status?: string;
      priority?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    pagination: { page: number; limit: number; skip: number }
  ) {
    try {
      const where: any = {};

      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.priority) {
        where.priority = filters.priority;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          select: {
            id: true,
            title: true,
            category: {
              select: {
                id: true,
                name: true
              }
            },
            location: true,
            priority: true,
            status: true,
            reporterName: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { createdAt: 'desc' },
          skip: pagination.skip,
          take: pagination.limit
        }),
        prisma.report.count({ where })
      ]);

      return {
        data: reports,
        total
      };
    } catch (error) {
      logger.error('Erro ao listar denúncias', { error });
      throw error;
    }
  }

  static async getReportById(id: number) {
    try {
      const report = await prisma.report.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          updates: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              comment: true,
              updatedBy: true,
              statusOld: true,
              statusNew: true,
              createdAt: true
            }
          }
        }
      });

      if (!report) {
        throw new NotFoundError('Denúncia não encontrada');
      }

      return report;
    } catch (error) {
      logger.error('Erro ao buscar denúncia', { reportId: id, error });
      throw error;
    }
  }

  static async updateReportStatus(
    id: number,
    data: { status: string; updatedBy: string }
  ) {
    try {
      const report = await prisma.report.findUnique({
        where: { id }
      });

      if (!report) {
        throw new NotFoundError('Denúncia não encontrada');
      }

      // Validar transição de status
      const validTransitions = STATUS_TRANSITIONS[report.status];
      if (!validTransitions.includes(data.status)) {
        throw new ValidationError(
          `Transição de status inválida. Status atual: ${report.status}, Status permitidos: ${validTransitions.join(', ')}`
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedReport = await tx.report.update({
          where: { id },
          data: { status: data.status }
        });

        await tx.update.create({
          data: {
            reportId: id,
            comment: `Status alterado de ${report.status} para ${data.status}`,
            updatedBy: data.updatedBy,
            statusOld: report.status,
            statusNew: data.status
          }
        });

        return updatedReport;
      });

      logger.info('Status da denúncia atualizado', {
        reportId: id,
        oldStatus: report.status,
        newStatus: data.status
      });

      return result;
    } catch (error) {
      logger.error('Erro ao atualizar status da denúncia', {
        reportId: id,
        error
      });
      throw error;
    }
  }
}
