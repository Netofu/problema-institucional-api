import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { ApiResponse, createPagination } from '../utils/apiResponse';

export class CategoryController {
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.createCategory(req.body);
      const response = ApiResponse.success(
        'Categoria criada com sucesso',
        category
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive } = req.query;
      const { page, limit, skip } = req.pagination;

      const filters: any = {};
      if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
      }

      const { data, total } = await CategoryService.getCategories(
        filters,
        { page, limit, skip }
      );

      const pagination = createPagination(page, limit, total);
      const response = ApiResponse.successWithPagination(
        'Categorias listadas com sucesso',
        data,
        pagination
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await CategoryService.getCategoryById(parseInt(id));
      const response = ApiResponse.success(
        'Categoria encontrada',
        category
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await CategoryService.updateCategory(
        parseInt(id),
        req.body
      );
      const response = ApiResponse.success(
        'Categoria atualizada com sucesso',
        category
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await CategoryService.deleteCategory(parseInt(id));
      const response = ApiResponse.success(result.message);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
