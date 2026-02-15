import { Request, Response, NextFunction } from 'express';
import { UpdateService } from '../services/update.service';
import { ApiResponse, createPagination } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export class UpdateController {
  static async createUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const update = await UpdateService.createUpdate(parseInt(id), req.body);
      const response = ApiResponse.success(
        'Atualização registrada com sucesso',
        update
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getUpdates(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { page, limit, skip } = req.pagination;

      const { data, total } = await UpdateService.getUpdatesByReportId(
        parseInt(id),
        { page, limit, skip }
      );

      const pagination = createPagination(page, limit, total);
      const response = ApiResponse.successWithPagination(
        'Atualizações listadas com sucesso',
        data,
        pagination
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
