import { createReportSchema, updateReportStatusSchema } from '../../src/validations/report.validation';
import { createUpdateSchema } from '../../src/validations/update.validation';
import { createCategorySchema } from '../../src/validations/category.validation';

describe('Validators', () => {
  describe('Category Validation', () => {
    it('deve validar categoria válida', () => {
      const validData = {
        name: 'Infraestrutura',
        description: 'Descrição da categoria'
      };

      const { error } = createCategorySchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('deve rejeitar nome muito curto', () => {
      const invalidData = {
        name: 'In'
      };

      const { error } = createCategorySchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('pelo menos 3 caracteres');
    });

    it('deve rejeitar nome muito longo', () => {
      const invalidData = {
        name: 'a'.repeat(101)
      };

      const { error } = createCategorySchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('no máximo 100 caracteres');
    });
  });

  describe('Report Validation', () => {
    it('deve validar denúncia válida', () => {
      const validData = {
        title: 'Vazamento no banheiro',
        description: 'Há um vazamento no banheiro do 2º andar que precisa de reparos',
        categoryId: 1,
        location: 'Bloco B, 2º andar',
        priority: 'ALTA',
        reporterName: 'João Silva'
      };

      const { error } = createReportSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('deve aceitar denúncia sem nome do registrante', () => {
      const validData = {
        title: 'Vazamento no banheiro',
        description: 'Há um vazamento no banheiro do 2º andar',
        categoryId: 1,
        location: 'Bloco B, 2º andar',
        priority: 'ALTA'
      };

      const { error } = createReportSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('deve rejeitar título muito curto', () => {
      const invalidData = {
        title: 'Vaz',
        description: 'Descrição válida',
        categoryId: 1,
        location: 'Local válido',
        priority: 'ALTA'
      };

      const { error } = createReportSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('deve rejeitar descrição muito curta', () => {
      const invalidData = {
        title: 'Título válido',
        description: 'Curta',
        categoryId: 1,
        location: 'Local válido',
        priority: 'ALTA'
      };

      const { error } = createReportSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('deve rejeitar prioridade inválida', () => {
      const invalidData = {
        title: 'Título válido',
        description: 'Descrição válida longa',
        categoryId: 1,
        location: 'Local válido',
        priority: 'URGENTE'
      };

      const { error } = createReportSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('deve validar status update válido', () => {
      const validData = {
        status: 'PROGRESSO',
        updatedBy: 'João Silva'
      };

      const { error } = updateReportStatusSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('deve rejeitar status inválido', () => {
      const invalidData = {
        status: 'INVALIDO',
        updatedBy: 'João'
      };

      const { error } = updateReportStatusSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('Update Validation', () => {
    it('deve validar atualização válida', () => {
      const validData = {
        comment: 'Equipe acionada para resolver o problema',
        updatedBy: 'João Silva'
      };

      const { error } = createUpdateSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('deve rejeitar comentário muito curto', () => {
      const invalidData = {
        comment: 'Oi',
        updatedBy: 'João'
      };

      const { error } = createUpdateSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('deve rejeitar updatedBy muito longo', () => {
      const invalidData = {
        comment: 'Comentário válido',
        updatedBy: 'a'.repeat(101)
      };

      const { error } = createUpdateSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
});
