import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { UpdateController } from '../controllers/update.controller';
import { validate } from '../middlewares/validation.middleware';
import { pagination } from '../middlewares/pagination.middleware';
import {
  createReportSchema,
  updateReportStatusSchema
} from '../validations/report.validation';
import { createUpdateSchema } from '../validations/update.validation';

const router = Router();

// Todas as rotas usam paginação
router.use(pagination);

// CRUD de Denúncias
router.post(
  '/',
  validate(createReportSchema),
  ReportController.createReport
);

router.get(
  '/',
  ReportController.getReports
);

router.get(
  '/:id',
  ReportController.getReport
);

// Status da Denúncia
router.patch(
  '/:id/status',
  validate(updateReportStatusSchema),
  ReportController.updateReportStatus
);

// Histórico de Atualizações
router.post(
  '/:id/updates',
  validate(createUpdateSchema),
  UpdateController.createUpdate
);

router.get(
  '/:id/updates',
  UpdateController.getUpdates
);

export default router;
