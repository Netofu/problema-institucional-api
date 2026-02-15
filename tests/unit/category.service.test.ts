import { CategoryService } from '../../src/services/category.service';
import prisma from '../../src/config/database';
import { ConflictError, NotFoundError } from '../../src/utils/apiError';

jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    category: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('CategoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    it('deve criar uma categoria com sucesso', async () => {
      const mockData = { name: 'Infraestrutura', description: 'Teste' };
      const mockCategory = { id: 1, ...mockData, isActive: true };

      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.category.create as jest.Mock).mockResolvedValue(mockCategory);

      const result = await CategoryService.createCategory(mockData);

      expect(result).toEqual(mockCategory);
      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { name: mockData.name }
      });
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: mockData
      });
    });

    it('deve lançar erro ao tentar criar categoria com nome duplicado', async () => {
      const mockData = { name: 'Infraestrutura', description: 'Teste' };
      const existingCategory = { id: 1, ...mockData };

      (prisma.category.findUnique as jest.Mock).mockResolvedValue(existingCategory);

      await expect(CategoryService.createCategory(mockData))
        .rejects
        .toThrow(ConflictError);
    });
  });

  describe('getCategoryById', () => {
    it('deve retornar uma categoria existente', async () => {
      const mockCategory = { id: 1, name: 'Teste', reports: [] };

      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);

      const result = await CategoryService.getCategoryById(1);

      expect(result).toEqual(mockCategory);
      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object)
      });
    });

    it('deve lançar erro quando categoria não existe', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(CategoryService.getCategoryById(999))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
