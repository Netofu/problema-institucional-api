import { ReportService } from '../../src/services/report.service';
import prisma from '../../src/config/database';
import { ValidationError, NotFoundError, ConflictError } from '../../src/utils/apiError';
import { Priority, Status } from '@prisma/client';

// Mock do Prisma
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    report: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn()
    },
    category: {
      findUnique: jest.fn()
    },
    update: {
      create: jest.fn()
    },
    $transaction: jest.fn((callback) => callback(prisma))
  }
}));

describe('ReportService', () => {
  let reportService: ReportService;
  
  beforeEach(() => {
    reportService = new ReportService();
    jest.clearAllMocks();
  });

  describe('createReport', () => {
    const validReportData = {
      title: 'Vazamento no banheiro',
      description: 'Há um vazamento no banheiro do 2º andar',
      categoryId: 1,
      location: 'Bloco B, 2º andar',
      priority: 'ALTA',
      reporterName: 'João Silva'
    };

    it('deve criar uma denúncia com sucesso', async () => {
      // Mock da categoria existente
      const mockCategory = {
        id: 1,
        name: 'Infraestrutura',
        isActive: true
      };

      // Mock da denúncia criada
      const mockReport = {
        id: 1,
        ...validReportData,
        status: 'ABERTA',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.report.create as jest.Mock).mockResolvedValue(mockReport);
      (prisma.update.create as jest.Mock).mockResolvedValue({});

      const result = await ReportService.createReport(validReportData);

      expect(result).toEqual(mockReport);
      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: validReportData.categoryId, isActive: true }
      });
      expect(prisma.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: validReportData.title,
          description: validReportData.description,
          categoryId: validReportData.categoryId,
          location: validReportData.location,
          priority: validReportData.priority,
          reporterName: validReportData.reporterName
        })
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('deve lançar erro quando categoria não existe ou está inativa', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(ReportService.createReport(validReportData))
        .rejects
        .toThrow(ValidationError);
      await expect(ReportService.createReport(validReportData))
        .rejects
        .toThrow('Categoria inválida ou inativa');
    });

    it('deve criar denúncia sem nome do registrante', async () => {
      const dataWithoutReporter = {
        ...validReportData,
        reporterName: undefined
      };

      const mockCategory = { id: 1, name: 'Infraestrutura', isActive: true };
      const mockReport = { id: 1, ...dataWithoutReporter, status: 'ABERTA' };

      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.report.create as jest.Mock).mockResolvedValue(mockReport);
      (prisma.update.create as jest.Mock).mockResolvedValue({});

      const result = await ReportService.createReport(dataWithoutReporter);

      expect(result).toEqual(mockReport);
      expect(prisma.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reporterName: undefined
        })
      });
    });

    it('deve criar registro inicial no histórico automaticamente', async () => {
      const mockCategory = { id: 1, name: 'Infraestrutura', isActive: true };
      const mockReport = { id: 1, ...validReportData };

      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.report.create as jest.Mock).mockResolvedValue(mockReport);
      (prisma.update.create as jest.Mock).mockResolvedValue({});

      await ReportService.createReport(validReportData);

      expect(prisma.update.create).toHaveBeenCalledWith({
        data: {
          reportId: mockReport.id,
          comment: 'Registro inicial da denúncia',
          updatedBy: validReportData.reporterName,
          statusNew: 'ABERTA'
        }
      });
    });

    it('deve usar "Sistema" como updatedBy quando reporterName não é fornecido', async () => {
      const mockCategory = { id: 1, name: 'Infraestrutura', isActive: true };
      const mockReport = { id: 1, ...validReportData, reporterName: undefined };

      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.report.create as jest.Mock).mockResolvedValue(mockReport);
      (prisma.update.create as jest.Mock).mockResolvedValue({});

      await ReportService.createReport({
        ...validReportData,
        reporterName: undefined
      });

      expect(prisma.update.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          updatedBy: 'Sistema'
        })
      });
    });
  });

  describe('getReports', () => {
    const mockReports = [
      {
        id: 1,
        title: 'Vazamento no banheiro',
        category: { id: 1, name: 'Infraestrutura' },
        location: 'Bloco B',
        priority: 'ALTA',
        status: 'ABERTA',
        reporterName: 'João',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: 2,
        title: 'Projetor quebrado',
        category: { id: 2, name: 'Aulas' },
        location: 'Sala 301',
        priority: 'MEDIA',
        status: 'PROGRESSO',
        reporterName: 'Maria',
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-15')
      }
    ];

    const pagination = { page: 1, limit: 10, skip: 0 };

    it('deve listar denúncias com paginação', async () => {
      (prisma.report.findMany as jest.Mock).mockResolvedValue(mockReports);
      (prisma.report.count as jest.Mock).mockResolvedValue(2);

      const result = await ReportService.getReports({}, pagination);

      expect(result.data).toEqual(mockReports);
      expect(result.total).toBe(2);
      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: {},
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });
    });

    it('deve filtrar denúncias por categoria', async () => {
      const filters = { categoryId: 1 };
      
      (prisma.report.findMany as jest.Mock).mockResolvedValue([mockReports[0]]);
      (prisma.report.count as jest.Mock).mockResolvedValue(1);

      const result = await ReportService.getReports(filters, pagination);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].category.id).toBe(1);
      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: { categoryId: 1 },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });
    });

    it('deve filtrar denúncias por status', async () => {
      const filters = { status: 'ABERTA' };
      
      (prisma.report.findMany as jest.Mock).mockResolvedValue([mockReports[0]]);
      (prisma.report.count as jest.Mock).mockResolvedValue(1);

      const result = await ReportService.getReports(filters, pagination);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('ABERTA');
    });

    it('deve filtrar denúncias por prioridade', async () => {
      const filters = { priority: 'ALTA' };
      
      (prisma.report.findMany as jest.Mock).mockResolvedValue([mockReports[0]]);
      (prisma.report.count as jest.Mock).mockResolvedValue(1);

      const result = await ReportService.getReports(filters, pagination);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].priority).toBe('ALTA');
    });

    it('deve filtrar denúncias por período de datas', async () => {
      const startDate = new Date('2024-01-14');
      const endDate = new Date('2024-01-15');
      const filters = { startDate, endDate };
      
      (prisma.report.findMany as jest.Mock).mockResolvedValue(mockReports);
      (prisma.report.count as jest.Mock).mockResolvedValue(2);

      await ReportService.getReports(filters, pagination);

      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });
    });

    it('deve combinar múltiplos filtros', async () => {
      const filters = {
        categoryId: 1,
        status: 'ABERTA',
        priority: 'ALTA',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };
      
      (prisma.report.findMany as jest.Mock).mockResolvedValue([mockReports[0]]);
      (prisma.report.count as jest.Mock).mockResolvedValue(1);

      await ReportService.getReports(filters, pagination);

      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: {
          categoryId: 1,
          status: 'ABERTA',
          priority: 'ALTA',
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate
          }
        },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });
    });
  });

  describe('getReportById', () => {
    const mockReport = {
      id: 1,
      title: 'Vazamento no banheiro',
      description: 'Descrição detalhada',
      category: { id: 1, name: 'Infraestrutura' },
      location: 'Bloco B',
      priority: 'ALTA',
      status: 'ABERTA',
      reporterName: 'João',
      createdAt: new Date(),
      updatedAt: new Date(),
      updates: [
        {
          id: 1,
          comment: 'Registro inicial',
          updatedBy: 'João',
          statusOld: null,
          statusNew: 'ABERTA',
          createdAt: new Date()
        }
      ]
    };

    it('deve retornar denúncia por ID com histórico', async () => {
      (prisma.report.findUnique as jest.Mock).mockResolvedValue(mockReport);

      const result = await ReportService.getReportById(1);

      expect(result).toEqual(mockReport);
      expect(prisma.report.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          category: { select: { id: true, name: true, description: true } },
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
    });

    it('deve lançar erro quando denúncia não existe', async () => {
      (prisma.report.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(ReportService.getReportById(999))
        .rejects
        .toThrow(NotFoundError);
      await expect(ReportService.getReportById(999))
        .rejects
        .toThrow('Denúncia não encontrada');
    });
  });

  describe('updateReportStatus', () => {
    const mockReport = {
      id: 1,
      title: 'Vazamento no banheiro',
      status: 'ABERTA',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updateData = {
      status: 'PROGRESSO',
      updatedBy: 'Técnico João'
    };

    it('deve atualizar status da denúncia com sucesso', async () => {
      (prisma.report.findUnique as jest.Mock).mockResolvedValue(mockReport);
      (prisma.report.update as jest.Mock).mockResolvedValue({
        ...mockReport,
        status: updateData.status
      });
      (prisma.update.create as jest.Mock).mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      const result = await ReportService.updateReportStatus(1, updateData);

      expect(result.status).toBe(updateData.status);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.update.create).toHaveBeenCalledWith({
        data: {
          reportId: 1,
          comment: `Status alterado de ${mockReport.status} para ${updateData.status}`,
          updatedBy: updateData.updatedBy,
          statusOld: mockReport.status,
          statusNew: updateData.status
        }
      });
    });

    it('deve lançar erro quando denúncia não existe', async () => {
      (prisma.report.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(ReportService.updateReportStatus(999, updateData))
        .rejects
        .toThrow(NotFoundError);
    });

    it('deve lançar erro quando transição de status é inválida', async () => {
      const invalidTransitions = [
        { current: 'ABERTA', new: 'FECHADA' },
        { current: 'PROGRESSO', new: 'ABERTA' },
        { current: 'RESOLVIDA', new: 'PROGRESSO' },
        { current: 'FECHADA', new: 'ABERTA' },
        { current: 'CANCELADA', new: 'PROGRESSO' }
      ];

      for (const transition of invalidTransitions) {
        (prisma.report.findUnique as jest.Mock).mockResolvedValue({
          ...mockReport,
          status: transition.current
        });

        await expect(ReportService.updateReportStatus(1, {
          status: transition.new,
          updatedBy: 'Teste'
        })).rejects.toThrow(ValidationError);
      }
    });

    it('deve permitir transições válidas de status', async () => {
      const validTransitions = [
        { current: 'ABERTA', new: 'PROGRESSO' },
        { current: 'ABERTA', new: 'RESOLVIDA' },
        { current: 'ABERTA', new: 'CANCELADA' },
        { current: 'PROGRESSO', new: 'RESOLVIDA' },
        { current: 'PROGRESSO', new: 'CANCELADA' },
        { current: 'RESOLVIDA', new: 'FECHADA' }
      ];

      for (const transition of validTransitions) {
        (prisma.report.findUnique as jest.Mock).mockResolvedValue({
          ...mockReport,
          status: transition.current
        });
        (prisma.report.update as jest.Mock).mockResolvedValue({
          ...mockReport,
          status: transition.new
        });
        (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
          return await callback(prisma);
        });

        const result = await ReportService.updateReportStatus(1, {
          status: transition.new,
          updatedBy: 'Teste'
        });

        expect(result.status).toBe(transition.new);
      }
    });

    it('deve registrar histórico da mudança de status', async () => {
      (prisma.report.findUnique as jest.Mock).mockResolvedValue(mockReport);
      (prisma.report.update as jest.Mock).mockResolvedValue({
        ...mockReport,
        status: 'PROGRESSO'
      });
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      await ReportService.updateReportStatus(1, updateData);

      expect(prisma.update.create).toHaveBeenCalledWith({
        data: {
          reportId: 1,
          comment: `Status alterado de ${mockReport.status} para ${updateData.status}`,
          updatedBy: updateData.updatedBy,
          statusOld: mockReport.status,
          statusNew: updateData.status
        }
      });
    });
  });
});
