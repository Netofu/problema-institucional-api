import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { validate } from '../middlewares/validation.middleware';
import { pagination } from '../middlewares/pagination.middleware';
import {
  createCategorySchema,
  updateCategorySchema
} from '../validations/category.validation';

const router = Router();

// Todas as rotas usam paginação
router.use(pagination);

// CRUD de Categorias
router.post(
  '/',
  validate(createCategorySchema),
  CategoryController.createCategory
);

router.get(
  '/',
  CategoryController.getCategories
);

router.get(
  '/:id',
  CategoryController.getCategory
);

router.put(
  '/:id',
  validate(updateCategorySchema),
  CategoryController.updateCategory
);

router.delete(
  '/:id',
  CategoryController.deleteCategory
);

export default router;
