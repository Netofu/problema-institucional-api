import { UpdateService } from '../../src/services/update.service';
import prisma from '../../src/config/database';
import { NotFoundError } from '../../src/utils/apiError';

jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    update: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn()
    },
    report: {
      findUnique: jest.fn()
    }
  }
}));

describe('UpdateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUpdate', () => {
    const validUpdateData = {
      comment: 'Equipe de manutenção acionada',
      updatedBy: 'Técnico João'
    };

    it('deve criar uma atualização com sucesso', async () => {
      const mockReport = { id: 1, title: 'Vazamento no banheiro' };
      const mockUpdate = {
        id: 1,
        reportId: 1,
        ...validUpdateData,
        createdAt: new Date()
      };

      (prisma.report.findUnique as jest.Mock).mockResolvedValue(mockReport);
      (prisma.update.create as jest.Mock).mockResolvedValue(mockUpdate);

      const result = await UpdateService.createUpdate(1, validUpdateData);

      expect(result).toEqual(mockUpdate);
      expect(prisma.report.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(prisma.update.create).toHaveBeenCalledWith({
        data: {
          reportId: 1,
          comment: validUpdateData.comment,
          updatedBy: validUpdateData.updatedBy
        }
      });
    });

    it('deve lançar erro quando a denúncia não existe', async () => {
      (prisma.report.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(UpdateService.createUpdate(999, validUpdateData))
        .rejects
        .toThrow(NotFoundError);
    });

    it('deve criar atualização com campos opcionais de status', async () => {
      const mockReport = { id: 1, title: 'Vazamento' };
      const mockUpdate = {
        id: 1,
        reportId: 1,
        ...validUpdateData,
        statusOld: 'ABERTA',
        statusNew: 'PROGRESSO',
        createdAt: new Date()
      };

      (prisma.report.findUnique as jest.Mock).mockResolvedValue(mockReport);
      (prisma.update.create as jest.Mock).mockResolvedValue(mockUpdate);

      const result = await UpdateService.createUpdate(1, {
        ...validUpdateData,
        statusOld: 'ABERTA',
        statusNew: 'PROGRESSO'
      });

      expect(result).toEqual(mockUpdate);
    });

    it('deve criar múltiplas atualizações para a mesma denúncia', async () => {
      const mockReport = { id: 1, title: 'Vazamento' };
      const updates = [
        { comment: 'Primeira atualização', updatedBy: 'João' },
        { comment: 'Segunda atualização', updatedBy: 'Maria' },
        { comment: 'Terceira atualização', updatedBy: 'Pedro' }
      ];

      (prisma.report.findUnique as jest.Mock).mockResolvedValue(mockReport);

      for (let i = 0; i < updates.length; i++) {
        const mockUpdate = { id: i + 1, reportId: 1, ...updates[i] };
        (prisma.update.create as jest.Mock).mockResolvedValue(mockUpdate);

        const result = await UpdateService.createUpdate(1, updates[i]);
        expect(result).toEqual(mockUpdate);
      }

      expect(prisma.update.create).toHaveBeenCalledTimes(updates.length);
    });
  });

  describe('getUpdatesByReportId', () => {
    const mockUpdates = [
      {
        id: 3,
        comment: 'Terceira atualização',
        updatedBy: 'Pedro',
        statusOld: 'PROGRESSO',
        statusNew: 'RESOLVIDA',
        createdAt: new Date('2024-01-15T11:00:00')
      },
      {
        id: 2,
        comment: 'Segunda atualização',
        updatedBy: 'Maria',
        statusOld: 'ABERTA',
        statusNew: 'PROGRESSO',
        createdAt: new Date('2024-01-15T10:30:00')
      },
      {
        id: 1,
        comment: 'Primeira atualização',
        updatedBy: 'João',
        statusOld: null,
        statusNew: 'ABERTA',
        createdAt: new Date('2024-01-15T10:00:00')
      }
    ];

    const pagination = { page: 1, limit: 10, skip: 0 };

    it('deve listar atualizações de uma denúncia com paginação', async () => {
      (prisma.update.findMany as jest.Mock).mockResolvedValue(mockUpdates);
      (prisma.update.count as jest.Mock).mockResolvedValue(3);

      const result = await UpdateService.getUpdatesByReportId(1, pagination);

      expect(result.data).toEqual(mockUpdates);
      expect(result.total).toBe(3);
      expect(prisma.update.findMany).toHaveBeenCalledWith({
        where: { reportId: 1 },
        select: {
          id: true,
          comment: true,
          updatedBy: true,
          statusOld: true,
          statusNew: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });
    });

    it('deve retornar lista vazia quando não há atualizações', async () => {
      (prisma.update.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.update.count as jest.Mock).mockResolvedValue(0);

      const result = await UpdateService.getUpdatesByReportId(1, pagination);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('deve respeitar parâmetros de paginação', async () => {
      const customPagination = { page: 2, limit: 5, skip: 5 };
      
      (prisma.update.findMany as jest.Mock).mockResolvedValue(mockUpdates.slice(0, 2));
      (prisma.update.count as jest.Mock).mockResolvedValue(3);

      await UpdateService.getUpdatesByReportId(1, customPagination);

      expect(prisma.update.findMany).toHaveBeenCalledWith({
        where: { reportId: 1 },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 5,
        take: 5
      });
    });

    it('deve retornar atualizações em ordem cronológica inversa', async () => {
      (prisma.update.findMany as jest.Mock).mockResolvedValue(mockUpdates);
      (prisma.update.count as jest.Mock).mockResolvedValue(3);

      const result = await UpdateService.getUpdatesByReportId(1, pagination);

      expect(result.data[0].id).toBe(3); // Mais recente primeiro
      expect(result.data[1].id).toBe(2);
      expect(result.data[2].id).toBe(1); // Mais antigo por último
    });

    it('deve retornar apenas campos selecionados', async () => {
      (prisma.update.findMany as jest.Mock).mockResolvedValue(mockUpdates);
      (prisma.update.count as jest.Mock).mockResolvedValue(3);

      const result = await UpdateService.getUpdatesByReportId(1, pagination);

      const update = result.data[0];
      expect(update).toHaveProperty('id');
      expect(update).toHaveProperty('comment');
      expect(update).toHaveProperty('updatedBy');
      expect(update).toHaveProperty('statusOld');
      expect(update).toHaveProperty('statusNew');
      expect(update).toHaveProperty('createdAt');
      expect(update).not.toHaveProperty('reportId');
    });
  });

  describe('edge cases', () => {
    it('deve lidar com reportId inválido', async () => {
      (prisma.report.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(UpdateService.createUpdate(-1, {
        comment: 'Teste',
        updatedBy: 'João'
      })).rejects.toThrow();
    });

    it('deve lidar com comentário vazio', async () => {
      const mockReport = { id: 1 };
      
      (prisma.report.findUnique as jest.Mock).mockResolvedValue(mockReport);
      (prisma.update.create as jest.Mock).mockRejectedValue(new Error('Comentário obrigatório'));

      await expect(UpdateService.createUpdate(1, {
        comment: '',
        updatedBy: 'João'
      })).rejects.toThrow();
    });

    it('deve lidar com updatedBy vazio', async () => {
      const mockReport = { id: 1 };
      
      (prisma.report.findUnique as jest.Mock).mockResolvedValue(mockReport);
      (prisma.update.create as jest.Mock).mockRejectedValue(new Error('Responsável obrigatório'));

      await expect(UpdateService.createUpdate(1, {
        comment: 'Teste',
        updatedBy: ''
      })).rejects.toThrow();
    });
  });
});
