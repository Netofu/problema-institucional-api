import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/database';
import { setupTestDatabase, teardownTestDatabase } from '../helpers/test-db.helper';

describe('Report Routes Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    // Limpar dados antes de cada teste
    await prisma.update.deleteMany();
    await prisma.report.deleteMany();
    await prisma.category.deleteMany();
  });

  describe('POST /api/reports', () => {
    it('deve criar uma denúncia com sucesso', async () => {
      // Criar categoria primeiro
      const category = await prisma.category.create({
        data: {
          name: 'Infraestrutura',
          description: 'Teste'
        }
      });

      const response = await request(app)
        .post('/api/reports')
        .send({
          title: 'Vazamento no banheiro',
          description: 'Há um vazamento no banheiro do 2º andar',
          categoryId: category.id,
          location: 'Bloco B, 2º andar',
          priority: 'ALTA',
          reporterName: 'João Silva'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('Vazamento no banheiro');
      expect(response.body.data.status).toBe('ABERTA');
    });

    it('deve retornar erro 400 quando categoria não existe', async () => {
      const response = await request(app)
        .post('/api/reports')
        .send({
          title: 'Vazamento no banheiro',
          description: 'Há um vazamento',
          categoryId: 999,
          location: 'Bloco B',
          priority: 'ALTA'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('deve retornar erro 400 quando título é muito curto', async () => {
      const category = await prisma.category.create({
        data: { name: 'Infraestrutura' }
      });

      const response = await request(app)
        .post('/api/reports')
        .send({
          title: 'Vaz',
          description: 'Há um vazamento no banheiro',
          categoryId: category.id,
          location: 'Bloco B',
          priority: 'ALTA'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/reports', () => {
    it('deve listar denúncias com paginação', async () => {
      // Criar dados de teste
      const category = await prisma.category.create({
        data: { name: 'Infraestrutura' }
      });

      await prisma.report.createMany({
        data: [
          {
            title: 'Report 1',
            description: 'Description 1',
            categoryId: category.id,
            location: 'Location 1',
            priority: 'ALTA',
            status: 'ABERTA'
          },
          {
            title: 'Report 2',
            description: 'Description 2',
            categoryId: category.id,
            location: 'Location 2',
            priority: 'MEDIA',
            status: 'PROGRESSO'
          }
        ]
      });

      const response = await request(app)
        .get('/api/reports')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(2);
    });

    it('deve filtrar denúncias por categoria', async () => {
      const category1 = await prisma.category.create({ data: { name: 'Cat1' } });
      const category2 = await prisma.category.create({ data: { name: 'Cat2' } });

      await prisma.report.create({
        data: {
          title: 'Report Cat1',
          description: 'Desc',
          categoryId: category1.id,
          location: 'Loc',
          priority: 'ALTA'
        }
      });

      await prisma.report.create({
        data: {
          title: 'Report Cat2',
          description: 'Desc',
          categoryId: category2.id,
          location: 'Loc',
          priority: 'MEDIA'
        }
      });

      const response = await request(app)
        .get('/api/reports')
        .query({ categoryId: category1.id });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category.id).toBe(category1.id);
    });

    it('deve filtrar denúncias por status', async () => {
      const category = await prisma.category.create({ data: { name: 'Test' } });

      await prisma.report.createMany({
        data: [
          {
            title: 'Open Report',
            description: 'Desc',
            categoryId: category.id,
            location: 'Loc',
            priority: 'ALTA',
            status: 'ABERTA'
          },
          {
            title: 'Progress Report',
            description: 'Desc',
            categoryId: category.id,
            location: 'Loc',
            priority: 'MEDIA',
            status: 'PROGRESSO'
          }
        ]
      });

      const response = await request(app)
        .get('/api/reports')
        .query({ status: 'ABERTA' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('ABERTA');
    });
  });

  describe('GET /api/reports/:id', () => {
    it('deve retornar denúncia por ID', async () => {
      const category = await prisma.category.create({
        data: { name: 'Infraestrutura' }
      });

      const report = await prisma.report.create({
        data: {
          title: 'Test Report',
          description: 'Test Description',
          categoryId: category.id,
          location: 'Test Location',
          priority: 'ALTA'
        }
      });

      const response = await request(app)
        .get(`/api/reports/${report.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(report.id);
      expect(response.body.data.title).toBe('Test Report');
    });

    it('deve retornar 404 para denúncia inexistente', async () => {
      const response = await request(app)
        .get('/api/reports/999');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/reports/:id/status', () => {
    it('deve atualizar status da denúncia', async () => {
      const category = await prisma.category.create({
        data: { name: 'Infraestrutura' }
      });

      const report = await prisma.report.create({
        data: {
          title: 'Test Report',
          description: 'Description',
          categoryId: category.id,
          location: 'Location',
          priority: 'ALTA',
          status: 'ABERTA'
        }
      });

      const response = await request(app)
        .patch(`/api/reports/${report.id}/status`)
        .send({
          status: 'PROGRESSO',
          updatedBy: 'Técnico João'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('PROGRESSO');

      // Verificar se histórico foi criado
      const updates = await prisma.update.findMany({
        where: { reportId: report.id }
      });
      expect(updates).toHaveLength(1);
      expect(updates[0].statusOld).toBe('ABERTA');
      expect(updates[0].statusNew).toBe('PROGRESSO');
