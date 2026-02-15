import { PrismaClient, Priority, Status } from '@prisma/client';

const prisma = new PrismaClient();

export const createTestCategory = async (name: string = 'Test Category') => {
  return await prisma.category.create({
    data: {
      name: `${name}_${Date.now()}`,
      description: 'Test category description'
    }
  });
};

export const createTestReport = async (
  categoryId: number,
  overrides: Partial<any> = {}
) => {
  const defaultData = {
    title: 'Test Report',
    description: 'This is a test report description',
    location: 'Test Location',
    priority: Priority.MEDIA,
    status: Status.ABERTA,
    reporterName: 'Test User'
  };

  return await prisma.report.create({
    data: {
      ...defaultData,
      ...overrides,
      categoryId
    }
  });
};

export const createTestUpdate = async (
  reportId: number,
  overrides: Partial<any> = {}
) => {
  const defaultData = {
    comment: 'Test update comment',
    updatedBy: 'Test User'
  };

  return await prisma.update.create({
    data: {
      ...defaultData,
      ...overrides,
      reportId
    }
  });
};

export const createTestReportWithHistory = async () => {
  const category = await createTestCategory();
  const report = await createTestReport(category.id);

  const updates = [];
  for (let i = 0; i < 3; i++) {
    updates.push(
      await createTestUpdate(report.id, {
        comment: `Update ${i + 1}`,
        updatedBy: `User ${i + 1}`
      })
    );
  }

  return { category, report, updates };
};

export const generateMultipleReports = async (count: number) => {
  const category = await createTestCategory('Bulk Category');
  const reports = [];

  for (let i = 0; i < count; i++) {
    reports.push(
      await prisma.report.create({
        data: {
          title: `Bulk Report ${i + 1}`,
          description: `Description for bulk report ${i + 1}`,
          categoryId: category.id,
          location: `Location ${i + 1}`,
          priority: i % 3 === 0 ? Priority.ALTA : i % 3 === 1 ? Priority.MEDIA : Priority.BAIXA,
          status: i % 4 === 0 ? Status.ABERTA : 
                  i % 4 === 1 ? Status.PROGRESSO : 
                  i % 4 === 2 ? Status.RESOLVIDA : Status.FECHADA
        }
      })
    );
  }

  return { category, reports };
};
